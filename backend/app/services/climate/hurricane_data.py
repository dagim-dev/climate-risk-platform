from __future__ import annotations

import asyncio
import logging
import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import httpx
from pydantic import BaseModel, Field

from app.services.climate.source_cache import SOURCE_IBTRACS, fetch_with_cache
from app.services.climate.source_result import SourceResult
from app.services.climate.utils import ARCGIS_TIMEOUT, haversine_km, query_arcgis_point

logger = logging.getLogger(__name__)

IBTRACS_QUERY_URL = (
    "https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/"
    "IBTrACS_ALL_list_v04r00_lines_1/FeatureServer/0/query"
)

SEARCH_RADIUS_KM = 500
SEARCH_RADIUS_M = SEARCH_RADIUS_KM * 1000
LOOKBACK_YEARS = 50
# The layer caps responses at 1,000 rows; a 500 km / 50-year query near the Gulf or
# Florida returns ~3,000 track segments, so fetch every page.
IBTRACS_PAGE_SIZE = 1000
IBTRACS_MAX_PAGES = 10
IBTRACS_OUT_FIELDS = "OBJECTID,SID,NAME,year,USA_WIND,LAT,LON,Hurricane_Date"
# Radius for counting direct passes (NOAA hurricane return periods use ~50 nmi / 93 km).
PASS_RADIUS_KM = 100.0
HURRICANE_WIND_KT = 64
MAJOR_HURRICANE_WIND_KT = 96


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
    # Distinct storms whose track came within PASS_RADIUS_KM, by intensity while that close.
    tropical_systems_100km: int = 0
    hurricane_passes_100km: int = 0
    major_hurricane_passes_100km: int = 0


def _distance_to_segment_km(
    latitude: float,
    longitude: float,
    start: Tuple[float, float],
    end: Tuple[float, float],
) -> float:
    """Distance from a point to a great-circle-ish segment using a local flat projection."""
    km_per_deg_lat = 111.0
    km_per_deg_lon = 111.0 * math.cos(math.radians(latitude))

    def project(point: Tuple[float, float]) -> Tuple[float, float]:
        lon_delta = (point[1] - longitude + 180.0) % 360.0 - 180.0
        return lon_delta * km_per_deg_lon, (point[0] - latitude) * km_per_deg_lat

    (x1, y1), (x2, y2) = project(start), project(end)
    dx, dy = x2 - x1, y2 - y1
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return math.hypot(x1, y1)
    t = max(0.0, min(1.0, -(x1 * dx + y1 * dy) / length_sq))
    return math.hypot(x1 + t * dx, y1 + t * dy)


def _to_float(value: object) -> Optional[float]:
    """Parse a numeric attribute; blank strings and junk become None instead of raising."""
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _sort_key(point: dict) -> Tuple[float, float]:
    return (_to_float(point.get("Hurricane_Date")) or 0.0, _to_float(point.get("OBJECTID")) or 0.0)


def count_close_passes(features: List[dict], latitude: float, longitude: float) -> Tuple[int, int, int]:
    """Return (tropical systems, hurricane-strength passes, major passes) within PASS_RADIUS_KM."""
    tracks: Dict[str, List[dict]] = {}
    for feature in features:
        attributes = feature.get("attributes") or {}
        if _to_float(attributes.get("LAT")) is None or _to_float(attributes.get("LON")) is None:
            continue
        storm_id = attributes.get("SID") or attributes.get("NAME")
        if storm_id:
            tracks.setdefault(storm_id, []).append(attributes)

    systems = hurricanes = majors = 0
    for points in tracks.values():
        points.sort(key=_sort_key)
        close_wind: Optional[float] = None
        pairs = list(zip(points, points[1:])) or [(points[0], points[0])]
        for start, end in pairs:
            distance = _distance_to_segment_km(
                latitude,
                longitude,
                (_to_float(start["LAT"]), _to_float(start["LON"])),
                (_to_float(end["LAT"]), _to_float(end["LON"])),
            )
            if distance <= PASS_RADIUS_KM:
                winds = [
                    w
                    for w in (_to_float(start.get("USA_WIND")), _to_float(end.get("USA_WIND")))
                    if w is not None
                ]
                close_wind = max([close_wind or 0.0, *winds])
        if close_wind is None:
            continue
        systems += 1
        if close_wind >= HURRICANE_WIND_KT:
            hurricanes += 1
        if close_wind >= MAJOR_HURRICANE_WIND_KT:
            majors += 1
    return systems, hurricanes, majors


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


