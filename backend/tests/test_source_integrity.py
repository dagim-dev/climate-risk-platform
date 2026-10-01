from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services.climate.flood_data import FloodZoneData
from app.services.climate.source_cache import SOURCE_FEMA, fetch_with_cache
from app.services.climate.flood_data import (
    NFHL_FALLBACK_URL,
    NFHL_FLOOD_ZONE_URL,
    PROVIDER_FALLBACK,
    PROVIDER_FEMA,
    _fetch_flood_zone_live,
)
from app.services.climate.wildfire_data import _fetch_fire_count


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
                await _fetch_fire_count(39.0, -121.0)


@pytest.mark.asyncio
async def test_fetch_with_cache_error_is_never_empty():
    async def failing_fetcher():
        raise httpx.ConnectError("")

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(return_value=None),
    ):
        result = await fetch_with_cache(SOURCE_FEMA, 25.0, -80.0, failing_fetcher, FloodZoneData)

    assert result.status == "unavailable"
    assert result.error == "Could not reach the data provider"


VE_PAYLOAD = {"features": [{"attributes": {"FLD_ZONE": "VE", "SFHA_TF": "T", "STATIC_BFE": 9}}]}


@pytest.mark.asyncio
async def test_flood_uses_fema_when_it_responds():
    query = AsyncMock(return_value=VE_PAYLOAD)
    with patch("app.services.climate.flood_data._query_flood_zones", new=query):
        data = await _fetch_flood_zone_live(25.77, -80.13)

    assert data.flood_zone == "VE"
    assert data.provider == PROVIDER_FEMA
    assert query.await_count == 1
    assert query.await_args.args[0] == NFHL_FLOOD_ZONE_URL


@pytest.mark.asyncio
async def test_flood_falls_back_to_mirror_when_fema_unreachable():
    async def fake_query(url, *args):
        if url == NFHL_FLOOD_ZONE_URL:
            raise httpx.ConnectError("connection reset")
        return VE_PAYLOAD

    with patch("app.services.climate.flood_data._query_flood_zones", new=fake_query):
        data = await _fetch_flood_zone_live(25.77, -80.13)

    assert data.flood_zone == "VE"
    assert data.provider == PROVIDER_FALLBACK


@pytest.mark.asyncio
async def test_flood_falls_back_when_fema_returns_arcgis_error_body():
    calls = []

    async def fake_query(url, *args):
        calls.append(url)
        if url == NFHL_FLOOD_ZONE_URL:
            raise RuntimeError("ArcGIS error: Service unavailable")
        return VE_PAYLOAD

    with patch("app.services.climate.flood_data._query_flood_zones", new=fake_query):
        data = await _fetch_flood_zone_live(25.77, -80.13)

    assert calls == [NFHL_FLOOD_ZONE_URL, NFHL_FALLBACK_URL]
    assert data.provider == PROVIDER_FALLBACK


@pytest.mark.asyncio
async def test_flood_unavailable_when_both_sources_fail():
    async def fake_query(url, *args):
        raise httpx.ConnectError("")

    with patch("app.services.climate.flood_data._query_flood_zones", new=fake_query):
        with patch(
            "app.services.climate.source_cache.get_cached_payload",
            new=AsyncMock(return_value=None),
        ):
            from app.services.climate.flood_data import get_flood_zone_data

            result = await get_flood_zone_data(25.77, -80.13)

    assert result.status == "unavailable"
    assert result.error


@pytest.mark.asyncio
async def test_noaa_get_retries_once_on_rate_limit():
    from app.services.climate import heat_data

    responses = [
        httpx.Response(429, request=httpx.Request("GET", "https://noaa.test")),
        httpx.Response(200, json={"results": []}, request=httpx.Request("GET", "https://noaa.test")),
    ]

    class FakeClient:
        async def get(self, *args, **kwargs):
            return responses.pop(0)

    with patch.object(heat_data, "NOAA_RATE_LIMIT_BACKOFF_SECONDS", 0):
        data = await heat_data._noaa_get(FakeClient(), "data", {})

    assert data == {"results": []}
    assert responses == []


