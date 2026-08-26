from __future__ import annotations

from typing import Optional

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_optional_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.address import AddressRequest
from app.schemas.risk import ClimateRiskReport
from app.services.ai.summary_generator import generate_risk_summary
from app.services.geocoding import geocode_address
from app.services.rate_limit import enforce_anonymous_analysis_limit
from app.services.scoring.aggregator import build_risk_report

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/analyze", response_model=ClimateRiskReport)
async def analyze_risk(
    request_body: AddressRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    await enforce_anonymous_analysis_limit(request, db, current_user)

    try:
        coordinates = await geocode_address(request_body.address)
        report = await build_risk_report(coordinates)

        try:
            report.ai_summary = await generate_risk_summary(report)
        except Exception:
            logger.warning("AI summary generation failed", exc_info=True)
            report.ai_summary = None

        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Risk analysis failed.")
