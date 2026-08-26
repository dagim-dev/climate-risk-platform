from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

import httpx
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.climate.utils import haversine_km

logger = logging.getLogger(__name__)

CDO_BASE_URL = "https://www.ncei.noaa.gov/cdo-web/api/v2"
EXTREME_HEAT_THRESHOLD_F = 95.0
LOOKBACK_YEARS = 30
PROJECTION_TARGET_YEAR = 2050


class HeatRiskData(BaseModel):
    extreme_heat_days_per_year: float = 0.0
    trend_direction: str = "stable"
    projected_2050_delta_c: float = 0.0


DEFAULT_HEAT_DATA = HeatRiskData()


def _trend_direction(values: List[float]) -> str:
    if len(values) < 2:
        return "stable"

    midpoint = len(values) / 2
    first_half = sum(values[: int(midpoint)]) / max(len(values[: int(midpoint)]), 1)
    second_half = sum(values[int(midpoint) :]) / max(len(values[int(midpoint) :]), 1)
    delta = second_half - first_half

    if delta > 1:
        return "increasing"
    if delta < -1:
        return "decreasing"
    return "stable"


def _project_2050_delta_c(yearly_extreme_days: List[float]) -> float:
    if len(yearly_extreme_days) < 2:
        return 0.0

    years_ahead = PROJECTION_TARGET_YEAR - datetime.utcnow().year
    if years_ahead <= 0:
        return 0.0

    slope_days_per_year = (yearly_extreme_days[-1] - yearly_extreme_days[0]) / max(
        len(yearly_extreme_days) - 1,
        1,
    )
    projected_extra_days = slope_days_per_year * years_ahead
    return round(projected_extra_days * 0.15, 2)


async def _find_nearest_station(
    client: httpx.AsyncClient,
    latitude: float,
    longitude: float,
) -> Optional[dict]:
    delta = 0.25
    extent = f"{latitude - delta},{longitude - delta},{latitude + delta},{longitude + delta}"
    headers = {"token": settings.NOAA_API_KEY}

    response = await client.get(
        f"{CDO_BASE_URL}/stations",
        headers=headers,
        params={
            "datasetid": "GHCND",
            "datatypeid": "TMAX",
            "extent": extent,
            "limit": 25,
        },
        timeout=30.0,
    )
    response.raise_for_status()
    stations = response.json().get("results", [])
    if not stations:
        return None

    return min(
        stations,
        key=lambda station: haversine_km(
            latitude,
            longitude,
            station["latitude"],
            station["longitude"],
        ),
    )


async def _fetch_yearly_extreme_heat_days(
    client: httpx.AsyncClient,
    station_id: str,
    year: int,
) -> float:
    headers = {"token": settings.NOAA_API_KEY}
    response = await client.get(
        f"{CDO_BASE_URL}/data",
        headers=headers,
        params={
            "datasetid": "GHCND",
            "stationid": station_id,
            "datatypeid": "TMAX",
            "startdate": f"{year}-01-01",
            "enddate": f"{year}-12-31",
            "units": "standard",
            "limit": 1000,
        },
        timeout=30.0,
    )
    response.raise_for_status()
    results = response.json().get("results", [])
    return count_extreme_heat_days(results)


def count_extreme_heat_days(
    results: list,
    threshold_f: float = EXTREME_HEAT_THRESHOLD_F,
) -> float:
    if not results:
        return 0.0
    return float(sum(1 for record in results if record.get("value", 0) >= threshold_f))


async def get_heat_risk_data(latitude: float, longitude: float) -> HeatRiskData:
    if not settings.NOAA_API_KEY:
        logger.warning("NOAA_API_KEY is not configured; returning default heat risk data")
        return DEFAULT_HEAT_DATA

    current_year = datetime.utcnow().year
    start_year = current_year - LOOKBACK_YEARS

    try:
        async with httpx.AsyncClient() as client:
            station = await _find_nearest_station(client, latitude, longitude)
            if station is None:
                return DEFAULT_HEAT_DATA

            yearly_counts: List[float] = []
            for year in range(start_year, current_year):
                yearly_counts.append(
                    await _fetch_yearly_extreme_heat_days(client, station["id"], year)
                )
    except (httpx.HTTPError, httpx.TimeoutException, KeyError, ValueError) as exc:
        logger.warning(
            "NOAA heat data query failed for (%s, %s): %s",
            latitude,
            longitude,
            exc,
        )
        return DEFAULT_HEAT_DATA

    if not yearly_counts:
        return DEFAULT_HEAT_DATA

    return HeatRiskData(
        extreme_heat_days_per_year=round(sum(yearly_counts) / len(yearly_counts), 2),
        trend_direction=_trend_direction(yearly_counts),
        projected_2050_delta_c=_project_2050_delta_c(yearly_counts),
    )
