from __future__ import annotations

from typing import Callable, Optional, Tuple

from app.schemas.risk import HazardScore, OverallStatus, SourceStatus
from app.services.climate.source_result import SourceResult
from app.services.scoring.helpers import clamp_score


def unavailable_hazard(reason: str) -> HazardScore:
    return HazardScore(
        status="unavailable",
        score=None,
        severity=None,
        confidence="None",
        primary_factors=[],
        unavailable_reason=reason or "Data source unavailable",
    )


def score_hazard_from_source(
    result: SourceResult,
    scorer: Callable[..., HazardScore],
    latitude: float,
    longitude: float,
) -> HazardScore:
    if result.status == "unavailable" or result.data is None:
        return unavailable_hazard(result.error or "Data source unavailable")

    hazard = scorer(result.data, latitude, longitude)
    hazard.status = result.status
    hazard.as_of = result.as_of
    return hazard


def source_status_from_result(result: SourceResult) -> SourceStatus:
    return SourceStatus(
        status=result.status,
        as_of=result.as_of,
        error=result.error if result.status != "ok" else None,
    )


def compute_overall_score(
    flood_risk: HazardScore,
    hurricane_risk: HazardScore,
    heat_risk: HazardScore,
    wildfire_risk: HazardScore,
) -> Tuple[Optional[int], OverallStatus]:
    weighted_hazards = [
        (flood_risk, 0.30),
        (hurricane_risk, 0.30),
        (heat_risk, 0.20),
        (wildfire_risk, 0.20),
    ]
    available = [
        (hazard, weight)
        for hazard, weight in weighted_hazards
        if hazard.status in {"ok", "stale"} and hazard.score is not None
    ]

    if not available:
        return None, "unavailable"

    total_weight = sum(weight for _, weight in available)
    weighted = sum(hazard.score * weight for hazard, weight in available) / total_weight
    overall_status: OverallStatus = "complete" if len(available) == 4 else "partial"
    return clamp_score(weighted), overall_status


def score_to_verdict(overall_score: Optional[int]) -> Optional[str]:
    if overall_score is None:
        return None
    if overall_score <= 35:
        return "Go"
    if overall_score <= 65:
        return "Caution"
    return "Avoid"
