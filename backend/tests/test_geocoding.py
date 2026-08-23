from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

from app.schemas.address import AddressRequest, Coordinates
from app.services.geocoding import geocode_address

VALID_GEOCODE_RESPONSE = {
    "status": "OK",
    "results": [
        {
            "formatted_address": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
            "place_id": "ChIJ2eUgeAK6j4ARbn5u_wAGqWA",
            "geometry": {"location": {"lat": 37.4224764, "lng": -122.0842499}},
        }
    ],
}

INVALID_GEOCODE_RESPONSE = {"status": "ZERO_RESULTS", "results": []}


def _mock_httpx_client(response_data: dict) -> AsyncMock:
    mock_response = MagicMock()
    mock_response.json.return_value = response_data

    mock_http_client = AsyncMock()
    mock_http_client.get = AsyncMock(return_value=mock_response)
    mock_http_client.__aenter__ = AsyncMock(return_value=mock_http_client)
    mock_http_client.__aexit__ = AsyncMock(return_value=None)
    return mock_http_client


@pytest.mark.asyncio
async def test_valid_us_address_returns_coordinates():
    mock_http_client = _mock_httpx_client(VALID_GEOCODE_RESPONSE)

    with patch(
        "app.services.geocoding.httpx.AsyncClient",
        return_value=mock_http_client,
    ):
        result = await geocode_address("1600 Amphitheatre Parkway, Mountain View, CA")

    assert isinstance(result, Coordinates)
    assert result.latitude is not None
    assert result.longitude is not None
    assert result.latitude == 37.4224764
    assert result.longitude == -122.0842499
    assert result.formatted_address
    assert result.place_id


@pytest.mark.asyncio
async def test_invalid_address_raises_value_error():
    mock_http_client = _mock_httpx_client(INVALID_GEOCODE_RESPONSE)

    with patch(
        "app.services.geocoding.httpx.AsyncClient",
        return_value=mock_http_client,
    ):
        with pytest.raises(ValueError, match="Geocoding failed: ZERO_RESULTS"):
            await geocode_address("xyzzy_nonexistent_place_12345")


def test_empty_address_raises_validation_error():
    with pytest.raises(ValidationError):
        AddressRequest(address="")
