from __future__ import annotations

import logging
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.billing import CheckoutRequest, CheckoutResponse, SubscriptionStatus
from app.services.billing.stripe_client import (
    PRICE_TO_TIER,
    get_tier_limits,
    tier_for_price,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for a subscription plan."""
    if request.price_id not in PRICE_TO_TIER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid price ID",
        )

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": request.price_id, "quantity": 1}],
            success_url=f"{settings.CORS_ORIGINS.split(',')[0]}/pricing?success=true",
            cancel_url=f"{settings.CORS_ORIGINS.split(',')[0]}/pricing?canceled=true",
            metadata={"tier": tier_for_price(request.price_id)},
        )
    except stripe.StripeError as e:
        logger.error("Stripe checkout session creation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create checkout session",
        )

    return CheckoutResponse(checkout_url=session.url)


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Handle incoming Stripe webhook events."""
    payload = await request.body()

    if not stripe_signature or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Missing signature or webhook secret")

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data_object, db)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(data_object, db)
    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(data_object, db)
    else:
        logger.info("Unhandled Stripe event type: %s", event_type)

    return {"status": "ok"}


async def _handle_checkout_completed(session: dict, db: AsyncSession) -> None:
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    customer_email = session.get("customer_details", {}).get("email")
    tier = session.get("metadata", {}).get("tier", "individual")

    if not customer_email:
        logger.warning("checkout.session.completed missing customer email")
        return

    result = await db.execute(select(User).where(User.email == customer_email))
    user = result.scalar_one_or_none()

    if user is None:
        logger.warning("No user found for email %s from Stripe checkout", customer_email)
        return

    user.stripe_customer_id = customer_id
    user.stripe_subscription_id = subscription_id
    user.subscription_tier = tier
    await db.commit()
    logger.info("User %s upgraded to %s tier", user.email, tier)


async def _handle_subscription_deleted(subscription: dict, db: AsyncSession) -> None:
    customer_id = subscription.get("customer")
    if not customer_id:
        return

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        logger.warning("No user found for Stripe customer %s", customer_id)
        return

    user.subscription_tier = "free"
    user.stripe_subscription_id = None
    await db.commit()
    logger.info("User %s downgraded to free tier (subscription deleted)", user.email)


async def _handle_payment_failed(invoice: dict, db: AsyncSession) -> None:
    customer_id = invoice.get("customer")
    if not customer_id:
        return

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        return

    logger.warning(
        "Payment failed for user %s (customer %s). "
        "Stripe will retry per its retry schedule.",
        user.email,
        customer_id,
    )


@router.get("/subscription", response_model=SubscriptionStatus)
async def get_subscription_status(
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's subscription status.

    Note: This endpoint is designed to work with get_current_user dependency
    from the auth module (feature/user-auth branch). Once merged, add the
    dependency to require authentication.
    """
    return SubscriptionStatus(
        subscription_tier="free",
        stripe_customer_id=None,
        active=True,
        **get_tier_limits("free"),
    )
