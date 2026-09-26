from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable, Optional, TypeVar

from pydantic import BaseModel
from app.core.database import async_session
from app.models.climate_source_cache import ClimateSourceCache
from app.services.climate.source_result import SourceResult

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

SOURCE_FEMA = "fema_nfhl"
# Bumped after fixing the IBTrACS query; older rows were parsed from an error body.
SOURCE_IBTRACS = "ibtracs_v2"
# Bumped when WildfireData gained USFS WHP shares so older cache rows are not reused.
SOURCE_WFIGS = "wfigs_whp"
# Bumped when heat switched from GHCND days >= 95°F to GSOY DX90 (days >= 90°F).
SOURCE_NOAA_HEAT = "noaa_heat_dx90"

STALE_TTL = {
    SOURCE_FEMA: timedelta(days=30),
    SOURCE_IBTRACS: timedelta(days=7),
    SOURCE_WFIGS: timedelta(days=7),
    SOURCE_NOAA_HEAT: timedelta(hours=24),
}


def quantize_cell(latitude: float, longitude: float) -> tuple[int, int]:
    return round(latitude * 100), round(longitude * 100)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


async def get_cached_payload(
    source: str,
    latitude: float,
    longitude: float,
) -> Optional[tuple[dict, datetime]]:
    lat_cell, lon_cell = quantize_cell(latitude, longitude)
    async with async_session() as session:
        row = await session.get(ClimateSourceCache, (source, lat_cell, lon_cell))
        if row is None:
            return None
        fetched_at = row.fetched_at
        if fetched_at.tzinfo is None:
            fetched_at = fetched_at.replace(tzinfo=timezone.utc)
        return row.payload, fetched_at


async def put_cached_payload(
    source: str,
    latitude: float,
    longitude: float,
    payload: dict,
) -> datetime:
    lat_cell, lon_cell = quantize_cell(latitude, longitude)
    fetched_at = _utc_now()
    async with async_session() as session:
        row = await session.get(ClimateSourceCache, (source, lat_cell, lon_cell))
        if row is None:
            session.add(
                ClimateSourceCache(
                    source=source,
                    lat_cell=lat_cell,
                    lon_cell=lon_cell,
                    payload=payload,
                    fetched_at=fetched_at,
                )
            )
        else:
            row.payload = payload
            row.fetched_at = fetched_at
        await session.commit()
    return fetched_at


async def fetch_with_cache(
    source: str,
    latitude: float,
    longitude: float,
    fetcher: Callable[[], Awaitable[T]],
    model_type: type[T],
) -> SourceResult[T]:
    ttl_stale = STALE_TTL[source]
    try:
        data = await fetcher()
        fetched_at = await put_cached_payload(
            source, latitude, longitude, data.model_dump(mode="json")
        )
        return SourceResult(status="ok", data=data, as_of=_iso(fetched_at), error=None)
    except Exception as exc:
        error = str(exc) or type(exc).__name__
        logger.warning(
            "Live fetch failed for source=%s at (%s, %s): %s",
            source,
            latitude,
            longitude,
            error,
        )
        cached = await get_cached_payload(source, latitude, longitude)
        if cached is not None:
            payload, fetched_at = cached
            age = _utc_now() - fetched_at
            if age <= ttl_stale:
                return SourceResult(
                    status="stale",
                    data=model_type.model_validate(payload),
                    as_of=_iso(fetched_at),
                    error=error,
                )
        return SourceResult(
            status="unavailable",
            data=None,
            as_of=None,
            error=error,
        )
