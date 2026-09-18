from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest

from app.services.climate.flood_data import FloodZoneData
from app.services.climate.source_cache import SOURCE_FEMA, fetch_with_cache
from app.services.climate.wildfire_data import _fetch_wildfire_live


@pytest.mark.asyncio
async def test_fetch_with_cache_returns_unavailable_when_live_and_cache_miss():
    async def failing_fetcher():
        raise RuntimeError("upstream down")

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(return_value=None),
    ):
        result = await fetch_with_cache(
            SOURCE_FEMA,
            25.0,
            -80.0,
            failing_fetcher,
            FloodZoneData,
        )

    assert result.status == "unavailable"
    assert result.data is None


@pytest.mark.asyncio
async def test_fetch_with_cache_returns_unavailable_when_cache_expired():
    stale_payload = FloodZoneData(
        flood_zone="AE",
        base_flood_elevation=8.0,
        special_flood_hazard_area=True,
    ).model_dump(mode="json")
    fetched_at = datetime.now(timezone.utc) - timedelta(days=31)

    async def failing_fetcher():
        raise RuntimeError("upstream down")

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(return_value=(stale_payload, fetched_at)),
    ):
        result = await fetch_with_cache(
            SOURCE_FEMA,
            25.0,
            -80.0,
            failing_fetcher,
            FloodZoneData,
        )

    assert result.status == "unavailable"


@pytest.mark.asyncio
async def test_wildfire_pagination_deadline_returns_unavailable_via_fetch():
    call_count = 0

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            nonlocal call_count
            call_count += 1
            return {"features": [{"attributes": {"INCIDENT": "F1", "FIRE_YEAR_INT": 2020}}], "exceededTransferLimit": True}

    class FakeClient:
        async def get(self, *args, **kwargs):
            return FakeResponse()

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

    with patch("app.services.climate.wildfire_data.httpx.AsyncClient", return_value=FakeClient()):
        with patch("app.services.climate.wildfire_data.time.monotonic", side_effect=[0.0, 100.0]):
            with pytest.raises(TimeoutError):
                await _fetch_wildfire_live(39.0, -121.0)
