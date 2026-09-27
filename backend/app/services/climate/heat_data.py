from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
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
# First-order NWS/ASOS stations (GHCND ids "USW…") have the most consistent long records;
# co-op stations can shift with siting/instrument changes, which distorts the trend.
FIRST_ORDER_STATION_PREFIX = "GHCND:USW"
FIRST_ORDER_MAX_DISTANCE_KM = 50.0
# ...but only at a similar elevation to the property, estimated from the nearest station of
# any record length: a valley airport is not representative of a ridge-top town (Oroville
# vs Paradise, CA), nor a rainforest valley gauge of downtown Honolulu.
FIRST_ORDER_MAX_ELEVATION_DIFF_M = 100.0
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
    # Observed record the numbers above are computed from (None on older cache rows).
    first_year: Optional[int] = None
    last_year: Optional[int] = None
    years_observed: Optional[int] = None


def hot_days_trend_per_decade(values: List[float], years: Optional[List[int]] = None) -> float:
    """Ordinary least-squares slope of yearly hot-day counts, expressed per decade.

    ``years`` gives the x value of each count so gaps in the record don't compress time;
    without it the counts are assumed to be consecutive years.
    """
    n = len(values)
    if n < 2:
        return 0.0
    xs = [float(year) for year in years] if years is not None else [float(i) for i in range(n)]
    mean_x = sum(xs) / n
    mean_y = sum(values) / n
    covariance = sum((x - mean_x) * (value - mean_y) for x, value in zip(xs, values))
    variance = sum((x - mean_x) ** 2 for x in xs)
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
    """Station whose GSOY record spans most of the lookback window.

    Prefers the nearest first-order station within FIRST_ORDER_MAX_DISTANCE_KM whose
    elevation is close to the property's (estimated from the nearest station of any kind);
    otherwise the nearest qualifying station.
    """

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

    candidates = [
        station
        for station in stations
        if station.get("id")
        and station.get("latitude") is not None
        and station.get("longitude") is not None
        and has_long_record(station)
    ]
    if not candidates:
        return None

    def distance(station: dict) -> float:
        return haversine_km(
            latitude,
            longitude,
            float(station.get("latitude") or 0.0),
            float(station.get("longitude") or 0.0),
        )

    def elevation(station: dict) -> Optional[float]:
        try:
            return float(station["elevation"])
        except (KeyError, TypeError, ValueError):
            return None

    located = [
        station
        for station in stations
        if station.get("latitude") is not None
        and station.get("longitude") is not None
        and elevation(station) is not None
    ]
    local_elevation = elevation(min(located, key=distance)) if located else None
    first_order = [
        station
        for station in candidates
        if str(station["id"]).startswith(FIRST_ORDER_STATION_PREFIX)
        and distance(station) <= FIRST_ORDER_MAX_DISTANCE_KM
        and local_elevation is not None
        and elevation(station) is not None
        and abs(elevation(station) - local_elevation) <= FIRST_ORDER_MAX_ELEVATION_DIFF_M
    ]
    return min(first_order or candidates, key=distance)


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
        try:
            by_year[year] = float(value)
        except (TypeError, ValueError):
            continue
    return by_year


async def _fetch_annual_hot_days(
    client: httpx.AsyncClient,
    station_id: str,
    start_year: int,
    end_year: int,
) -> dict[int, float]:
    """Year -> hot-day count. CDO caps GSOY requests at 10 years each."""
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
    return by_year


async def _fetch_heat_risk_live(latitude: float, longitude: float) -> HeatRiskData:
    if not settings.NOAA_API_KEY:
        raise RuntimeError("NOAA_API_KEY is not configured")

    current_year = datetime.now(timezone.utc).year
    start_year = current_year - LOOKBACK_YEARS

    async with httpx.AsyncClient(timeout=NOAA_REQUEST_TIMEOUT) as client:
        station = await _find_station(client, latitude, longitude, start_year, current_year)
        if station is None:
            raise RuntimeError("No NOAA weather station with a long temperature record nearby")

        counts_by_year = await asyncio.wait_for(
            _fetch_annual_hot_days(client, str(station["id"]), start_year, current_year - 1),
            timeout=HEAT_FETCH_DEADLINE_SECONDS,
        )

    years = sorted(counts_by_year)
    yearly_counts = [counts_by_year[year] for year in years]
    if len(yearly_counts) < MIN_YEARS_OF_HEAT_DATA:
        raise RuntimeError(
            f"NOAA returned only {len(yearly_counts)} years of heat observations "
            f"(need {MIN_YEARS_OF_HEAT_DATA})"
        )

    slope = hot_days_trend_per_decade(yearly_counts, years)
    return HeatRiskData(
        extreme_heat_days_per_year=round(sum(yearly_counts) / len(yearly_counts), 2),
        trend_direction=trend_direction_from_slope(slope),
        hot_days_trend_per_decade=slope,
        first_year=years[0],
        last_year=years[-1],
        years_observed=len(years),
    )


async def get_heat_risk_data(latitude: float, longitude: float) -> SourceResult[HeatRiskData]:
    return await fetch_with_cache(
        SOURCE_NOAA_HEAT,
        latitude,
        longitude,
        lambda: _fetch_heat_risk_live(latitude, longitude),
        HeatRiskData,
    )
