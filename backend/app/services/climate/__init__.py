from pydantic import BaseModel

from app.services.climate.flood_data import FloodZoneData, get_flood_zone_data
from app.services.climate.heat_data import HeatRiskData, get_heat_risk_data
from app.services.climate.hurricane_data import HurricaneData, get_hurricane_data
from app.services.climate.wildfire_data import WildfireData, get_wildfire_data

__all__ = [
    "FloodZoneData",
    "HeatRiskData",
    "HurricaneData",
    "WildfireData",
    "get_flood_zone_data",
    "get_heat_risk_data",
    "get_hurricane_data",
    "get_wildfire_data",
]
