from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.schemas.risk import HazardScore, TrendPoint
from app.services.climate.heat_data import HeatRiskData
from app.services.climate.hurricane_data import HurricaneData
from app.services.climate.wildfire_data import WildfireData
from app.services.scoring.helpers import clamp_score
from app.services.scoring.wildfire_scorer import FULL_EXPOSURE_BURNABLE_SHARE, whp_exposure

# Only today's scores are assessed. These years are illustrative linear projections from
# them; no historical scores are back-filled because none were observed.
PROJECTION_CHECKPOINTS = (2030, 2040, 2050)


def _heat_growth_rate(heat_data: HeatRiskData) -> float:
    rate = 0.45
    if heat_data.trend_direction == "increasing":
        rate += 0.25
    elif heat_data.trend_direction == "decreasing":
        rate -= 0.15
    if heat_data.hot_days_trend_per_decade > 10.0:
        rate += 0.15
    return rate


def _wildfire_growth_rate(wildfire_data: WildfireData) -> float:
    burnable_share, _, high_share = whp_exposure(wildfire_data.whp_class_shares)
    if high_share >= 0.2:
        return 0.55
    if burnable_share >= FULL_EXPOSURE_BURNABLE_SHARE or high_share > 0:
        return 0.35
    return 0.12


def _hurricane_growth_rate(hurricane_data: HurricaneData) -> float:
    if hurricane_data.hurricane_passes_100km > 0:
        return 0.4
    if hurricane_data.tropical_systems_100km > 0:
        return 0.25
    return 0.08


def _flood_growth_rate(flood_risk: HazardScore) -> float:
    # Mapped 1% annual chance / shallow-flooding zones score 60+.
    if flood_risk.score is not None and flood_risk.score >= 60:
        return 0.3
    return 0.1


def _projected(current_score: Optional[int], years_ahead: int, growth_rate: float) -> Optional[int]:
    if current_score is None:
        # An unassessed hazard has no baseline to project from.
        return None
    return clamp_score(current_score + growth_rate * years_ahead)


def build_historical_trend(
    flood_risk: HazardScore,
    hurricane_risk: HazardScore,
    heat_risk: HazardScore,
    wildfire_risk: HazardScore,
    heat_data: HeatRiskData,
    hurricane_data: HurricaneData,
    wildfire_data: WildfireData,
) -> list[TrendPoint]:
    """Today's assessed scores followed by projections flagged ``is_projection``."""
    current_year = datetime.now(timezone.utc).year
    rates = (
        (flood_risk, _flood_growth_rate(flood_risk)),
        (hurricane_risk, _hurricane_growth_rate(hurricane_data)),
        (heat_risk, _heat_growth_rate(heat_data)),
        (wildfire_risk, _wildfire_growth_rate(wildfire_data)),
    )

    trend: list[TrendPoint] = []
    for year in (current_year, *PROJECTION_CHECKPOINTS):
        if year < current_year:
            continue
        flood, hurricane, heat, wildfire = (
            _projected(hazard.score, year - current_year, rate) for hazard, rate in rates
        )
        trend.append(
            TrendPoint(
                year=year,
                flood_score=flood,
                hurricane_score=hurricane,
                heat_score=heat,
                wildfire_score=wildfire,
                is_projection=year != current_year,
            )
        )
    return trend
