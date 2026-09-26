from __future__ import annotations

import asyncio
import json
import logging
import math
import time
from datetime import datetime
from typing import Dict, List

import httpx
from pydantic import BaseModel

from app.services.climate.source_cache import SOURCE_WFIGS, fetch_with_cache
from app.services.climate.source_result import SourceResult
from app.services.climate.utils import (
    ARCGIS_HEADERS,
    ARCGIS_TIMEOUT,
    get_with_connect_retry,
    raise_for_arcgis_error,
)

logger = logging.getLogger(__name__)

FIRE_PERIMETER_URL = (
    "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/"
    "InterAgencyFirePerimeterHistory_All_Years_View/FeatureServer/0/query"
)

SEARCH_RADIUS_M = 50_000
LOOKBACK_YEARS = 20
WILDFIRE_FETCH_DEADLINE_SECONDS = 6.0

# USFS Wildfire Hazard Potential (2023), classified raster.
WHP_HISTOGRAM_URL = (
    "https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/"
    "USFS_EDW_RMRS_WildfireHazardPotentialClassified/ImageServer/computeHistograms"
)
WHP_CLASSES = (1, 2, 3, 4, 5, 6, 7)
WHP_BOX_KM = 2.0
WHP_TIMEOUT = httpx.Timeout(6.0, connect=3.0)


class WildfireData(BaseModel):
    fire_count_20_years: int = 0
    # Share of pixels in each USFS Wildfire Hazard Potential class within WHP_BOX_KM of the
    # property. Keys are class codes: 1 very low … 5 very high, 6 non-burnable, 7 water.
    whp_class_shares: Dict[int, float] = {}


def parse_whp_histogram(data: dict) -> Dict[int, float]:
    """Convert an ImageServer computeHistograms response into {WHP class: share of pixels}."""
    raise_for_arcgis_error(data)
    histograms = data.get("histograms") or []
    if not histograms:
        raise RuntimeError("USFS WHP returned no histogram for this location")

    histogram = histograms[0]
    counts = histogram.get("counts") or []
    minimum = float(histogram.get("min", 0))
    maximum = float(histogram.get("max", 0))
    size = int(histogram.get("size") or len(counts) or 1)
    bin_width = (maximum - minimum) / size if size else 0

    class_counts: Dict[int, int] = {}
    for index, count in enumerate(counts):
        if not count:
            continue
        whp_class = int(round(minimum + index * bin_width + bin_width / 2))
        if whp_class in WHP_CLASSES:
            class_counts[whp_class] = class_counts.get(whp_class, 0) + count

    total = sum(class_counts.values())
    if total == 0:
        raise RuntimeError("USFS WHP has no coverage at this location")
    return {whp_class: round(count / total, 4) for whp_class, count in sorted(class_counts.items())}


async def _fetch_whp_class_shares(latitude: float, longitude: float) -> Dict[int, float]:
    lat_delta = WHP_BOX_KM / 111.0
    lon_delta = WHP_BOX_KM / (111.0 * max(math.cos(math.radians(latitude)), 0.01))
    envelope = {
        "xmin": longitude - lon_delta,
        "ymin": latitude - lat_delta,
        "xmax": longitude + lon_delta,
        "ymax": latitude + lat_delta,
        "spatialReference": {"wkid": 4326},
    }
    async with httpx.AsyncClient(timeout=WHP_TIMEOUT) as client:
        response = await get_with_connect_retry(
            client,
            WHP_HISTOGRAM_URL,
            params={
                "geometry": json.dumps(envelope),
                "geometryType": "esriGeometryEnvelope",
                "f": "json",
            },
            headers=ARCGIS_HEADERS,
            timeout=WHP_TIMEOUT,
        )
        response.raise_for_status()
        return parse_whp_histogram(response.json())


async def _fetch_wildfire_live(latitude: float, longitude: float) -> WildfireData:
    whp_class_shares, fire_count = await asyncio.gather(
        _fetch_whp_class_shares(latitude, longitude),
        _fetch_fire_count(latitude, longitude),
    )
    return WildfireData(fire_count_20_years=fire_count, whp_class_shares=whp_class_shares)


async def _fetch_fire_count(latitude: float, longitude: float) -> int:
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
            response = await get_with_connect_retry(
                client,
                FIRE_PERIMETER_URL,
                params=params,
                headers=ARCGIS_HEADERS,
                timeout=ARCGIS_TIMEOUT,
            )
            response.raise_for_status()
            data = raise_for_arcgis_error(response.json())
            features = data.get("features", [])
            all_features.extend(features)

            if not data.get("exceededTransferLimit") or not features:
                break
            offset += len(features)

    unique_fires = {
        (
            feature.get("attributes", {}).get("INCIDENT"),
            feature.get("attributes", {}).get("FIRE_YEAR_INT"),
        )
        for feature in all_features
    }
    return len(unique_fires)


async def get_wildfire_data(latitude: float, longitude: float) -> SourceResult[WildfireData]:
    return await fetch_with_cache(
        SOURCE_WFIGS,
        latitude,
        longitude,
        lambda: _fetch_wildfire_live(latitude, longitude),
        WildfireData,
    )
