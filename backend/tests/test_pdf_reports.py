from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_pdf_download_token,
    verify_pdf_download_token,
)
from app.schemas.risk import ClimateRiskReport, HazardScore
from app.services.pdf.generator import generate_report_pdf, render_report_html


def _sample_report() -> ClimateRiskReport:
    hazard = HazardScore(
        score=55,
        severity="Moderate",
        confidence="High",
        primary_factors=["test factor"],
    )
    return ClimateRiskReport(
        address="123 Main St, Miami, FL",
        latitude=25.7617,
        longitude=-80.1918,
        flood_risk=hazard,
        hurricane_risk=hazard,
        heat_risk=hazard,
        wildfire_risk=hazard,
        overall_risk_score=55,
        verdict="Caution",
        ai_summary="Moderate risk across hazards.",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def test_pdf_download_token_round_trip():
    token = create_pdf_download_token(property_id=42, user_id=7)
    assert verify_pdf_download_token(token, 42) == 7
    assert verify_pdf_download_token(token, 99) is None


def test_pdf_download_token_rejects_expired_token():
    expire = datetime.now(timezone.utc) - timedelta(minutes=1)
    payload = {"sub": "pdf:1:2", "exp": expire, "type": "pdf_download"}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    assert verify_pdf_download_token(token, 1) is None


def test_render_report_html_includes_address():
    html = render_report_html(_sample_report())
    assert "123 Main St, Miami, FL" in html
    assert "Caution" in html


def test_generate_report_pdf_returns_pdf_bytes():
    pdf_bytes = generate_report_pdf(_sample_report())
    assert pdf_bytes.startswith(b"%PDF")
