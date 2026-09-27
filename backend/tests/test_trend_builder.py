from datetime import datetime, timezone

from app.schemas.risk import HazardScore
from app.services.climate.heat_data import HeatRiskData
from app.services.climate.hurricane_data import HurricaneData
from app.services.climate.wildfire_data import WildfireData
from app.services.scoring.hazard_utils import unavailable_hazard
from app.services.scoring.trend_builder import PROJECTION_CHECKPOINTS, build_historical_trend


def _hazard(score: int) -> HazardScore:
    return HazardScore(
        score=score,
        severity="Moderate",
        confidence="High",
        primary_factors=["test"],
    )


def test_trend_is_today_plus_projections_with_no_backfilled_history():
    trend = build_historical_trend(
        _hazard(60),
        _hazard(70),
        _hazard(50),
        _hazard(40),
        HeatRiskData(trend_direction="increasing", hot_days_trend_per_decade=12.0),
        HurricaneData(historical_storm_count=20, hurricane_passes_100km=3),
        WildfireData(whp_class_shares={4: 0.5, 5: 0.2, 6: 0.3}),
    )

    current_year = datetime.now(timezone.utc).year
    observed = [point for point in trend if not point.is_projection]
    assert [point.year for point in observed] == [current_year]
    assert (observed[0].flood_score, observed[0].hurricane_score) == (60, 70)
    assert [point.year for point in trend if point.is_projection] == [
        year for year in PROJECTION_CHECKPOINTS if year > current_year
    ]


def test_projections_rise_for_increasing_heat():
    trend = build_historical_trend(
        _hazard(50),
        _hazard(60),
        _hazard(55),
        _hazard(45),
        HeatRiskData(trend_direction="increasing"),
        HurricaneData(historical_storm_count=10),
        WildfireData(whp_class_shares={2: 0.4, 6: 0.6}),
    )

    heat = [point.heat_score for point in trend]
    assert heat == sorted(heat)
    assert heat[-1] > heat[0]


def test_unavailable_hazard_is_not_plotted_as_zero():
    trend = build_historical_trend(
        unavailable_hazard("FEMA down"),
        _hazard(60),
        _hazard(55),
        _hazard(45),
        HeatRiskData(),
        HurricaneData(),
        WildfireData(),
    )

    assert all(point.flood_score is None for point in trend)
    assert all(point.hurricane_score is not None for point in trend)
