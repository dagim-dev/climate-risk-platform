from __future__ import annotations

from app.schemas.risk import HazardScore
from app.services.climate.flood_data import (
    PROVIDER_FEMA,
    FloodZoneData,
    is_high_risk_zone,
    is_moderate_x_subtype,
)
from app.services.scoring.helpers import clamp_score, score_to_severity


def score_flood_risk(
    flood_data: FloodZoneData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    del latitude, longitude  # flood hazard comes from the FEMA polygon at this point
    zone = (flood_data.flood_zone or "X").upper()
    factors: list[str] = []

    subtype = (flood_data.zone_subtype or "").upper()

    if is_high_risk_zone(zone):
        base_score = 80
        factors.append(f"FEMA flood zone {zone} (1% annual flood chance)")
        confidence = "High"
    elif zone in {"AO", "AH"}:
        base_score = 60
        factors.append(f"FEMA flood zone {zone} (shallow flooding)")
        confidence = "High"
    elif zone == "X" and (
        is_moderate_x_subtype(subtype) or flood_data.special_flood_hazard_area
    ):
        base_score = 40
        if "LEVEE" in subtype:
            factors.append("FEMA zone X shaded (reduced flood risk due to levee)")
        else:
            factors.append("FEMA zone X shaded (0.2% annual chance flood hazard)")
        confidence = "High"
    elif zone == "X" and not flood_data.mapped:
        base_score = 12
        factors.append(
            "Outside FEMA-mapped 1% and 0.2% flood hazard areas "
            "(minimal-hazard map not available to confirm)"
        )
        confidence = "Low"
    elif zone == "X":
        base_score = 12
        factors.append("FEMA flood zone X (minimal flood hazard)")
        confidence = "High"
    else:
        base_score = 12
        factors.append(f"FEMA flood zone {zone} (not a standard hazard class)")
        confidence = "Low"

    score = float(base_score)

    if flood_data.special_flood_hazard_area and flood_data.base_flood_elevation is not None:
        score += 8
        factors.append(
            f"Special Flood Hazard Area with BFE {flood_data.base_flood_elevation:.1f} ft"
        )

    if flood_data.provider != PROVIDER_FEMA:
        factors[0] = f"{factors[0]} [{flood_data.provider}]"

    final_score = clamp_score(score)
    return HazardScore(
        score=final_score,
        severity=score_to_severity(final_score),
        confidence=confidence,
        primary_factors=factors[:3],
    )
