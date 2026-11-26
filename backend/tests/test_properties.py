import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import get_db
from app.main import app
from app.models.property import Property
from app.models.user import User


def _sample_report(address: str = "123 Main St, Miami, FL") -> dict:
    hazard = {
        "score": 55,
        "severity": "Moderate",
        "confidence": "High",
        "primary_factors": ["test factor"],
    }
    return {
        "address": address,
        "latitude": 25.7617,
        "longitude": -80.1918,
        "flood_risk": hazard,
        "hurricane_risk": hazard,
        "heat_risk": hazard,
        "wildfire_risk": hazard,
        "overall_risk_score": 55,
        "verdict": "Caution",
        "ai_summary": "Moderate risk across hazards.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _auth_headers(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner@example.com",
            "password": "securepass",
            "name": "Owner",
        },
    )
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_properties_crud_and_pdf_download(client):
    headers = _auth_headers(client)
    report = _sample_report()

    created = client.post("/api/v1/properties", json={"report": report}, headers=headers)
    assert created.status_code == 201
    property_id = created.json()["id"]
    assert created.json()["address"] == report["address"]
    assert created.json()["report_data"]["verdict"] == "Caution"

    listed = client.get("/api/v1/properties", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == property_id

    pdf = client.post(f"/api/v1/properties/{property_id}/pdf", headers=headers)
    assert pdf.status_code == 200
    pdf_url = pdf.json()["pdf_url"]
    assert "/pdf/download?token=" in pdf_url

    token = pdf_url.split("token=", 1)[1]
    download = client.get(f"/api/v1/properties/{property_id}/pdf/download", params={"token": token})
    assert download.status_code == 200
    assert download.headers["content-type"] == "application/pdf"
    assert download.content.startswith(b"%PDF")

    forbidden = client.get(
        f"/api/v1/properties/{property_id}/pdf/download",
        params={"token": "not-a-valid-token"},
    )
    assert forbidden.status_code == 403

    deleted = client.delete(f"/api/v1/properties/{property_id}", headers=headers)
    assert deleted.status_code == 204

    after_delete = client.get(f"/api/v1/properties/{property_id}/pdf/download", params={"token": token})
    assert after_delete.status_code == 404

    empty = client.get("/api/v1/properties", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == []


def test_properties_require_authentication(client):
    report = _sample_report()
    assert client.post("/api/v1/properties", json={"report": report}).status_code == 401
    assert client.get("/api/v1/properties").status_code == 401
    assert client.delete("/api/v1/properties/1").status_code == 401


# Reports saved before the Risk Outlook was removed still carry its points.
_LEGACY_TREND = [
    {"year": 2026, "flood_score": 55, "hurricane_score": 55, "heat_score": 55,
     "wildfire_score": 55, "is_projection": False},
    {"year": 2050, "flood_score": 60, "hurricane_score": 62, "heat_score": 70,
     "wildfire_score": 58, "is_projection": True},
]


def _insert_legacy_property(owner_email: str) -> int:
    """Write a saved row directly, as an older release stored it, bypassing validation."""

    async def insert() -> int:
        session_gen = app.dependency_overrides[get_db]()
        session = await session_gen.__anext__()
        try:
            user = (await session.execute(select(User).where(User.email == owner_email))).scalar_one()
            report = {**_sample_report("9 Legacy Ln, Miami, FL"), "historical_trend": _LEGACY_TREND}
            property_ = Property(
                user_id=user.id,
                address=report["address"],
                latitude=report["latitude"],
                longitude=report["longitude"],
                report_data=report,
            )
            session.add(property_)
            await session.commit()
            return property_.id
        finally:
            await session_gen.aclose()

    return asyncio.run(insert())


def test_legacy_report_with_historical_trend_still_lists_and_downloads(client):
    headers = _auth_headers(client)
    property_id = _insert_legacy_property("owner@example.com")

    listed = client.get("/api/v1/properties", headers=headers)
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [property_id]
    assert listed.json()[0]["verdict"] == "Caution"

    pdf = client.post(f"/api/v1/properties/{property_id}/pdf", headers=headers)
    assert pdf.status_code == 200
    token = pdf.json()["pdf_url"].split("token=", 1)[1]

    download = client.get(
        f"/api/v1/properties/{property_id}/pdf/download", params={"token": token}
    )
    assert download.status_code == 200
    assert download.content.startswith(b"%PDF")


def test_saving_report_with_old_historical_trend_field_drops_it(client):
    headers = _auth_headers(client)
    report = {**_sample_report(), "historical_trend": _LEGACY_TREND}

    created = client.post("/api/v1/properties", json={"report": report}, headers=headers)

    assert created.status_code == 201
    assert "historical_trend" not in created.json()["report_data"]
