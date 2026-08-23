from __future__ import annotations

from app.schemas.risk import HazardScore
from app.services.climate.flood_data import FloodZoneData
from app.services.scoring.helpers import (
    clamp_score,
    is_within_miles_of_coast,
    score_to_severity,
)


def score_flood_risk(
    flood_data: FloodZoneData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    zone = (flood_data.flood_zone or "X").upper()
    factors: list[str] = []

    if zone in {"AE", "A", "VE", "V"}:
        base_score = 80
        factors.append(f"FEMA flood zone {zone} (1% annual flood chance)")
        confidence = "High"
    elif zone in {"AO", "AH"}:
        base_score = 60
        factors.append(f"FEMA flood zone {zone} (shallow flooding)")
        confidence = "High"
    elif zone == "X" and flood_data.special_flood_hazard_area:
        base_score = 40
        factors.append("Zone X shaded (0.2% annual chance flood hazard)")
        confidence = "Medium"
    else:
        base_score = 12
        factors.append(f"FEMA flood zone {zone} (minimal flood hazard)")
        confidence = "Medium" if zone == "X" else "Low"

    score = float(base_score)

    if is_within_miles_of_coast(latitude, longitude, miles=1):
        score += 10
        factors.append("Within 1 mile of ocean or bay")

    if flood_data.special_flood_hazard_area and flood_data.base_flood_elevation is not None:
        score += 8
        factors.append(
            f"Special Flood Hazard Area with BFE {flood_data.base_flood_elevation:.1f} ft"
        )

    final_score = clamp_score(score)
    return HazardScore(
        score=final_score,
        severity=score_to_severity(final_score),
        confidence=confidence,
        primary_factors=factors[:3],
    )
