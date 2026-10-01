from app.schemas.risk import ClimateRiskReport, HazardScore


def _format_hazard(name: str, hazard: HazardScore) -> str:
    if hazard.status == "unavailable" or hazard.score is None:
        return f"{name}: NOT ASSESSED (data unavailable). Do not describe or estimate its risk level."

    factors = ", ".join(hazard.primary_factors) or "No primary factors reported"
    return (
        f"{name}: {hazard.score}/100 ({hazard.severity}; "
        f"confidence: {hazard.confidence}). Primary factors: {factors}."
    )


def _assessed(hazard: HazardScore) -> bool:
    return hazard.status != "unavailable" and hazard.score is not None


def _attribution(report: ClimateRiskReport) -> str:
    """Credit only the providers whose data was actually used in this report."""
    sources = []
    if _assessed(report.hurricane_risk):
        sources.append("NOAA IBTrACS")
    if _assessed(report.heat_risk):
        sources.append("NOAA NCEI")
    if _assessed(report.flood_risk):
        sources.append("FEMA NFHL")
    if _assessed(report.wildfire_risk):
        sources.append("USFS")
        if not any("NIFC" in factor and "unavailable" in factor for factor in report.wildfire_risk.primary_factors):
            sources.append("NIFC")
    return ", ".join(sources) or "no external data sources"


def build_risk_prompt(report: ClimateRiskReport) -> tuple[str, str]:
    system_prompt = (
        "Act as a senior climate risk analyst writing for property investors. "
        "Write a factual, direct assessment that names contributing risk factors. "
        "Keep the response between 150–250 words. Do not invent facts or present "
        "the analysis as professional financial or legal advice. "
        "If a hazard is marked NOT ASSESSED, say only that it could not be assessed "
        "for this report. Never estimate, characterise, or imply its risk level, and "
        "do not use general knowledge about the area to fill the gap."
    )

    hazard_lines = "\n".join(
        [
            _format_hazard("Flood", report.flood_risk),
            _format_hazard("Hurricane", report.hurricane_risk),
            _format_hazard("Heat", report.heat_risk),
            _format_hazard("Wildfire", report.wildfire_risk),
        ]
    )

    overall_line = (
        f"Overall climate risk score: {report.overall_risk_score}/100."
        if report.overall_risk_score is not None and report.verdict is not None
        else "Overall climate risk score: withheld (one or more hazards not assessed)."
    )
    verdict_line = (
        f"Verdict: {report.verdict}." + (f" {report.verdict_reason}" if report.verdict_reason else "")
        if report.verdict is not None
        else "Verdict: withheld because not every hazard could be assessed."
    )

    user_prompt = f"""Analyze climate risk for {report.address}.

{hazard_lines}
{overall_line}
{verdict_line}

Write:
1. A plain-English summary covering all four hazards. If a hazard was not assessed, say so plainly; otherwise do not comment on assessment status.
2. The single biggest risk driver among the assessed hazards.
3. A forward-looking statement beginning exactly: "Over the next 10–30 years..."
4. A restatement of the verdict with justification (or explain why no verdict is available).
5. A closing attribution naming {_attribution(report)}.
"""

    return system_prompt, user_prompt
