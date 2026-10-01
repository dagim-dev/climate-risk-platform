from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable, Optional, TypeVar

import httpx
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError

from app.core.database import async_session
from app.models.climate_source_cache import ClimateSourceCache
from app.services.climate.source_result import SourceResult

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Bumped when FloodZoneData gained zone_subtype/mapped (shaded X, levee and unmapped areas).
SOURCE_FEMA = "fema_nfhl_v2"
# Bumped after fixing the IBTrACS query; older rows were parsed from an error body.
SOURCE_IBTRACS = "ibtracs_v2"
# Bumped when WildfireData gained USFS WHP shares so older cache rows are not reused.
# Bumped again when fire_count_20_years became nullable (NIFC failure keeps WHP).
SOURCE_WFIGS = "wfigs_whp_v2"
# Bumped when heat switched to GSOY DX90 (days >= 90°F), and again when the trend
# started using real years and HeatRiskData recorded the observed span.
SOURCE_NOAA_HEAT = "noaa_heat_dx90_v2"

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
    # Two concurrent requests for the same cell can both see "no row"; the loser of the
    # INSERT race retries once and takes the UPDATE path.
    for attempt in range(2):
        try:
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
        except IntegrityError:
            if attempt:
                raise
    raise AssertionError("unreachable")


def public_error_message(exc: BaseException) -> str:
    """Describe a fetch failure without leaking upstream URLs or internals to clients."""
    if isinstance(exc, (httpx.TimeoutException, TimeoutError)):
        return "The data provider did not respond in time"
    if isinstance(exc, httpx.HTTPStatusError):
        return f"The data provider returned HTTP {exc.response.status_code}"
    if isinstance(exc, httpx.RequestError):
        return "Could not reach the data provider"
    if isinstance(exc, (RuntimeError, ValueError)) and str(exc):
        # Raised deliberately by our fetchers/parsers with a user-facing message.
        return str(exc)
    return "The data provider returned an unexpected response"


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
    except Exception as exc:
        error = public_error_message(exc)
        logger.warning(
            "Live fetch failed for source=%s at (%s, %s): %s",
            source,
            latitude,
            longitude,
            str(exc) or type(exc).__name__,
            exc_info=not isinstance(exc, (httpx.HTTPError, RuntimeError, TimeoutError)),
        )
        return await _stale_or_unavailable(source, latitude, longitude, model_type, ttl_stale, error)

    try:
        fetched_at = await put_cached_payload(
            source, latitude, longitude, data.model_dump(mode="json")
        )
    except Exception:
        # A cache write failure must not discard a good live result.
        logger.exception("Cache write failed for source=%s", source)
        fetched_at = _utc_now()
    return SourceResult(status="ok", data=data, as_of=_iso(fetched_at), error=None)


async def _stale_or_unavailable(
    source: str,
    latitude: float,
    longitude: float,
    model_type: type[T],
    ttl_stale: timedelta,
    error: str,
) -> SourceResult[T]:
    try:
        cached = await get_cached_payload(source, latitude, longitude)
        if cached is not None:
            payload, fetched_at = cached
            if _utc_now() - fetched_at <= ttl_stale:
                return SourceResult(
                    status="stale",
                    data=model_type.model_validate(payload),
                    as_of=_iso(fetched_at),
                    error=error,
                )
    except Exception:
        logger.exception("Cache read failed for source=%s", source)
    return SourceResult(status="unavailable", data=None, as_of=None, error=error)
