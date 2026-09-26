from __future__ import annotations

import math
from typing import Any, Dict, Optional

import httpx

ARCGIS_HEADERS = {"User-Agent": "climate-risk-platform/0.2-alpha"}
ARCGIS_TIMEOUT = httpx.Timeout(4.0, connect=2.0)
NOAA_REQUEST_TIMEOUT = httpx.Timeout(4.0, connect=2.0)


CONNECT_RETRIES = 1


async def get_with_connect_retry(client: httpx.AsyncClient, url: str, **kwargs: Any) -> httpx.Response:
    """GET that retries once when the TCP/TLS connection itself fails.

    The first connection to a host from a fresh client intermittently times out; a
    second attempt almost always succeeds. Read timeouts and HTTP errors are not retried.
    """
    for attempt in range(CONNECT_RETRIES + 1):
        try:
            return await client.get(url, **kwargs)
        except (httpx.ConnectError, httpx.ConnectTimeout):
            if attempt >= CONNECT_RETRIES:
                raise
    raise AssertionError("unreachable")


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
    timeout: httpx.Timeout = ARCGIS_TIMEOUT,
    extra_params: Optional[Dict[str, Any]] = None,
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
    if extra_params:
        params.update(extra_params)

    response = await get_with_connect_retry(
        client,
        url,
        params=params,
        headers=ARCGIS_HEADERS,
        timeout=timeout,
    )
    response.raise_for_status()
    return raise_for_arcgis_error(response.json())


def raise_for_arcgis_error(data: Dict[str, Any]) -> Dict[str, Any]:
    """ArcGIS reports failures as HTTP 200 with an ``error`` body; treat those as failures."""
    error = data.get("error")
    if error:
        message = error.get("message") if isinstance(error, dict) else str(error)
        raise RuntimeError(f"ArcGIS error: {message or 'unknown error'}")
    return data
