from app.schemas.risk import ClimateRiskReport, HazardScore


def _format_hazard(name: str, hazard: HazardScore) -> str:
    factors = ", ".join(hazard.primary_factors) or "No primary factors reported"
    return (
        f"{name}: {hazard.score}/100 ({hazard.severity}; "
        f"confidence: {hazard.confidence}). Primary factors: {factors}."
    )


def build_risk_prompt(report: ClimateRiskReport) -> tuple[str, str]:
    system_prompt = (
        "Act as a senior climate risk analyst writing for property investors. "
        "Write a factual, direct assessment that names contributing risk factors. "
        "Keep the response between 150–250 words. Do not invent facts or present "
        "the analysis as professional financial or legal advice."
    )

    hazard_lines = "\n".join(
        [
            _format_hazard("Flood", report.flood_risk),
            _format_hazard("Hurricane", report.hurricane_risk),
            _format_hazard("Heat", report.heat_risk),
            _format_hazard("Wildfire", report.wildfire_risk),
        ]
    )

    user_prompt = f"""Analyze climate risk for {report.address}.

{hazard_lines}
Overall climate risk score: {report.overall_risk_score}/100.
Verdict: {report.verdict}.

Write:
1. A plain-English summary covering all four hazards.
2. The single biggest risk driver for this address.
3. A forward-looking statement beginning exactly: "Over the next 10–30 years..."
4. A restatement of the {report.verdict} verdict with justification.
5. A closing attribution naming NOAA, FEMA NFHL, and USGS.
"""

    return system_prompt, user_prompt
