from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.address import Coordinates
from app.schemas.risk import ClimateRiskReport, HazardScore
from app.services.climate.flood_data import get_flood_zone_data
from app.services.climate.heat_data import get_heat_risk_data
from app.services.climate.hurricane_data import get_hurricane_data
from app.services.climate.wildfire_data import get_wildfire_data
from app.services.scoring.flood_scorer import score_flood_risk
from app.services.scoring.heat_scorer import score_heat_risk
from app.services.scoring.hurricane_scorer import score_hurricane_risk
from app.services.scoring.trend_builder import build_historical_trend
from app.services.scoring.wildfire_scorer import score_wildfire_risk
from app.services.scoring.helpers import clamp_score

FLOOD_WEIGHT = 0.30
HURRICANE_WEIGHT = 0.30
HEAT_WEIGHT = 0.20
WILDFIRE_WEIGHT = 0.20


def compute_overall_score(
    flood_risk: HazardScore,
    hurricane_risk: HazardScore,
    heat_risk: HazardScore,
    wildfire_risk: HazardScore,
) -> int:
    weighted = (
        flood_risk.score * FLOOD_WEIGHT
        + hurricane_risk.score * HURRICANE_WEIGHT
        + heat_risk.score * HEAT_WEIGHT
        + wildfire_risk.score * WILDFIRE_WEIGHT
    )
    return clamp_score(weighted)


def score_to_verdict(overall_score: int) -> str:
    if overall_score <= 35:
        return "Go"
    if overall_score <= 65:
        return "Caution"
    return "Avoid"


async def build_risk_report(coordinates: Coordinates) -> ClimateRiskReport:
    latitude = coordinates.latitude
    longitude = coordinates.longitude

    flood_data = await get_flood_zone_data(latitude, longitude)
    hurricane_data = await get_hurricane_data(latitude, longitude)
    heat_data = await get_heat_risk_data(latitude, longitude)
    wildfire_data = await get_wildfire_data(latitude, longitude)

    flood_risk = score_flood_risk(flood_data, latitude, longitude)
    hurricane_risk = score_hurricane_risk(hurricane_data, latitude, longitude)
    heat_risk = score_heat_risk(heat_data, latitude, longitude)
    wildfire_risk = score_wildfire_risk(wildfire_data, latitude, longitude)

    overall_risk_score = compute_overall_score(
        flood_risk,
        hurricane_risk,
        heat_risk,
        wildfire_risk,
    )

    historical_trend = build_historical_trend(
        flood_risk,
        hurricane_risk,
        heat_risk,
        wildfire_risk,
        heat_data,
        hurricane_data,
        wildfire_data,
        latitude,
        longitude,
    )

    return ClimateRiskReport(
        address=coordinates.formatted_address,
        latitude=latitude,
        longitude=longitude,
        flood_risk=flood_risk,
        hurricane_risk=hurricane_risk,
        heat_risk=heat_risk,
        wildfire_risk=wildfire_risk,
        overall_risk_score=overall_risk_score,
        verdict=score_to_verdict(overall_risk_score),
        ai_summary=None,
        generated_at=datetime.now(timezone.utc).isoformat(),
        historical_trend=historical_trend,
    )
