from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.risk import ClimateRiskReport


class PropertyCreate(BaseModel):
    report: ClimateRiskReport


class PropertyResponse(BaseModel):
    id: int
    address: str
    latitude: float
    longitude: float
    report_data: ClimateRiskReport
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PropertyListItem(BaseModel):
    id: int
    address: str
    latitude: float
    longitude: float
    overall_risk_score: int = Field(..., ge=0, le=100)
    verdict: str
    pdf_url: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
