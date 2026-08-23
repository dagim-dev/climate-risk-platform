from __future__ import annotations

import logging
from typing import Optional

import httpx
from pydantic import BaseModel

from app.services.climate.utils import query_arcgis_point

logger = logging.getLogger(__name__)

NFHL_FLOOD_ZONE_URL = (
    "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
)

ZONE_RISK_ORDER = ("VE", "V", "AE", "A", "AH", "AO", "X")


class FloodZoneData(BaseModel):
    flood_zone: str
    base_flood_elevation: Optional[float]
    special_flood_hazard_area: bool


DEFAULT_LOW_RISK = FloodZoneData(
    flood_zone="X",
    base_flood_elevation=None,
    special_flood_hazard_area=False,
)


def _select_highest_risk_zone(features: list) -> Optional[dict]:
    if not features:
        return None

    def zone_rank(feature: dict) -> int:
        zone = (feature.get("attributes") or {}).get("FLD_ZONE", "X")
        try:
            return ZONE_RISK_ORDER.index(zone)
        except ValueError:
            return len(ZONE_RISK_ORDER)

    return min(features, key=zone_rank)


async def get_flood_zone_data(latitude: float, longitude: float) -> FloodZoneData:
    try:
        async with httpx.AsyncClient() as client:
            data = await query_arcgis_point(
                client,
                NFHL_FLOOD_ZONE_URL,
                latitude,
                longitude,
                out_fields="FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE",
            )
    except (httpx.HTTPError, httpx.TimeoutException) as exc:
        logger.warning("FEMA NFHL query failed for (%s, %s): %s", latitude, longitude, exc)
        return DEFAULT_LOW_RISK

    feature = _select_highest_risk_zone(data.get("features", []))
    if feature is None:
        return DEFAULT_LOW_RISK

    attributes = feature.get("attributes", {})
    sfha = attributes.get("SFHA_TF")
    bfe = attributes.get("STATIC_BFE")

    return FloodZoneData(
        flood_zone=attributes.get("FLD_ZONE") or "X",
        base_flood_elevation=float(bfe) if bfe is not None else None,
        special_flood_hazard_area=str(sfha).upper() == "T",
    )