@pytest.mark.asyncio
async def test_noaa_get_raises_when_still_rate_limited():
    from app.services.climate import heat_data

    class FakeClient:
        async def get(self, *args, **kwargs):
            return httpx.Response(429, request=httpx.Request("GET", "https://noaa.test"))

    with patch.object(heat_data, "NOAA_RATE_LIMIT_BACKOFF_SECONDS", 0):
        with pytest.raises(httpx.HTTPStatusError):
            await heat_data._noaa_get(FakeClient(), "data", {})


@pytest.mark.asyncio
async def test_arcgis_query_retries_once_on_connect_timeout():
    from app.services.climate.utils import query_arcgis_point

    calls = 0

    class FakeClient:
        async def get(self, *args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise httpx.ConnectTimeout("")
            return httpx.Response(200, json={"features": []}, request=httpx.Request("GET", "https://arcgis.test"))

    data = await query_arcgis_point(FakeClient(), "https://arcgis.test", 25.0, -80.0, out_fields="*")

    assert data == {"features": []}
    assert calls == 2


@pytest.mark.asyncio
async def test_arcgis_query_does_not_retry_read_timeouts():
    from app.services.climate.utils import query_arcgis_point

    calls = 0

    class FakeClient:
        async def get(self, *args, **kwargs):
            nonlocal calls
            calls += 1
            raise httpx.ReadTimeout("")

    with pytest.raises(httpx.ReadTimeout):
        await query_arcgis_point(FakeClient(), "https://arcgis.test", 25.0, -80.0, out_fields="*")
    assert calls == 1


@pytest.mark.asyncio
async def test_cache_write_failure_still_returns_live_result():
    async def fetcher():
        return FloodZoneData(flood_zone="AE", base_flood_elevation=8.0, special_flood_hazard_area=True)

    with patch(
        "app.services.climate.source_cache.put_cached_payload",
        new=AsyncMock(side_effect=RuntimeError("database is down")),
    ):
        result = await fetch_with_cache(SOURCE_FEMA, 25.0, -80.0, fetcher, FloodZoneData)

    assert result.status == "ok"
    assert result.data.flood_zone == "AE"


@pytest.mark.asyncio
async def test_cache_read_failure_on_fallback_is_unavailable_not_500():
    async def failing_fetcher():
        raise httpx.ReadTimeout("slow")

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(side_effect=RuntimeError("database is down")),
    ):
        result = await fetch_with_cache(SOURCE_FEMA, 25.0, -80.0, failing_fetcher, FloodZoneData)

    assert result.status == "unavailable"
    assert result.error == "The data provider did not respond in time"


@pytest.mark.asyncio
async def test_upstream_url_is_not_leaked_in_error():
    request = httpx.Request("GET", "https://example.test/secret?token=abc")

    async def failing_fetcher():
        raise httpx.HTTPStatusError("boom", request=request, response=httpx.Response(503, request=request))

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(return_value=None),
    ):
        result = await fetch_with_cache(SOURCE_FEMA, 25.0, -80.0, failing_fetcher, FloodZoneData)

    assert result.error == "The data provider returned HTTP 503"


@pytest.mark.asyncio
async def test_wildfire_keeps_whp_when_nifc_fails():
    from app.services.climate.wildfire_data import _fetch_wildfire_live
    from app.services.scoring.wildfire_scorer import score_wildfire_risk

    with patch(
        "app.services.climate.wildfire_data._fetch_whp_class_shares",
        new=AsyncMock(return_value={4: 0.5, 6: 0.5}),
    ), patch(
        "app.services.climate.wildfire_data._fetch_fire_count",
        new=AsyncMock(side_effect=httpx.ConnectError("")),
    ):
        data = await _fetch_wildfire_live(39.76, -121.62)

    assert data.fire_count_20_years is None
    hazard = score_wildfire_risk(data, 39.76, -121.62)
    assert hazard.score is not None
    assert hazard.confidence == "Medium"
    assert any("NIFC" in factor for factor in hazard.primary_factors)


@pytest.mark.asyncio
async def test_flood_zone_d_does_not_fall_back_to_mirror():
    from app.services.climate.flood_data import FloodZoneUndetermined

    zone_d = {"features": [{"attributes": {"FLD_ZONE": "D", "SFHA_TF": "F"}}]}
    query = AsyncMock(return_value=zone_d)
    with patch("app.services.climate.flood_data._query_flood_zones", new=query):
        with pytest.raises(FloodZoneUndetermined):
            await _fetch_flood_zone_live(25.0, -80.0)

    assert query.await_count == 1
