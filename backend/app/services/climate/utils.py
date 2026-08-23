from __future__ import annotations

import math
from typing import Any, Dict, Optional

import httpx

ARCGIS_HEADERS = {"User-Agent": "climate-risk-platform/0.2-alpha"}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
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


async def query_arcgis_point(
    client: httpx.AsyncClient,
    url: str,
    lat: float,
    lon: float,
    *,
    out_fields: str,
    where: str = "1=1",
    distance: Optional[int] = None,
    units: str = "esriSRUnit_Meter",
    result_record_count: int = 2000,
) -> Dict[str, Any]:
    params: Dict[str, Any] = {
        "where": where,
        "geometry": f"{lon},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": 4326,
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": out_fields,
        "returnGeometry": "false",
        "f": "json",
        "resultRecordCount": result_record_count,
    }
    if distance is not None:
        params["distance"] = distance
        params["units"] = units

    response = await client.get(
        url,
        params=params,
        headers=ARCGIS_HEADERS,
        timeout=30.0,
    )
    response.raise_for_status()
    return response.json()
