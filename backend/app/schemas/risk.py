from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

HazardStatus = Literal["ok", "stale", "unavailable"]
OverallStatus = Literal["complete", "partial", "unavailable"]


class HazardScore(BaseModel):
    status: HazardStatus = "ok"
    score: Optional[int] = Field(default=None, ge=0, le=100)
    severity: Optional[str] = None
    confidence: str = "Medium"
    primary_factors: List[str] = Field(default_factory=list)
    as_of: Optional[str] = None
    unavailable_reason: Optional[str] = None


class SourceStatus(BaseModel):
    status: HazardStatus
    as_of: Optional[str] = None
    error: Optional[str] = None


class TrendPoint(BaseModel):
    year: int
    flood_score: int = Field(..., ge=0, le=100)
    hurricane_score: int = Field(..., ge=0, le=100)
    heat_score: int = Field(..., ge=0, le=100)
    wildfire_score: int = Field(..., ge=0, le=100)
    is_projection: bool = False


class ClimateRiskReport(BaseModel):
    address: str
    latitude: float
    longitude: float
    flood_risk: HazardScore
    hurricane_risk: HazardScore
    heat_risk: HazardScore
    wildfire_risk: HazardScore
    overall_risk_score: Optional[int] = Field(default=None, ge=0, le=100)
    overall_status: OverallStatus = "complete"
    verdict: Optional[str] = None
    verdict_reason: Optional[str] = None
    sources: Dict[str, SourceStatus] = Field(default_factory=dict)
    ai_summary: Optional[str] = None
    generated_at: str
    historical_trend: List[TrendPoint] = Field(default_factory=list)
