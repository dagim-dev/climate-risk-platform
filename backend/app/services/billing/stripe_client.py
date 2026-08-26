from __future__ import annotations

import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

SUBSCRIPTION_TIERS = {
    "free": {
        "analyses_per_month": 3,
        "max_saved_properties": 0,
        "pdf_download": False,
        "trend_charts": False,
        "team_access": False,
    },
    "individual": {
        "analyses_per_month": 50,
        "max_saved_properties": 25,
        "pdf_download": True,
        "trend_charts": False,
        "team_access": False,
    },
    "professional": {
        "analyses_per_month": 200,
        "max_saved_properties": -1,  # unlimited
        "pdf_download": True,
        "trend_charts": True,
        "team_access": False,
    },
    "business": {
        "analyses_per_month": -1,  # unlimited
        "max_saved_properties": -1,
        "pdf_download": True,
        "trend_charts": True,
        "team_access": True,
    },
}

PRICE_TO_TIER: dict[str, str] = {
    settings.STRIPE_PRICE_INDIVIDUAL: "individual",
    settings.STRIPE_PRICE_PROFESSIONAL: "professional",
    settings.STRIPE_PRICE_BUSINESS: "business",
}


def tier_for_price(price_id: str) -> str:
    return PRICE_TO_TIER.get(price_id, "free")


def get_tier_limits(tier: str) -> dict:
    return SUBSCRIPTION_TIERS.get(tier, SUBSCRIPTION_TIERS["free"])
