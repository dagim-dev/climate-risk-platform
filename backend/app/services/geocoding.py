from __future__ import annotations

import httpx
from app.core.config import settings
from app.schemas.address import Coordinates

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
GEOCODE_TIMEOUT = httpx.Timeout(8.0, connect=3.0)

US_COUNTRY_CODE = "US"
NON_US_ADDRESS_ERROR = "Please enter a valid US address."
# Google statuses that mean the address itself is the problem; anything else
# (REQUEST_DENIED, OVER_QUERY_LIMIT, UNKNOWN_ERROR) is a service/configuration failure.
ADDRESS_ERROR_STATUSES = {"ZERO_RESULTS", "INVALID_REQUEST"}


class GeocodingServiceError(RuntimeError):
    """The geocoding provider failed or rejected our request (not a bad address)."""


def _extract_country_code(result: dict) -> str | None:
    for component in result.get("address_components", []):
        if "country" in component.get("types", []):
            return component.get("short_name")
    return None


async def geocode_address(address: str) -> Coordinates:
    try:
        async with httpx.AsyncClient(timeout=GEOCODE_TIMEOUT) as client:
            response = await client.get(
                GEOCODE_URL,
                params={"address": address, "key": settings.GOOGLE_MAPS_API_KEY}
            )
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise GeocodingServiceError(f"Geocoding request failed: {type(exc).__name__}") from exc

    status = data.get("status")
    if status in ADDRESS_ERROR_STATUSES:
        raise ValueError(f"Geocoding failed: {status}")
    if status != "OK" or not data.get("results"):
        raise GeocodingServiceError(f"Geocoding service error: {status}")

    result = data["results"][0]
    country_code = _extract_country_code(result)
    if country_code != US_COUNTRY_CODE:
        raise ValueError(NON_US_ADDRESS_ERROR)

    try:
        location = result["geometry"]["location"]
        return Coordinates(
            latitude=location["lat"],
            longitude=location["lng"],
            formatted_address=result["formatted_address"],
            place_id=result["place_id"]
        )
    except (KeyError, TypeError) as exc:
        raise GeocodingServiceError("Geocoding response was missing location fields") from exc
