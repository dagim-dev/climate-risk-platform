from app.schemas.risk import HazardScore, TrendPoint
from app.services.climate.heat_data import HeatRiskData
from app.services.climate.hurricane_data import HurricaneData
from app.services.climate.wildfire_data import WildfireData
from app.services.scoring.trend_builder import (
    HISTORICAL_CHECKPOINTS,
    PROJECTION_CHECKPOINTS,
    build_historical_trend,
)


def _hazard(score: int) -> HazardScore:
    return HazardScore(
        score=score,
        severity="Moderate",
        confidence="High",
        primary_factors=["test"],
    )


def test_build_historical_trend_includes_checkpoints():
    trend = build_historical_trend(
        _hazard(60),
        _hazard(70),
        _hazard(50),
        _hazard(40),
        HeatRiskData(trend_direction="increasing", projected_2050_delta_c=3.0),
        HurricaneData(historical_storm_count=20),
        WildfireData(wui_classification="High-WUI"),
        latitude=25.7617,
        longitude=-80.1918,
    )

    years = [point.year for point in trend]
    for year in (*HISTORICAL_CHECKPOINTS, *PROJECTION_CHECKPOINTS):
        assert year in years

    current_points = [point for point in trend if not point.is_projection]
    projection_points = [point for point in trend if point.is_projection]
    assert len(current_points) == 4
    assert len(projection_points) == 3


def test_build_historical_trend_scores_increase_over_time_for_coastal_heat():
    trend = build_historical_trend(
        _hazard(50),
        _hazard(60),
        _hazard(55),
        _hazard(45),
        HeatRiskData(trend_direction="increasing"),
        HurricaneData(historical_storm_count=10),
        WildfireData(wui_classification="Interface"),
        latitude=25.7617,
        longitude=-80.1918,
    )

    by_year = {point.year: point for point in trend}
    assert by_year[2000].heat_score <= by_year[2010].heat_score <= by_year[2020].heat_score
    assert by_year[2030].heat_score >= by_year[2020].heat_score
    assert by_year[2050].heat_score >= by_year[2040].heat_score
