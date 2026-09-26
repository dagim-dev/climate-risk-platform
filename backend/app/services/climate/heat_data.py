from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import List, Optional

import httpx
from pydantic import BaseModel

from app.core.config import settings
from app.services.climate.source_cache import SOURCE_NOAA_HEAT, fetch_with_cache
from app.services.climate.source_result import SourceResult
from app.services.climate.utils import NOAA_REQUEST_TIMEOUT, get_with_connect_retry, haversine_km

logger = logging.getLogger(__name__)

CDO_BASE_URL = "https://www.ncei.noaa.gov/cdo-web/api/v2"
# GSOY (Global Summary of the Year) DX90 = days per year with max temperature >= 90°F.
# One request returns up to 10 years, versus one GHCND daily request per year.
ANNUAL_DATASET = "GSOY"
HOT_DAYS_DATATYPE = "DX90"
HOT_DAY_THRESHOLD_F = 90
GSOY_MAX_YEARS_PER_REQUEST = 10
LOOKBACK_YEARS = 30
TREND_THRESHOLD_DAYS_PER_DECADE = 3.0
STATION_SEARCH_DEGREES = 0.5
MIN_STATION_COVERAGE = 0.7
HEAT_FETCH_DEADLINE_SECONDS = 8.0
MIN_YEARS_OF_HEAT_DATA = 10
# NOAA CDO allows 5 requests/second per token; back off once on 429.
NOAA_RATE_LIMIT_RETRIES = 1
NOAA_RATE_LIMIT_BACKOFF_SECONDS = 1.2


class HeatRiskData(BaseModel):
    extreme_heat_days_per_year: float = 0.0
    trend_direction: str = "stable"
    # Least-squares change in hot days per year, per decade, over the observed record.
    hot_days_trend_per_decade: float = 0.0


def hot_days_trend_per_decade(values: List[float]) -> float:
    """Ordinary least-squares slope of yearly hot-day counts, expressed per decade."""
    n = len(values)
    if n < 2:
        return 0.0
    mean_x = (n - 1) / 2
    mean_y = sum(values) / n
    covariance = sum((index - mean_x) * (value - mean_y) for index, value in enumerate(values))
    variance = sum((index - mean_x) ** 2 for index in range(n))
    return round(covariance / variance * 10, 2) if variance else 0.0


def trend_direction_from_slope(slope_per_decade: float) -> str:
    if slope_per_decade > TREND_THRESHOLD_DAYS_PER_DECADE:
        return "increasing"
    if slope_per_decade < -TREND_THRESHOLD_DAYS_PER_DECADE:
        return "decreasing"
    return "stable"


def _year_of(date_str: Optional[str]) -> Optional[int]:
    try:
        return int(str(date_str)[:4])
    except (TypeError, ValueError):
        return None


def select_station(
    stations: List[dict],
    latitude: float,
    longitude: float,
    start_year: int,
    current_year: int,
) -> Optional[dict]:
    """Nearest station whose GSOY record spans most of the lookback window."""

    def has_long_record(station: dict) -> bool:
        min_year = _year_of(station.get("mindate"))
        max_year = _year_of(station.get("maxdate"))
        return (
            min_year is not None
            and max_year is not None
            and min_year <= start_year + (LOOKBACK_YEARS - MIN_YEARS_OF_HEAT_DATA)
            and max_year >= current_year - 2
            and float(station.get("datacoverage") or 0) >= MIN_STATION_COVERAGE
        )

    candidates = [station for station in stations if has_long_record(station)]
    if not candidates:
        return None
    return min(
        candidates,
        key=lambda station: haversine_km(
            latitude, longitude, station["latitude"], station["longitude"]
        ),
    )


async def _noaa_get(client: httpx.AsyncClient, path: str, params: dict) -> dict:
    headers = {"token": settings.NOAA_API_KEY}
    for attempt in range(NOAA_RATE_LIMIT_RETRIES + 1):
        response = await get_with_connect_retry(
            client,
            f"{CDO_BASE_URL}/{path}",
            headers=headers,
            params=params,
            timeout=NOAA_REQUEST_TIMEOUT,
        )
        if response.status_code == 429 and attempt < NOAA_RATE_LIMIT_RETRIES:
            await asyncio.sleep(NOAA_RATE_LIMIT_BACKOFF_SECONDS)
            continue
        response.raise_for_status()
        return response.json()
    raise RuntimeError("NOAA rate limit retries exhausted")


