"""Tier-based feature gating utilities.

These functions enforce subscription-level limits. They are designed to be
called from endpoint handlers alongside the auth dependency that provides
the current user's subscription_tier.
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.services.billing.stripe_client import SUBSCRIPTION_TIERS


PAID_TIERS = frozenset({"individual", "professional", "business"})


def require_paid_tier(subscription_tier: str) -> None:
    if subscription_tier not in PAID_TIERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a paid subscription. Upgrade at /pricing.",
        )


def check_analysis_limit(subscription_tier: str, current_month_count: int) -> None:
    limits = SUBSCRIPTION_TIERS.get(subscription_tier, SUBSCRIPTION_TIERS["free"])
    max_analyses = limits["analyses_per_month"]
    if max_analyses == -1:
        return
    if current_month_count >= max_analyses:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Monthly analysis limit of {max_analyses} reached for "
                f"the {subscription_tier} tier. Upgrade for more analyses."
            ),
        )


def check_save_limit(subscription_tier: str, current_saved_count: int) -> None:
    limits = SUBSCRIPTION_TIERS.get(subscription_tier, SUBSCRIPTION_TIERS["free"])
    max_saved = limits["max_saved_properties"]
    if max_saved == -1:
        return
    if max_saved == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Saving properties requires a paid subscription. Upgrade at /pricing.",
        )
    if current_saved_count >= max_saved:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Saved property limit of {max_saved} reached for "
                f"the {subscription_tier} tier. Upgrade to save more."
            ),
        )


def can_download_pdf(subscription_tier: str) -> bool:
    limits = SUBSCRIPTION_TIERS.get(subscription_tier, SUBSCRIPTION_TIERS["free"])
    return limits["pdf_download"]


def can_view_trends(subscription_tier: str) -> bool:
    limits = SUBSCRIPTION_TIERS.get(subscription_tier, SUBSCRIPTION_TIERS["free"])
    return limits["trend_charts"]
