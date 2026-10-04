from pydantic import BaseModel, Field


# Real US addresses are well under this; the cap keeps junk payloads away from Google.
MAX_ADDRESS_LENGTH = 300


class AddressRequest(BaseModel):
    address: str = Field(min_length=1, max_length=MAX_ADDRESS_LENGTH)


class Coordinates(BaseModel):
    latitude: float
    longitude: float
    formatted_address: str
    place_id: str
