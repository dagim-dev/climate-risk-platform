from __future__ import annotations

import logging
from typing import Optional

import httpx
from pydantic import BaseModel

from app.services.climate.utils import ARCGIS_TIMEOUT, query_arcgis_point
from app.services.climate.source_cache import SOURCE_FEMA, fetch_with_cache
from app.services.climate.source_result import SourceResult

logger = logging.getLogger(__name__)

NFHL_FLOOD_ZONE_URL = (
    "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
)

ZONE_RISK_ORDER = ("VE", "V", "AE", "A", "AH", "AO", "X")


class FloodZoneData(BaseModel):
    flood_zone: str
    base_flood_elevation: Optional[float]
    special_flood_hazard_area: bool


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


async def _fetch_flood_zone_live(latitude: float, longitude: float) -> FloodZoneData:
    async with httpx.AsyncClient(timeout=ARCGIS_TIMEOUT) as client:
        data = await query_arcgis_point(
            client,
            NFHL_FLOOD_ZONE_URL,
            latitude,
            longitude,
            out_fields="FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE",
        )
    return parse_flood_zone_response(data)


async def get_flood_zone_data(latitude: float, longitude: float) -> SourceResult[FloodZoneData]:
    return await fetch_with_cache(
        SOURCE_FEMA,
        latitude,
        longitude,
        lambda: _fetch_flood_zone_live(latitude, longitude),
        FloodZoneData,
    )


def parse_flood_zone_response(data: dict) -> FloodZoneData:
    feature = _select_highest_risk_zone(data.get("features", []))
    if feature is None:
        return FloodZoneData(
            flood_zone="X",
            base_flood_elevation=None,
            special_flood_hazard_area=False,
        )

    attributes = feature.get("attributes", {})
    sfha = attributes.get("SFHA_TF")
    bfe = attributes.get("STATIC_BFE")

    return FloodZoneData(
        flood_zone=attributes.get("FLD_ZONE") or "X",
        base_flood_elevation=float(bfe) if bfe is not None else None,
        special_flood_hazard_area=str(sfha).upper() == "T",
    )
