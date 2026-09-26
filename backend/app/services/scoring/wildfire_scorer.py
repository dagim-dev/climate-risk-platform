from __future__ import annotations

from typing import Dict, Tuple

from app.schemas.risk import HazardScore
from app.services.climate.wildfire_data import WHP_BOX_KM, WildfireData
from app.services.scoring.helpers import clamp_score, score_to_severity

WHP_BURNABLE_CLASSES = (1, 2, 3, 4, 5)
WHP_WATER_CLASS = 7
WHP_CLASS_WEIGHTS = {1: 10.0, 2: 25.0, 3: 50.0, 4: 75.0, 5: 100.0}
WHP_CLASS_LABELS = {1: "Very Low", 2: "Low", 3: "Moderate", 4: "High", 5: "Very High"}

# Below this share of burnable land around the property, hazard is scaled down proportionally:
# a dense urban core with a few vegetated pixels is not wildland-urban interface.
FULL_EXPOSURE_BURNABLE_SHARE = 0.3
MAX_HISTORY_BONUS = 10.0
FIRES_PER_HISTORY_POINT = 10.0


def whp_exposure(class_shares: Dict[int, float]) -> Tuple[float, float, float]:
    """Return (burnable share of land, mean hazard weight of burnable land, high+very-high share of land)."""
    land = sum(share for whp_class, share in class_shares.items() if whp_class != WHP_WATER_CLASS)
    if land <= 0:
        return 0.0, 0.0, 0.0

    burnable = sum(class_shares.get(whp_class, 0.0) for whp_class in WHP_BURNABLE_CLASSES)
    if burnable <= 0:
        return 0.0, 0.0, 0.0

    hazard_mean = (
        sum(class_shares.get(whp_class, 0.0) * weight for whp_class, weight in WHP_CLASS_WEIGHTS.items())
        / burnable
    )
    high_share = (class_shares.get(4, 0.0) + class_shares.get(5, 0.0)) / land
    return burnable / land, hazard_mean, high_share


def score_wildfire_risk(
    wildfire_data: WildfireData,
    latitude: float,
    longitude: float,
) -> HazardScore:
    del latitude, longitude  # location is already encoded in the WHP sample

    factors: list[str] = []
    burnable_share, hazard_mean, high_share = whp_exposure(wildfire_data.whp_class_shares)

    score = hazard_mean * min(1.0, burnable_share / FULL_EXPOSURE_BURNABLE_SHARE)

    if high_share > 0:
        factors.append(
            f"{high_share:.0%} of land within {WHP_BOX_KM:.0f} km rated High or Very High "
            "wildfire hazard potential (USFS 2023)"
        )
    elif burnable_share > 0:
        dominant = max(
            WHP_BURNABLE_CLASSES,
            key=lambda whp_class: wildfire_data.whp_class_shares.get(whp_class, 0.0),
        )
        factors.append(
            f"{burnable_share:.0%} of land within {WHP_BOX_KM:.0f} km is burnable, mostly "
            f"{WHP_CLASS_LABELS[dominant]} wildfire hazard potential (USFS 2023)"
        )
    else:
        factors.append(
            f"No burnable wildland within {WHP_BOX_KM:.0f} km (USFS Wildfire Hazard Potential 2023)"
        )

    fire_count = wildfire_data.fire_count_20_years
    if fire_count > 0:
        score += min(MAX_HISTORY_BONUS, fire_count / FIRES_PER_HISTORY_POINT)
        factors.append(f"{fire_count} mapped wildfire perimeters within 50 km in the last 20 years (NIFC)")

    confidence = "High" if wildfire_data.whp_class_shares else "Low"

    final_score = clamp_score(score)
    return HazardScore(
        score=final_score,
        severity=score_to_severity(final_score),
        confidence=confidence,
        primary_factors=factors[:3],
    )
