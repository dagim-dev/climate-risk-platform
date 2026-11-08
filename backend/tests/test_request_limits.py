import json

import pytest
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.risk import ClimateRiskReport, SourceStatus
from tests.test_properties import _auth_headers, _sample_report


def test_oversized_body_is_rejected_before_parsing(client):
    headers = _auth_headers(client)
    report = _sample_report()
    report["ai_summary"] = "A" * (settings.MAX_REQUEST_BODY_BYTES + 1)

    response = client.post("/api/v1/properties", json={"report": report}, headers=headers)

    assert response.status_code == 413
    assert client.get("/api/v1/properties", headers=headers).json() == []


def test_oversized_chunked_body_is_rejected(client):
    headers = {**_auth_headers(client), "Content-Type": "application/json"}
    payload = json.dumps({"report": {**_sample_report(), "ai_summary": "A" * 400_000}}).encode()

    def chunks():
        for start in range(0, len(payload), 64 * 1024):
            yield payload[start : start + 64 * 1024]

    response = client.post("/api/v1/properties", content=chunks(), headers=headers)

    assert response.status_code == 413


def test_long_report_text_is_trimmed():
    report = ClimateRiskReport.model_validate(
        {**_sample_report(address="X" * 1000), "ai_summary": "A" * 20_000}
    )

    assert len(report.address) == 300
    assert len(report.ai_summary) == 5000


def test_long_source_error_is_trimmed_not_rejected():
    # Source errors are raw exception text from our own fetchers; they must never fail a report.
    assert len(SourceStatus(status="unavailable", error="E" * 10_000).error) == 500


@pytest.mark.parametrize(
    "override",
    [
        {"historical_trend": [{"year": 2030}] * 21},
        {"latitude": 500},
        {"flood_risk": {"score": 10, "primary_factors": ["f"] * 11}},
    ],
)
def test_out_of_range_report_is_rejected(client, override):
    headers = _auth_headers(client)

    response = client.post(
        "/api/v1/properties", json={"report": {**_sample_report(), **override}}, headers=headers
    )

    assert response.status_code == 422


def test_saved_property_cap(client, monkeypatch):
    monkeypatch.setattr(settings, "MAX_SAVED_PROPERTIES", 2)
    headers = _auth_headers(client)

    for address in ("1 A St", "2 B St"):
        response = client.post(
            "/api/v1/properties", json={"report": _sample_report(address)}, headers=headers
        )
        assert response.status_code == 201

    blocked = client.post(
        "/api/v1/properties", json={"report": _sample_report("3 C St")}, headers=headers
    )
    assert blocked.status_code == 409

    # Re-saving an address already in the list updates it and is still allowed at the cap.
    resaved = client.post(
        "/api/v1/properties", json={"report": _sample_report("1 A St")}, headers=headers
    )
    assert resaved.status_code == 201
