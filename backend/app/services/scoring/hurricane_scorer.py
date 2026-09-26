from __future__ import annotations

from app.schemas.risk import HazardScore
from app.services.climate.hurricane_data import LOOKBACK_YEARS, PASS_RADIUS_KM, HurricaneData
from app.services.scoring.helpers import (
    clamp_score,
    is_within_miles_of_coast,
    score_to_severity,
)

POINTS_PER_HURRICANE_PASS = 7.0
MAX_PASS_POINTS = 70.0
POINTS_PER_MAJOR_PASS = 5.0
MAX_MAJOR_POINTS = 20.0
POINTS_PER_TROPICAL_SYSTEM = 0.5
MAX_TROPICAL_SYSTEM_POINTS = 10.0
COASTAL_POINTS = 10.0


def score_hurricane_risk(
    hurricane_data: HurricaneData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    factors: list[str] = []
    radius = f"{PASS_RADIUS_KM:.0f} km"
    period = f"last {LOOKBACK_YEARS} years"

    passes = hurricane_data.hurricane_passes_100km
    majors = hurricane_data.major_hurricane_passes_100km
    systems = hurricane_data.tropical_systems_100km

    score = min(MAX_PASS_POINTS, passes * POINTS_PER_HURRICANE_PASS)
    score += min(MAX_MAJOR_POINTS, majors * POINTS_PER_MAJOR_PASS)
    score += min(MAX_TROPICAL_SYSTEM_POINTS, systems * POINTS_PER_TROPICAL_SYSTEM)

    if passes > 0:
        factors.append(f"{passes} hurricane-strength storms passed within {radius} in the {period}")
    if majors > 0:
        factors.append(f"{majors} of them at Category 3 or stronger while within {radius}")
    if systems > passes:
        factors.append(f"{systems} tropical systems of any strength passed within {radius}")

    coastal = is_within_miles_of_coast(latitude, longitude, miles=25)
    if coastal and systems > 0:
        score += COASTAL_POINTS
        factors.append("Within 25 miles of the coast (storm surge and stronger winds)")

    if not factors:
        factors.append(f"No tropical storm tracks within {radius} in the {period} (NOAA IBTrACS)")

    confidence = "High" if hurricane_data.historical_storm_count > 0 or not coastal else "Medium"

    final_score = clamp_score(score)
    return HazardScore(
        score=final_score,
        severity=score_to_severity(final_score),
        confidence=confidence,
        primary_factors=factors[:3],
    )