async def _fetch_hurricane_live(latitude: float, longitude: float) -> HurricaneData:
    cutoff_year = datetime.now(timezone.utc).year - LOOKBACK_YEARS
    # The layer's season field is lowercase `year`; `SEASON` makes ArcGIS reject the query.
    where = f"year >= {cutoff_year}"
    async with httpx.AsyncClient(timeout=ARCGIS_TIMEOUT) as client:

        async def query(extra_params: dict) -> dict:
            return await query_arcgis_point(
                client,
                IBTRACS_QUERY_URL,
                latitude,
                longitude,
                out_fields=IBTRACS_OUT_FIELDS,
                where=where,
                distance=SEARCH_RADIUS_M,
                result_record_count=IBTRACS_PAGE_SIZE,
                extra_params=extra_params,
            )

        count = int((await query({"returnCountOnly": "true"})).get("count", 0))
        pages = math.ceil(count / IBTRACS_PAGE_SIZE)
        if pages > IBTRACS_MAX_PAGES:
            raise RuntimeError(f"IBTrACS returned {count} track segments; too many to page")

        responses = await asyncio.gather(
            *(
                query({"orderByFields": "OBJECTID", "resultOffset": page * IBTRACS_PAGE_SIZE})
                for page in range(pages)
            )
        )

    features = [feature for response in responses for feature in response.get("features", [])]
    if len(features) < count:
        raise RuntimeError(f"IBTrACS returned {len(features)} of {count} track segments")
    return parse_hurricane_response({"features": features}, latitude, longitude, cutoff_year)


async def get_hurricane_data(latitude: float, longitude: float) -> SourceResult[HurricaneData]:
    return await fetch_with_cache(
        SOURCE_IBTRACS,
        latitude,
        longitude,
        lambda: _fetch_hurricane_live(latitude, longitude),
        HurricaneData,
    )


def parse_hurricane_response(
    data: dict,
    latitude: float,
    longitude: float,
    cutoff_year: int,
) -> HurricaneData:
    features = data.get("features", [])
    if not features:
        return HurricaneData()

    # Peak wind per storm anywhere within the search radius. Tracked separately so the
    # feature attributes (reused by count_close_passes) keep each segment's own wind.
    peak_wind_by_storm: dict[str, Optional[float]] = {}
    nearest_distance_km: Optional[float] = None

    for feature in features:
        attributes = feature.get("attributes") or {}
        storm_year = _parse_storm_year(attributes)
        if storm_year is not None and storm_year < cutoff_year:
            continue

        storm_id = attributes.get("SID") or attributes.get("NAME") or str(id(feature))
        wind = _to_float(attributes.get("USA_WIND"))
        prior = peak_wind_by_storm.get(storm_id)
        peak_wind_by_storm[storm_id] = wind if prior is None else max(prior, wind or prior)

        storm_lat = _to_float(attributes.get("LAT"))
        storm_lon = _to_float(attributes.get("LON"))
        if storm_lat is not None and storm_lon is not None:
            distance_km = haversine_km(latitude, longitude, storm_lat, storm_lon)
            nearest_distance_km = (
                distance_km if nearest_distance_km is None else min(nearest_distance_km, distance_km)
            )

    category_distribution = {f"category_{n}": 0 for n in range(1, 6)}
    for peak_wind in peak_wind_by_storm.values():
        category = _wind_to_category(peak_wind)
        if category is not None:
            category_distribution[f"category_{category}"] += 1

    if nearest_distance_km is None:
        # No usable coordinates: every returned segment was inside the search radius.
        nearest_distance_km = float(SEARCH_RADIUS_KM)

    in_window = [
        feature
        for feature in features
        if (_parse_storm_year(feature.get("attributes") or {}) or cutoff_year) >= cutoff_year
    ]
    systems, hurricanes, majors = count_close_passes(in_window, latitude, longitude)

    return HurricaneData(
        historical_storm_count=len(peak_wind_by_storm),
        nearest_track_distance_km=round(nearest_distance_km, 2),
        category_distribution=category_distribution,
        tropical_systems_100km=systems,
        hurricane_passes_100km=hurricanes,
        major_hurricane_passes_100km=majors,
    )
