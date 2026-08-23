from __future__ import annotations

from app.schemas.risk import HazardScore
from app.services.climate.heat_data import HeatRiskData
from app.services.scoring.helpers import (
    clamp_score,
    score_to_severity,
    urban_heat_island_bonus,
)

MAX_EXTREME_HEAT_DAYS = 90.0
PROJECTION_BASELINE_C = 2.0
PROJECTION_POINTS_PER_DEGREE = 5.0


def score_heat_risk(
    heat_data: HeatRiskData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    factors: list[str] = []

    extreme_days = heat_data.extreme_heat_days_per_year
    score = min(100.0, (extreme_days / MAX_EXTREME_HEAT_DAYS) * 100.0)
    if extreme_days > 0:
        factors.append(f"{extreme_days:.0f} extreme heat days per year (≥95°F)")

    uhi_bonus = urban_heat_island_bonus(latitude, longitude)
    if uhi_bonus > 0:
        score += uhi_bonus
        factors.append("Urban heat island effect in major metro area (+8 points)")

    projected_delta = heat_data.projected_2050_delta_c
    if projected_delta > PROJECTION_BASELINE_C:
        projection_bonus = (projected_delta - PROJECTION_BASELINE_C) * PROJECTION_POINTS_PER_DEGREE
        score += projection_bonus
        factors.append(
            f"Projected 2050 warming delta {projected_delta:.1f}°C above baseline"
        )

    if heat_data.trend_direction == "increasing":
        score += 5.0
        factors.append("Increasing extreme heat trend over last 30 years")

    if extreme_days > 0 or projected_delta > 0:
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
