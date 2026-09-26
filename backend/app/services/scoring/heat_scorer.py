from __future__ import annotations

from app.schemas.risk import HazardScore
from app.services.climate.heat_data import HOT_DAY_THRESHOLD_F, HeatRiskData
from app.services.scoring.helpers import (
    clamp_score,
    score_to_severity,
    urban_heat_island_bonus,
)

# Days/year at or above HOT_DAY_THRESHOLD_F that map to a full-scale score (Phoenix is ~180).
MAX_EXTREME_HEAT_DAYS = 120.0
MAX_TREND_BONUS = 10.0
TREND_POINTS_PER_DAY_PER_DECADE = 0.5


def score_heat_risk(
    heat_data: HeatRiskData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    factors: list[str] = []

    extreme_days = heat_data.extreme_heat_days_per_year
    score = min(100.0, (extreme_days / MAX_EXTREME_HEAT_DAYS) * 100.0)
    if extreme_days > 0:
        factors.append(f"{extreme_days:.0f} days per year at or above {HOT_DAY_THRESHOLD_F}°F (NOAA)")

    uhi_bonus = urban_heat_island_bonus(latitude, longitude)
    if uhi_bonus > 0:
        score += uhi_bonus
        factors.append("Urban heat island effect in major metro area (+8 points)")

    trend = heat_data.hot_days_trend_per_decade
    if trend > 0:
        score += min(MAX_TREND_BONUS, trend * TREND_POINTS_PER_DAY_PER_DECADE)
    if heat_data.trend_direction == "increasing":
        factors.append(f"Hot days rising by about {trend:.0f} per decade over the last 30 years (NOAA)")

    if extreme_days > 0:
        confidence = "High" if extreme_days >= 30 else "Medium"
    else:
        confidence = "Low"

    final_score = clamp_score(score)
    return HazardScore(
        score=final_score,
        severity=score_to_severity(final_score),
        confidence=confidence,
        primary_factors=factors[:3] if factors else ["Limited historical temperature data available"],
    )
