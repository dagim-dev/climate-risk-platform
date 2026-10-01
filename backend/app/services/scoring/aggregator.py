from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.schemas.address import Coordinates
from app.schemas.risk import ClimateRiskReport
from app.services.climate.flood_data import get_flood_zone_data
from app.services.climate.heat_data import HeatRiskData, get_heat_risk_data
from app.services.climate.hurricane_data import HurricaneData, get_hurricane_data
from app.services.climate.wildfire_data import WildfireData, get_wildfire_data
from app.services.scoring.flood_scorer import score_flood_risk
from app.services.scoring.hazard_utils import (
    compute_overall_score,
    score_hazard_from_source,
    compute_verdict,
    source_status_from_result,
)
from app.services.scoring.heat_scorer import score_heat_risk
from app.services.scoring.hurricane_scorer import score_hurricane_risk
from app.services.scoring.trend_builder import build_historical_trend
from app.services.scoring.wildfire_scorer import score_wildfire_risk


async def build_risk_report(coordinates: Coordinates) -> ClimateRiskReport:
    latitude = coordinates.latitude
    longitude = coordinates.longitude

    flood_result, hurricane_result, heat_result, wildfire_result = await asyncio.gather(
        get_flood_zone_data(latitude, longitude),
        get_hurricane_data(latitude, longitude),
        get_heat_risk_data(latitude, longitude),
        get_wildfire_data(latitude, longitude),
    )

    flood_risk = score_hazard_from_source(flood_result, score_flood_risk, latitude, longitude)
    hurricane_risk = score_hazard_from_source(
        hurricane_result, score_hurricane_risk, latitude, longitude
    )
    heat_risk = score_hazard_from_source(heat_result, score_heat_risk, latitude, longitude)
    wildfire_risk = score_hazard_from_source(
        wildfire_result, score_wildfire_risk, latitude, longitude
    )

    overall_risk_score, overall_status = compute_overall_score(
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
        heat_result.data or HeatRiskData(),
        hurricane_result.data or HurricaneData(),
        wildfire_result.data or WildfireData(),
    )

    verdict, verdict_reason = compute_verdict(
        overall_risk_score,
        overall_status,
        (flood_risk, hurricane_risk, heat_risk, wildfire_risk),
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
        overall_status=overall_status,
        verdict=verdict,
        verdict_reason=verdict_reason,
        sources={
            "fema_nfhl": source_status_from_result(flood_result),
            "ibtracs": source_status_from_result(hurricane_result),
            "noaa_heat": source_status_from_result(heat_result),
            "wfigs": source_status_from_result(wildfire_result),
        },
        ai_summary=None,
        generated_at=datetime.now(timezone.utc).isoformat(),
        historical_trend=historical_trend,
    )
