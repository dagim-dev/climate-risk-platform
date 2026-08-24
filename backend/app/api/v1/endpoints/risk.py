import logging

from fastapi import APIRouter, HTTPException

from app.schemas.address import AddressRequest
from app.schemas.risk import ClimateRiskReport
from app.services.geocoding import geocode_address
from app.services.scoring.aggregator import build_risk_report
from app.services.ai.summary_generator import generate_risk_summary

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/analyze", response_model=ClimateRiskReport)
async def analyze_risk(request: AddressRequest):
    try:
        coordinates = await geocode_address(request.address)
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
