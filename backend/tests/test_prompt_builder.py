from app.schemas.risk import ClimateRiskReport, HazardScore
from app.services.ai.prompt_builder import build_risk_prompt


def _hazard(score: int, severity: str, factors: list[str]) -> HazardScore:
    return HazardScore(
        score=score,
        severity=severity,
        confidence="High",
        primary_factors=factors,
    )


def _report() -> ClimateRiskReport:
    return ClimateRiskReport(
        address="123 Ocean Dr, Miami Beach, FL",
        latitude=25.79,
        longitude=-80.13,
        flood_risk=_hazard(82, "High", ["FEMA AE flood zone"]),
        hurricane_risk=_hazard(91, "Extreme", ["45 historical storms"]),
        heat_risk=_hazard(63, "Moderate", ["Increasing extreme heat days"]),
        wildfire_risk=_hazard(12, "Low", []),
        overall_risk_score=72,
        verdict="Avoid",
        generated_at="2026-08-23T12:00:00+00:00",
    )


def test_build_risk_prompt_includes_role_length_and_style_rules():
    system_prompt, _ = build_risk_prompt(_report())

    assert "senior climate risk analyst" in system_prompt.lower()
    assert "property investors" in system_prompt.lower()
    assert "150–250 words" in system_prompt
    assert "factual" in system_prompt.lower()


def test_build_risk_prompt_includes_report_values_and_requested_sections():
    _, user_prompt = build_risk_prompt(_report())

    for value in [
        "123 Ocean Dr, Miami Beach, FL",
        "Flood: 82/100",
        "Hurricane: 91/100",
        "Heat: 63/100",
        "Wildfire: 12/100",
        "Avoid",
        "FEMA AE flood zone",
        "45 historical storms",
    ]:
        assert value in user_prompt

    assert "Over the next 10–30 years..." in user_prompt
    assert "NOAA IBTrACS, NOAA NCEI, FEMA NFHL, USFS, NIFC" in user_prompt
    assert "EarthData" not in user_prompt
    assert "No primary factors reported" in user_prompt


def test_build_risk_prompt_forbids_guessing_unassessed_hazards():
    report = _report()
    report.flood_risk = HazardScore(
        status="unavailable",
        score=None,
        severity=None,
        confidence="None",
        primary_factors=[],
        unavailable_reason="FEMA timeout",
    )
    report.overall_status = "partial"
    report.verdict = None

    system_prompt, user_prompt = build_risk_prompt(report)

    assert "Flood: NOT ASSESSED" in user_prompt
    assert "Flood: 82/100" not in user_prompt
    assert "Overall climate risk score: withheld" in user_prompt
    assert "Verdict: withheld" in user_prompt
    assert "never estimate" in system_prompt.lower()
