from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import List

import httpx
from pydantic import BaseModel

from app.services.climate.source_cache import SOURCE_WFIGS, fetch_with_cache
from app.services.climate.source_result import SourceResult
from app.services.climate.utils import ARCGIS_HEADERS, ARCGIS_TIMEOUT

logger = logging.getLogger(__name__)

FIRE_PERIMETER_URL = (
    "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/"
    "InterAgencyFirePerimeterHistory_All_Years_View/FeatureServer/0/query"
)

SEARCH_RADIUS_M = 50_000
LOOKBACK_YEARS = 20
WILDFIRE_FETCH_DEADLINE_SECONDS = 6.0


class WildfireData(BaseModel):
    fire_count_20_years: int = 0
    fire_weather_zone: str = "Unknown"
    wui_classification: str = "Non-WUI"


def _classify_wui(fire_count: int, radius_km: float = 50.0) -> str:
    """Infer a WUI-like label from fire density. Not an official SILVIS/USFS WUI map."""
    area_km2 = 3.14159 * radius_km * radius_km
    density = fire_count / max(area_km2, 1.0) * 100

    if density >= 0.5:
        return "High-WUI"
    if density >= 0.15:
        return "Intermix"
    if fire_count > 0:
        return "Interface"
    return "Non-WUI"


def _estimate_fire_weather_zone(latitude: float, longitude: float) -> str:
    if latitude < 25 or latitude > 49 or longitude < -125 or longitude > -66:
        return "Outside CONUS"
    if latitude >= 32 and longitude <= -115:
        return "Western"
    if latitude >= 30 and longitude <= -100:
        return "Southern Plains"
    if latitude >= 37 and longitude <= -80:
        return "Eastern"
    return "Central"


async def _fetch_wildfire_live(latitude: float, longitude: float) -> WildfireData:
    cutoff_year = datetime.utcnow().year - LOOKBACK_YEARS
    where = f"FIRE_YEAR_INT >= {cutoff_year} AND FEATURE_CA LIKE '%Final%'"
    deadline = time.monotonic() + WILDFIRE_FETCH_DEADLINE_SECONDS

    async with httpx.AsyncClient(timeout=ARCGIS_TIMEOUT) as client:
        all_features: List[dict] = []
        offset = 0

        while True:
            if time.monotonic() >= deadline:
                raise TimeoutError("Wildfire perimeter fetch exceeded deadline")

            params = {
                "where": where,
                "geometry": f"{longitude},{latitude}",
                "geometryType": "esriGeometryPoint",
                "inSR": 4326,
                "spatialRel": "esriSpatialRelIntersects",
                "distance": SEARCH_RADIUS_M,
                "units": "esriSRUnit_Meter",
                "outFields": "INCIDENT,FIRE_YEAR_INT,GIS_ACRES,FEATURE_CA",
                "returnGeometry": "false",
                "f": "json",
                "resultRecordCount": 2000,
                "resultOffset": offset,
            }
            response = await client.get(
                FIRE_PERIMETER_URL,
                params=params,
                headers=ARCGIS_HEADERS,
                timeout=ARCGIS_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
            features = data.get("features", [])
            all_features.extend(features)

            if not data.get("exceededTransferLimit") or not features:
                break
            offset += len(features)

    if not all_features:
        return WildfireData(
            fire_count_20_years=0,
            fire_weather_zone=_estimate_fire_weather_zone(latitude, longitude),
            wui_classification="Non-WUI",
        )

    unique_fires = {
        (
            feature.get("attributes", {}).get("INCIDENT"),
            feature.get("attributes", {}).get("FIRE_YEAR_INT"),
        )
        for feature in all_features
    }
    fire_count = len(unique_fires)

    return WildfireData(
        fire_count_20_years=fire_count,
        fire_weather_zone=_estimate_fire_weather_zone(latitude, longitude),
        wui_classification=_classify_wui(fire_count),
    )


async def get_wildfire_data(latitude: float, longitude: float) -> SourceResult[WildfireData]:
    return await fetch_with_cache(
        SOURCE_WFIGS,
        latitude,
        longitude,
        lambda: _fetch_wildfire_live(latitude, longitude),
        WildfireData,
    )
