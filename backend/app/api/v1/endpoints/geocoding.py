from fastapi import APIRouter, HTTPException
from app.schemas.address import AddressRequest, Coordinates
from app.services.geocoding import geocode_address

router = APIRouter()


@router.post("/geocode", response_model=Coordinates)
async def geocode(request: AddressRequest):
    try:
        return await geocode_address(request.address)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
