from typing import Annotated, Dict, List, Literal, Optional

from pydantic import BaseModel, BeforeValidator, Field

HazardStatus = Literal["ok", "stale", "unavailable"]
OverallStatus = Literal["complete", "partial", "unavailable"]
Severity = Literal["Low", "Moderate", "High", "Extreme"]
Verdict = Literal["Go", "Caution", "Avoid"]


# Saved properties accept a full report from the client, so every field is bounded.
# Free text is trimmed rather than rejected: some of it (source errors) is raw exception
# text from our own fetchers, and a long message must not fail an analysis.
def _trimmed(limit: int):
    def trim(value):
        return value[:limit] if isinstance(value, str) else value

    return BeforeValidator(trim)


ShortText = Annotated[str, _trimmed(64)]
Text = Annotated[str, _trimmed(500)]
LongText = Annotated[str, _trimmed(5000)]

MAX_FACTORS = 10
MAX_SOURCES = 10
MAX_TREND_POINTS = 20


class HazardScore(BaseModel):
    status: HazardStatus = "ok"
    score: Optional[int] = Field(default=None, ge=0, le=100)
    severity: Optional[Severity] = None
    confidence: ShortText = "Medium"
    primary_factors: List[Text] = Field(default_factory=list, max_length=MAX_FACTORS)
    as_of: Optional[ShortText] = None
    unavailable_reason: Optional[Text] = None


class SourceStatus(BaseModel):
    status: HazardStatus
    as_of: Optional[ShortText] = None
    error: Optional[Text] = None


class TrendPoint(BaseModel):
    year: int = Field(ge=1900, le=2200)
    # None when that hazard could not be assessed (nothing to project from).
    flood_score: Optional[int] = Field(None, ge=0, le=100)
    hurricane_score: Optional[int] = Field(None, ge=0, le=100)
    heat_score: Optional[int] = Field(None, ge=0, le=100)
    wildfire_score: Optional[int] = Field(None, ge=0, le=100)
    is_projection: bool = False


class ClimateRiskReport(BaseModel):
    address: Annotated[str, _trimmed(300)]
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    flood_risk: HazardScore
    hurricane_risk: HazardScore
    heat_risk: HazardScore
    wildfire_risk: HazardScore
    overall_risk_score: Optional[int] = Field(default=None, ge=0, le=100)
    overall_status: OverallStatus = "complete"
    verdict: Optional[Verdict] = None
    verdict_reason: Optional[Text] = None
    sources: Dict[ShortText, SourceStatus] = Field(default_factory=dict, max_length=MAX_SOURCES)
    ai_summary: Optional[LongText] = None
    generated_at: ShortText
    historical_trend: List[TrendPoint] = Field(default_factory=list, max_length=MAX_TREND_POINTS)
