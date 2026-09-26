from __future__ import annotations

import logging
from typing import Optional

import httpx
from pydantic import BaseModel

from app.services.climate.utils import query_arcgis_point
from app.services.climate.source_cache import SOURCE_FEMA, fetch_with_cache
from app.services.climate.source_result import SourceResult

logger = logging.getLogger(__name__)

NFHL_FLOOD_ZONE_URL = (
    "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
)
# Esri Living Atlas mirror of the NFHL flood hazard polygons (same FLD_ZONE/SFHA_TF/STATIC_BFE
# fields). Used when hazards.fema.gov is unreachable, which it is from many non-US networks.
# The "reduced set" omits minimal-hazard zone X polygons, so no match reads as zone X.
NFHL_FALLBACK_URL = (
    "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/"
    "USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0/query"
)
PROVIDER_FEMA = "FEMA NFHL"
PROVIDER_FALLBACK = "FEMA NFHL via Esri Living Atlas"
FLOOD_OUT_FIELDS = "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE"
FEMA_TIMEOUT = httpx.Timeout(8.0, connect=3.0)
FALLBACK_TIMEOUT = httpx.Timeout(6.0, connect=3.0)

ZONE_RISK_ORDER = ("VE", "V", "AE", "A", "AH", "AO", "X")


class FloodZoneData(BaseModel):
    flood_zone: str
    base_flood_elevation: Optional[float]
    special_flood_hazard_area: bool
    provider: str = PROVIDER_FEMA


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


async def _query_flood_zones(url: str, latitude: float, longitude: float, timeout: httpx.Timeout) -> dict:
    async with httpx.AsyncClient(timeout=timeout) as client:
        return await query_arcgis_point(
            client,
            url,
            latitude,
            longitude,
            out_fields=FLOOD_OUT_FIELDS,
            timeout=timeout,
        )


async def _fetch_flood_zone_live(latitude: float, longitude: float) -> FloodZoneData:
    try:
        data = await _query_flood_zones(NFHL_FLOOD_ZONE_URL, latitude, longitude, FEMA_TIMEOUT)
        return parse_flood_zone_response(data, provider=PROVIDER_FEMA)
    except Exception as exc:
        logger.warning(
            "FEMA NFHL query failed (%s); trying Living Atlas mirror",
            str(exc) or type(exc).__name__,
        )

    data = await _query_flood_zones(NFHL_FALLBACK_URL, latitude, longitude, FALLBACK_TIMEOUT)
    return parse_flood_zone_response(data, provider=PROVIDER_FALLBACK)


async def get_flood_zone_data(latitude: float, longitude: float) -> SourceResult[FloodZoneData]:
    return await fetch_with_cache(
        SOURCE_FEMA,
        latitude,
        longitude,
        lambda: _fetch_flood_zone_live(latitude, longitude),
        FloodZoneData,
    )


def parse_flood_zone_response(data: dict, provider: str = PROVIDER_FEMA) -> FloodZoneData:
    feature = _select_highest_risk_zone(data.get("features", []))
    if feature is None:
        return FloodZoneData(
            flood_zone="X",
            base_flood_elevation=None,
            special_flood_hazard_area=False,
            provider=provider,
        )

    attributes = feature.get("attributes", {})
    sfha = attributes.get("SFHA_TF")
    bfe = attributes.get("STATIC_BFE")

    return FloodZoneData(
        flood_zone=attributes.get("FLD_ZONE") or "X",
        base_flood_elevation=float(bfe) if bfe is not None else None,
        special_flood_hazard_area=str(sfha).upper() == "T",
        provider=provider,
    )
