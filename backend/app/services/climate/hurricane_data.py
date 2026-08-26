from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, Optional

import httpx
from pydantic import BaseModel, Field

from app.services.climate.utils import haversine_km, query_arcgis_point

logger = logging.getLogger(__name__)

IBTRACS_QUERY_URL = (
    "https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/"
    "IBTrACS_ALL_list_v04r00_lines_1/FeatureServer/0/query"
)

SEARCH_RADIUS_KM = 500
SEARCH_RADIUS_M = SEARCH_RADIUS_KM * 1000
LOOKBACK_YEARS = 50


class HurricaneData(BaseModel):
    historical_storm_count: int = 0
    nearest_track_distance_km: float = Field(default=999.0)
    category_distribution: Dict[str, int] = Field(
        default_factory=lambda: {
            "category_1": 0,
            "category_2": 0,
            "category_3": 0,
            "category_4": 0,
            "category_5": 0,
        }
    )


DEFAULT_HURRICANE_DATA = HurricaneData()


def _wind_to_category(wind_knots: Optional[float]) -> Optional[int]:
    if wind_knots is None:
        return None
    if wind_knots >= 137:
        return 5
    if wind_knots >= 113:
        return 4
    if wind_knots >= 96:
        return 3
    if wind_knots >= 83:
        return 2
    if wind_knots >= 64:
        return 1
    return None


def _parse_storm_year(attributes: dict) -> Optional[int]:
    for key in ("SEASON", "year", "YEAR", "ISO_TIME"):
        value = attributes.get(key)
        if value is None:
            continue
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            digits = value[:4]
            if digits.isdigit():
                return int(digits)
    return None


async def get_hurricane_data(latitude: float, longitude: float) -> HurricaneData:
    cutoff_year = datetime.utcnow().year - LOOKBACK_YEARS
    where = f"SEASON >= {cutoff_year}"

    try:
        async with httpx.AsyncClient() as client:
            data = await query_arcgis_point(
                client,
                IBTRACS_QUERY_URL,
                latitude,
                longitude,
                out_fields="SID,NAME,SEASON,USA_WIND,LAT,LON",
                where=where,
                distance=SEARCH_RADIUS_M,
            )
    except (httpx.HTTPError, httpx.TimeoutException) as exc:
        logger.warning(
            "IBTrACS hurricane query failed for (%s, %s): %s",
            latitude,
            longitude,
            exc,
        )
        return DEFAULT_HURRICANE_DATA

    return parse_hurricane_response(data, latitude, longitude, cutoff_year)


def parse_hurricane_response(
    data: dict,
    latitude: float,
    longitude: float,
    cutoff_year: int,
) -> HurricaneData:
    features = data.get("features", [])
    if not features:
        return DEFAULT_HURRICANE_DATA

    storms_by_id: dict[str, dict] = {}
    category_distribution = {
        "category_1": 0,
        "category_2": 0,
        "category_3": 0,
        "category_4": 0,
        "category_5": 0,
    }
    nearest_distance_km = 999.0

    for feature in features:
        attributes = feature.get("attributes", {})
        storm_year = _parse_storm_year(attributes)
        if storm_year is not None and storm_year < cutoff_year:
            continue

        storm_id = attributes.get("SID") or attributes.get("NAME") or str(id(feature))
        existing = storms_by_id.get(storm_id)
        wind = attributes.get("USA_WIND")
        category = _wind_to_category(float(wind) if wind is not None else None)

        if existing is None:
            storms_by_id[storm_id] = attributes
            if category is not None:
                category_distribution[f"category_{category}"] += 1
        elif category is not None:
            prior_wind = existing.get("USA_WIND")
            prior_category = _wind_to_category(
                float(prior_wind) if prior_wind is not None else None
            )
            if prior_category is None or category > prior_category:
                if prior_category is not None:
                    category_distribution[f"category_{prior_category}"] -= 1
                category_distribution[f"category_{category}"] += 1
                existing["USA_WIND"] = wind

        storm_lat = attributes.get("LAT")
        storm_lon = attributes.get("LON")
        if storm_lat is not None and storm_lon is not None:
            distance_km = haversine_km(latitude, longitude, float(storm_lat), float(storm_lon))
            nearest_distance_km = min(nearest_distance_km, distance_km)

    if nearest_distance_km == 999.0:
        nearest_distance_km = float(SEARCH_RADIUS_KM)

    return HurricaneData(
        historical_storm_count=len(storms_by_id),
        nearest_track_distance_km=round(nearest_distance_km, 2),
        category_distribution=category_distribution,
    )
