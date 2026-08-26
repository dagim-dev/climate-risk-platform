from __future__ import annotations

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    price_id: str


class CheckoutResponse(BaseModel):
    checkout_url: str


class SubscriptionStatus(BaseModel):
    subscription_tier: str
    stripe_customer_id: str | None = None
    active: bool
    analyses_per_month: int
    max_saved_properties: int
    pdf_download: bool
    trend_charts: bool
