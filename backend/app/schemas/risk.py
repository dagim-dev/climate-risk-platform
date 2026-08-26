from typing import List, Optional

from pydantic import BaseModel, Field


class HazardScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    severity: str
    confidence: str
    primary_factors: List[str]


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
    overall_risk_score: int = Field(..., ge=0, le=100)
    verdict: str
    ai_summary: Optional[str] = None
    generated_at: str
    historical_trend: List[TrendPoint] = Field(default_factory=list)
