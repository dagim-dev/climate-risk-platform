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
# The "reduced set" keeps 1% and 0.2% zones and levee areas but omits minimal-hazard zone X,
# so a miss there means "outside mapped hazard areas" and can't rule out an unmapped area.
NFHL_FALLBACK_URL = (
    "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/"
    "USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0/query"
)
PROVIDER_FEMA = "FEMA NFHL"
PROVIDER_FALLBACK = "FEMA NFHL via Esri Living Atlas"
FLOOD_OUT_FIELDS = "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE"
FEMA_TIMEOUT = httpx.Timeout(8.0, connect=3.0)
# Cold queries on the mirror have been observed to take 6s+ (e.g. Honolulu).
FALLBACK_TIMEOUT = httpx.Timeout(10.0, connect=3.0)

# NFHL stores "no base flood elevation" as -9999.
BFE_MISSING_SENTINEL = -9000.0
# Zones where FEMA has not determined the flood hazard at all.
UNDETERMINED_ZONES = {"D", "AREA NOT INCLUDED"}


class FloodZoneUndetermined(RuntimeError):
    """FEMA has no flood hazard determination here; not a transient failure to fall back from."""


class FloodZoneData(BaseModel):
    flood_zone: str
    base_flood_elevation: Optional[float]
    special_flood_hazard_area: bool
    provider: str = PROVIDER_FEMA
    # FEMA ZONE_SUBTY, e.g. "0.2 PCT ANNUAL CHANCE FLOOD HAZARD" for shaded zone X.
    zone_subtype: Optional[str] = None
    # False when no mapped polygon matched on the reduced-set mirror (see NFHL_FALLBACK_URL).
    mapped: bool = True


def is_high_risk_zone(zone: str) -> bool:
    """1% annual chance Special Flood Hazard Area zones (A*, V*, AR*, A99)."""
    return zone in {"A", "AE", "A99", "V", "VE"} or zone.startswith("AR")


def is_moderate_x_subtype(subtype: Optional[str]) -> bool:
    """Shaded zone X: 0.2% annual chance, or reduced risk behind a levee."""
    text = (subtype or "").upper()
    return "0.2" in text or "LEVEE" in text


def _zone_rank(attributes: dict) -> int:
    zone = str(attributes.get("FLD_ZONE") or "").strip().upper()
    if zone in {"V", "VE"}:
        return 0
    if is_high_risk_zone(zone):
        return 1
    if zone in {"AH", "AO"}:
        return 2
    if zone == "X" and is_moderate_x_subtype(attributes.get("ZONE_SUBTY")):
        return 3
    if zone == "X":
        return 4
    if zone in UNDETERMINED_ZONES:
        return 5
    return 6


def _select_highest_risk_zone(features: list) -> Optional[dict]:
    if not features:
        return None
    return min(features, key=lambda feature: _zone_rank(feature.get("attributes") or {}))


def _parse_bfe(value: object) -> Optional[float]:
    try:
        bfe = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return bfe if bfe > BFE_MISSING_SENTINEL else None


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
    except FloodZoneUndetermined:
        raise
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
    feature = _select_highest_risk_zone(data.get("features") or [])
    if feature is None:
        if provider == PROVIDER_FEMA:
            # The full NFHL layer includes minimal-hazard zone X, so no polygon at all means
            # there is no digital FEMA flood map here.
            raise FloodZoneUndetermined("No digital FEMA flood map covers this location")
        return FloodZoneData(
            flood_zone="X",
            base_flood_elevation=None,
            special_flood_hazard_area=False,
            provider=provider,
            mapped=False,
        )

    attributes = feature.get("attributes") or {}
    zone = str(attributes.get("FLD_ZONE") or "").strip().upper()
    if not zone or zone in UNDETERMINED_ZONES:
        raise FloodZoneUndetermined(
            "FEMA has not determined the flood hazard at this location (zone D or unstudied area)"
        )

    return FloodZoneData(
        flood_zone=zone,
        base_flood_elevation=_parse_bfe(attributes.get("STATIC_BFE")),
        special_flood_hazard_area=str(attributes.get("SFHA_TF")).upper() == "T",
        provider=provider,
        zone_subtype=attributes.get("ZONE_SUBTY") or None,
    )
