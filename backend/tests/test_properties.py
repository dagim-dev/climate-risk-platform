from datetime import datetime, timezone


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
        "historical_trend": [],
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

    empty = client.get("/api/v1/properties", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == []


def test_properties_require_authentication(client):
    report = _sample_report()
    assert client.post("/api/v1/properties", json={"report": report}).status_code == 401
    assert client.get("/api/v1/properties").status_code == 401
    assert client.delete("/api/v1/properties/1").status_code == 401
