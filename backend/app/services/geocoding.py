import httpx
from app.core.config import settings
from app.schemas.address import Coordinates

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


async def geocode_address(address: str) -> Coordinates:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GEOCODE_URL,
            params={"address": address, "key": settings.GOOGLE_MAPS_API_KEY}
        )
        data = response.json()

    if data["status"] != "OK":
        raise ValueError(f"Geocoding failed: {data['status']}")

    result = data["results"][0]
    location = result["geometry"]["location"]

    return Coordinates(
        latitude=location["lat"],
        longitude=location["lng"],
        formatted_address=result["formatted_address"],
        place_id=result["place_id"]
    )
