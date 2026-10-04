from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.core.rate_limit import (
    DAY_SECONDS,
    RATE_LIMIT_MESSAGE,
    SlidingWindowLimiter,
    analyze_limiter,
)
from app.main import app
from app.schemas.address import MAX_ADDRESS_LENGTH

client = TestClient(app)


def test_per_minute_limit_blocks_then_recovers():
    limiter = SlidingWindowLimiter(per_minute=2, per_day=100)
    assert limiter.check("1.2.3.4", now=0) is None
    assert limiter.check("1.2.3.4", now=1) is None
    assert limiter.check("1.2.3.4", now=2) == 58
    # Other clients are unaffected.
    assert limiter.check("5.6.7.8", now=2) is None
    assert limiter.check("1.2.3.4", now=61) is None


def test_per_day_limit_blocks_until_oldest_hit_expires():
    limiter = SlidingWindowLimiter(per_minute=100, per_day=3)
    for t in (0, 100, 200):
        assert limiter.check("ip", now=t) is None
    assert limiter.check("ip", now=300) == DAY_SECONDS - 300
    assert limiter.check("ip", now=DAY_SECONDS) is None


def test_rejected_requests_do_not_count():
    limiter = SlidingWindowLimiter(per_minute=1, per_day=100)
    assert limiter.check("ip", now=0) is None
    for t in range(1, 30):
        assert limiter.check("ip", now=t) is not None
    assert limiter.check("ip", now=60) is None


def _analyze(ip_header: str):
    return client.post(
        "/api/v1/analyze",
        json={"address": "Toronto, ON, Canada"},
        headers={"X-Forwarded-For": ip_header},
    )


def test_analyze_returns_429_after_limit(monkeypatch):
    monkeypatch.setattr(analyze_limiter, "per_minute", 2)
    geocode = AsyncMock(side_effect=ValueError("Please enter a valid US address."))
    with patch("app.api.v1.endpoints.risk.geocode_address", new=geocode):
        assert _analyze("9.9.9.9").status_code == 400
        assert _analyze("9.9.9.9").status_code == 400
        blocked = _analyze("9.9.9.9")

    assert blocked.status_code == 429
    assert blocked.json()["detail"] == RATE_LIMIT_MESSAGE
    assert int(blocked.headers["Retry-After"]) > 0
    # The blocked request never reached the paid geocoding call.
    assert geocode.await_count == 2


def test_spoofed_forwarded_for_prefix_does_not_bypass_limit(monkeypatch):
    monkeypatch.setattr(analyze_limiter, "per_minute", 1)
    geocode = AsyncMock(side_effect=ValueError("Please enter a valid US address."))
    with patch("app.api.v1.endpoints.risk.geocode_address", new=geocode):
        assert _analyze("1.1.1.1, 9.9.9.9").status_code == 400
        assert _analyze("2.2.2.2, 9.9.9.9").status_code == 429


def test_overlong_address_is_rejected_before_geocoding():
    geocode = AsyncMock()
    with patch("app.api.v1.endpoints.risk.geocode_address", new=geocode):
        response = client.post(
            "/api/v1/analyze", json={"address": "a" * (MAX_ADDRESS_LENGTH + 1)}
        )
    assert response.status_code == 422
    geocode.assert_not_called()


def test_geocode_endpoint_is_removed():
    response = client.post("/api/v1/geocode", json={"address": "Denver, CO"})
    assert response.status_code == 404
