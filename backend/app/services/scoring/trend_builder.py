from __future__ import annotations

from datetime import datetime

from app.schemas.risk import HazardScore, TrendPoint
from app.services.climate.heat_data import HeatRiskData
from app.services.climate.hurricane_data import HurricaneData
from app.services.climate.wildfire_data import WildfireData
from app.services.scoring.helpers import clamp_score, is_within_miles_of_coast

HISTORICAL_CHECKPOINTS = (2000, 2010, 2020)
PROJECTION_CHECKPOINTS = (2030, 2040, 2050)


def _heat_growth_rate(heat_data: HeatRiskData) -> float:
    rate = 0.45
    if heat_data.trend_direction == "increasing":
        rate += 0.25
    elif heat_data.trend_direction == "decreasing":
        rate -= 0.15
    if heat_data.projected_2050_delta_c > 2.0:
        rate += 0.15
    return rate


def _wildfire_growth_rate(wildfire_data: WildfireData) -> float:
    if wildfire_data.wui_classification in {"High-WUI", "Intermix"}:
        return 0.55
    if wildfire_data.wui_classification == "Interface":
        return 0.35
    return 0.12


def _hurricane_growth_rate(
    hurricane_data: HurricaneData,
    latitude: float,
    longitude: float,
) -> float:
    coastal = is_within_miles_of_coast(latitude, longitude, miles=50)
    if coastal and hurricane_data.historical_storm_count > 0:
        return 0.4
    if coastal:
        return 0.25
    return 0.08


def _flood_growth_rate(latitude: float, longitude: float) -> float:
    if is_within_miles_of_coast(latitude, longitude, miles=25):
        return 0.3
    return 0.1


def _score_at_year(current_score: int, year: int, current_year: int, growth_rate: float) -> int:
    if year <= current_year:
        return clamp_score(current_score - growth_rate * (current_year - year))
    return clamp_score(current_score + growth_rate * (year - current_year))


def build_historical_trend(
    flood_risk: HazardScore,
    hurricane_risk: HazardScore,
    heat_risk: HazardScore,
    wildfire_risk: HazardScore,
    heat_data: HeatRiskData,
    hurricane_data: HurricaneData,
    wildfire_data: WildfireData,
    latitude: float,
    longitude: float,
) -> list[TrendPoint]:
    current_year = datetime.utcnow().year
    flood_rate = _flood_growth_rate(latitude, longitude)
    hurricane_rate = _hurricane_growth_rate(hurricane_data, latitude, longitude)
    heat_rate = _heat_growth_rate(heat_data)
    wildfire_rate = _wildfire_growth_rate(wildfire_data)

    trend: list[TrendPoint] = []

    for year in (*HISTORICAL_CHECKPOINTS, current_year):
        trend.append(
            TrendPoint(
                year=year,
                flood_score=_score_at_year(flood_risk.score, year, current_year, flood_rate),
                hurricane_score=_score_at_year(
                    hurricane_risk.score, year, current_year, hurricane_rate
                ),
                heat_score=_score_at_year(heat_risk.score, year, current_year, heat_rate),
                wildfire_score=_score_at_year(
                    wildfire_risk.score, year, current_year, wildfire_rate
                ),
                is_projection=False,
            )
        )

    for year in PROJECTION_CHECKPOINTS:
        trend.append(
            TrendPoint(
                year=year,
                flood_score=_score_at_year(flood_risk.score, year, current_year, flood_rate),
                hurricane_score=_score_at_year(
                    hurricane_risk.score, year, current_year, hurricane_rate
                ),
                heat_score=_score_at_year(heat_risk.score, year, current_year, heat_rate),
                wildfire_score=_score_at_year(
                    wildfire_risk.score, year, current_year, wildfire_rate
                ),
                is_projection=True,
            )
        )

    return trend
