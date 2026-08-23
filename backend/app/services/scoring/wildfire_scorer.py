from __future__ import annotations

from app.schemas.risk import HazardScore
from app.services.climate.wildfire_data import WildfireData
from app.services.scoring.helpers import clamp_score, score_to_severity

SEARCH_RADIUS_KM = 50.0
SEARCH_AREA_KM2 = 3.14159 * SEARCH_RADIUS_KM * SEARCH_RADIUS_KM

WUI_BONUSES = {
    "High-WUI": 20.0,
    "Intermix": 15.0,
    "Interface": 10.0,
    "Non-WUI": 0.0,
}

DROUGHT_ZONE_MULTIPLIERS = {
    "Western": 1.2,
    "Southern Plains": 1.15,
    "Central": 1.05,
    "Eastern": 1.0,
    "Outside CONUS": 1.0,
    "Unknown": 1.0,
}


def _fire_density_per_100km2(fire_count: int) -> float:
    return (fire_count / SEARCH_AREA_KM2) * 100.0


def _estimated_nearest_fire_km(wildfire_data: WildfireData) -> float:
    if wildfire_data.fire_count_20_years == 0:
        return 999.0
    if wildfire_data.wui_classification == "High-WUI":
        return 3.0
    if wildfire_data.wui_classification == "Intermix":
        return 12.0
    if wildfire_data.wui_classification == "Interface":
        return 25.0
    return 40.0


def score_wildfire_risk(
    wildfire_data: WildfireData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    del latitude, longitude  # reserved for future spatial refinements

    factors: list[str] = []
    fire_count = wildfire_data.fire_count_20_years

    density = _fire_density_per_100km2(fire_count)
    score = min(100.0, density * 90.0)
    if fire_count > 0:
        factors.append(f"{fire_count} wildfires within 50 km over last 20 years")

    wui_bonus = WUI_BONUSES.get(wildfire_data.wui_classification, 0.0)
    if wui_bonus > 0:
        score += wui_bonus
        factors.append(f"WUI classification: {wildfire_data.wui_classification}")

    zone_multiplier = DROUGHT_ZONE_MULTIPLIERS.get(wildfire_data.fire_weather_zone, 1.0)
    if zone_multiplier > 1.0:
        score *= zone_multiplier
        factors.append(
            f"Drought-prone fire weather zone ({wildfire_data.fire_weather_zone})"
        )

    nearest_fire_km = _estimated_nearest_fire_km(wildfire_data)
    if nearest_fire_km <= 5.0:
        score += 18.0
        factors.append(f"Recent fire activity within {nearest_fire_km:.0f} km")

    if fire_count > 0:
        confidence = "High" if fire_count >= 10 else "Medium"
    else:
        confidence = "Low"

    final_score = clamp_score(score)
    return HazardScore(
        score=final_score,
        severity=score_to_severity(final_score),
        confidence=confidence,
        primary_factors=factors[:3] if factors else ["No significant wildfire history nearby"],
    )