async def _find_station(
    client: httpx.AsyncClient,
    latitude: float,
    longitude: float,
    start_year: int,
    current_year: int,
) -> Optional[dict]:
    delta = STATION_SEARCH_DEGREES
    data = await _noaa_get(
        client,
        "stations",
        {
            "datasetid": ANNUAL_DATASET,
            "datatypeid": HOT_DAYS_DATATYPE,
            "extent": f"{latitude - delta},{longitude - delta},{latitude + delta},{longitude + delta}",
            "limit": 100,
        },
    )
    return select_station(data.get("results", []), latitude, longitude, start_year, current_year)


def parse_annual_hot_days(results: list) -> dict[int, float]:
    """Map year -> annual count of days with max temperature >= 90°F from GSOY DX90 rows."""
    by_year: dict[int, float] = {}
    for record in results:
        year = _year_of(record.get("date"))
        value = record.get("value")
        if year is None or value is None or record.get("datatype") != HOT_DAYS_DATATYPE:
            continue
        by_year[year] = float(value)
    return by_year


async def _fetch_annual_hot_days(
    client: httpx.AsyncClient,
    station_id: str,
    start_year: int,
    end_year: int,
) -> List[float]:
    """Yearly hot-day counts in year order. CDO caps GSOY requests at 10 years each."""
    by_year: dict[int, float] = {}
    for chunk_start in range(start_year, end_year + 1, GSOY_MAX_YEARS_PER_REQUEST):
        chunk_end = min(chunk_start + GSOY_MAX_YEARS_PER_REQUEST - 1, end_year)
        data = await _noaa_get(
            client,
            "data",
            {
                "datasetid": ANNUAL_DATASET,
                "stationid": station_id,
                "datatypeid": HOT_DAYS_DATATYPE,
                "startdate": f"{chunk_start}-01-01",
                "enddate": f"{chunk_end}-12-31",
                "limit": 1000,
            },
        )
        by_year.update(parse_annual_hot_days(data.get("results", [])))
    return [by_year[year] for year in sorted(by_year)]


async def _fetch_heat_risk_live(latitude: float, longitude: float) -> HeatRiskData:
    if not settings.NOAA_API_KEY:
        raise RuntimeError("NOAA_API_KEY is not configured")

    current_year = datetime.utcnow().year
    start_year = current_year - LOOKBACK_YEARS

    async with httpx.AsyncClient(timeout=NOAA_REQUEST_TIMEOUT) as client:
        station = await _find_station(client, latitude, longitude, start_year, current_year)
        if station is None:
            raise RuntimeError("No NOAA weather station with a long temperature record nearby")

        yearly_counts = await asyncio.wait_for(
            _fetch_annual_hot_days(client, station["id"], start_year, current_year - 1),
            timeout=HEAT_FETCH_DEADLINE_SECONDS,
        )

    if len(yearly_counts) < MIN_YEARS_OF_HEAT_DATA:
        raise RuntimeError(
            f"NOAA returned only {len(yearly_counts)} years of heat observations "
            f"(need {MIN_YEARS_OF_HEAT_DATA})"
        )

    slope = hot_days_trend_per_decade(yearly_counts)
    return HeatRiskData(
        extreme_heat_days_per_year=round(sum(yearly_counts) / len(yearly_counts), 2),
        trend_direction=trend_direction_from_slope(slope),
        hot_days_trend_per_decade=slope,
    )


async def get_heat_risk_data(latitude: float, longitude: float) -> SourceResult[HeatRiskData]:
    return await fetch_with_cache(
        SOURCE_NOAA_HEAT,
        latitude,
        longitude,
        lambda: _fetch_heat_risk_live(latitude, longitude),
        HeatRiskData,
    )
