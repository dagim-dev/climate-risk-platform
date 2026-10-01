from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.risk import ClimateRiskReport, Verdict


class PropertyCreate(BaseModel):
    report: ClimateRiskReport


class PropertyResponse(BaseModel):
    id: int
    address: str
    latitude: float
    longitude: float
    report_data: ClimateRiskReport
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PropertyListItem(BaseModel):
    id: int
    address: str
    latitude: float
    longitude: float
    overall_risk_score: Optional[int] = Field(default=None, ge=0, le=100)
    verdict: Optional[Verdict] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
