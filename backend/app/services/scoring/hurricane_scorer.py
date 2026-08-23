from __future__ import annotations

from app.schemas.risk import HazardScore
from app.services.climate.hurricane_data import HurricaneData
from app.services.scoring.helpers import (
    clamp_score,
    is_within_miles_of_coast,
    score_to_severity,
)

LOOKBACK_DECADES = 5


def score_hurricane_risk(
    hurricane_data: HurricaneData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    factors: list[str] = []

    if 15 <= latitude <= 35:
        score = 35.0
        factors.append("Located in tropical hurricane latitude band (15°N–35°N)")
    else:
        score = 10.0
        factors.append("Outside primary tropical hurricane latitude band")

    storms_per_decade = hurricane_data.historical_storm_count / LOOKBACK_DECADES
    if storms_per_decade > 0:
        frequency_bonus = min(30.0, storms_per_decade * 3.0)
        score += frequency_bonus
        factors.append(f"{storms_per_decade:.1f} historical storms per decade nearby")

    category_distribution = hurricane_data.category_distribution
    major_storms = (
        category_distribution.get("category_4", 0)
        + category_distribution.get("category_5", 0)
    )
    if major_storms > 0:
        score += min(25.0, major_storms * 5.0)
        factors.append(f"{major_storms} Category 4/5 hurricanes in regional history")

    if is_within_miles_of_coast(latitude, longitude, miles=25):
        score *= 1.5
        factors.append("Within 25 miles of the coast (elevated surge and wind exposure)")

    if hurricane_data.nearest_track_distance_km < 50:
        score += 15.0
        factors.append(
            f"Nearest hurricane track {hurricane_data.nearest_track_distance_km:.0f} km away"
        )

    if hurricane_data.historical_storm_count > 0:
        confidence = "High"
    elif is_within_miles_of_coast(latitude, longitude, miles=25):
        confidence = "Medium"
    else:
        confidence = "Low"

    final_score = clamp_score(score)
    return HazardScore(
        score=final_score,
        severity=score_to_severity(final_score),
        confidence=confidence,
        primary_factors=factors[:3],
    )
