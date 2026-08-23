from __future__ import annotations

import math
from typing import List, Tuple

# Representative US coastline sample points for proximity estimation.
COASTLINE_SAMPLE_POINTS: List[Tuple[float, float]] = [
    (25.76, -80.19), (25.95, -80.45), (26.12, -80.10), (27.95, -82.45),
    (29.89, -81.26), (30.33, -81.66), (32.08, -81.09), (32.78, -79.93),
    (33.75, -78.89), (34.23, -77.79), (35.25, -75.55), (36.85, -75.98),
    (38.33, -75.08), (40.57, -74.01), (41.05, -71.89), (41.49, -70.67),
    (42.36, -71.05), (43.66, -70.25), (44.39, -68.20), (44.81, -66.95),
    (30.42, -87.22), (30.33, -89.09), (29.95, -90.07), (29.30, -94.80),
    (27.80, -97.40), (26.20, -97.20), (25.90, -97.45), (21.30, -157.85),
    (20.89, -156.47), (19.64, -155.99), (33.75, -118.19), (34.01, -118.50),
    (32.72, -117.16), (37.77, -122.42), (38.33, -123.05), (40.80, -124.16),
    (43.37, -124.41), (46.20, -123.96), (47.61, -122.34), (48.38, -124.73),
    (47.75, -122.50), (45.60, -122.67), (42.05, -124.28), (39.55, -123.80),
    (36.62, -121.90), (35.37, -120.85), (34.42, -119.70), (32.80, -117.25),
    (47.25, -88.50), (46.55, -87.40), (45.10, -83.45), (44.76, -85.60),
    (43.95, -86.45), (42.28, -86.45), (41.76, -86.90), (41.70, -87.50),
]


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


def miles_to_km(miles: float) -> float:
    return miles * 1.60934


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * radius_km * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def distance_to_coast_km(latitude: float, longitude: float) -> float:
    return min(
        _haversine_km(latitude, longitude, coast_lat, coast_lon)
        for coast_lat, coast_lon in COASTLINE_SAMPLE_POINTS
    )


def is_within_miles_of_coast(latitude: float, longitude: float, miles: float) -> bool:
    return distance_to_coast_km(latitude, longitude) <= miles_to_km(miles)


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
        if _haversine_km(latitude, longitude, city_lat, city_lon) <= radius_km:
            return 8.0
    return 0.0
