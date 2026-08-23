from fastapi import APIRouter, HTTPException

from app.schemas.address import AddressRequest
from app.schemas.risk import ClimateRiskReport
from app.services.geocoding import geocode_address
from app.services.scoring.aggregator import build_risk_report

router = APIRouter()


@router.post("/analyze", response_model=ClimateRiskReport)
async def analyze_risk(request: AddressRequest):
    try:
        coordinates = await geocode_address(request.address)
        report = await build_risk_report(coordinates)
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Risk analysis failed.")
