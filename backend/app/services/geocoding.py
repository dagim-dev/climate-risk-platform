from __future__ import annotations

import httpx
from app.core.config import settings
from app.schemas.address import Coordinates

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

US_COUNTRY_CODE = "US"
NON_US_ADDRESS_ERROR = "Please enter a valid US address."


def _extract_country_code(result: dict) -> str | None:
    for component in result.get("address_components", []):
        if "country" in component.get("types", []):
            return component.get("short_name")
    return None


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
    country_code = _extract_country_code(result)
    if country_code != US_COUNTRY_CODE:
        raise ValueError(NON_US_ADDRESS_ERROR)

    location = result["geometry"]["location"]

    return Coordinates(
        latitude=location["lat"],
        longitude=location["lng"],
        formatted_address=result["formatted_address"],
        place_id=result["place_id"]
    )
