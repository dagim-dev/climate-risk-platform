from typing import List, Optional

from pydantic import BaseModel, Field


class HazardScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    severity: str
    confidence: str
    primary_factors: List[str]


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
