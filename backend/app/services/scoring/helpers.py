from __future__ import annotations

from typing import List, Tuple

from app.services.climate.utils import haversine_km


def score_to_severity(score: int) -> str:
    if score <= 25:
        return "Low"
    if score <= 50:
        return "Moderate"
    if score <= 75:
        return "High"
    return "Extreme"


def clamp_score(score: float) -> int:
    return max(0, min(100, int(round(score))))


# Major US downtown centers for urban heat island adjustment (lat, lon, radius_km).
URBAN_CITY_CENTERS: List[Tuple[float, float, float]] = [
    (40.7128, -74.0060, 18.0),
    (34.0522, -118.2437, 25.0),
    (41.8781, -87.6298, 18.0),
    (29.7604, -95.3698, 20.0),
    (33.4484, -112.0740, 22.0),
    (39.7392, -104.9903, 15.0),
    (32.7157, -117.1611, 18.0),
    (37.7749, -122.4194, 15.0),
    (47.6062, -122.3321, 15.0),
    (25.7617, -80.1918, 15.0),
    (33.7490, -84.3880, 18.0),
    (42.3601, -71.0589, 12.0),
    (38.9072, -77.0369, 15.0),
    (36.1699, -115.1398, 15.0),
    (30.2672, -97.7431, 15.0),
]


def urban_heat_island_bonus(latitude: float, longitude: float) -> float:
    for city_lat, city_lon, radius_km in URBAN_CITY_CENTERS:
        if haversine_km(latitude, longitude, city_lat, city_lon) <= radius_km:
            return 8.0
    return 0.0
