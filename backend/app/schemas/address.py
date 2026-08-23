from pydantic import BaseModel, Field


class AddressRequest(BaseModel):
    address: str = Field(min_length=1)


class Coordinates(BaseModel):
    latitude: float
    longitude: float
    formatted_address: str
    place_id: str
