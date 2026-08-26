from contextlib import ExitStack
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_optional_user
from app.core.database import get_db
from app.schemas.address import Coordinates
from app.schemas.risk import HazardScore
from app.services.climate.flood_data import FloodZoneData
from app.services.climate.heat_data import HeatRiskData
from app.services.climate.hurricane_data import HurricaneData
from app.services.climate.wildfire_data import WildfireData
from app.services.scoring.aggregator import (
    build_risk_report,
    compute_overall_score,
    score_to_verdict,
)
from app.services.scoring.flood_scorer import score_flood_risk
from app.services.scoring.heat_scorer import score_heat_risk
from app.services.scoring.hurricane_scorer import score_hurricane_risk
from app.services.scoring.wildfire_scorer import score_wildfire_risk

client = TestClient(app)

MIAMI_LAT, MIAMI_LON = 25.7617, -80.1918
DENVER_LAT, DENVER_LON = 39.7392, -104.9903
PARADISE_LAT, PARADISE_LON = 39.7596, -121.6219
PHOENIX_LAT, PHOENIX_LON = 33.4484, -112.0740
IOWA_CITY_LAT, IOWA_CITY_LON = 41.6611, -91.5302


def _hazard(score: int) -> HazardScore:
    return HazardScore(
        score=score,
        severity="Moderate",
        confidence="High",
        primary_factors=["test factor"],
    )


def test_miami_beach_flood_and_hurricane_scores():
    flood = score_flood_risk(
        FloodZoneData(flood_zone="AE", base_flood_elevation=12.0, special_flood_hazard_area=True),
        MIAMI_LAT,
        MIAMI_LON,
    )
    hurricane = score_hurricane_risk(
        HurricaneData(
            historical_storm_count=45,
            nearest_track_distance_km=12.0,
            category_distribution={
                "category_1": 10,
                "category_2": 8,
                "category_3": 12,
                "category_4": 8,
                "category_5": 3,
            },
        ),
        MIAMI_LAT,
        MIAMI_LON,
    )

    assert flood.score >= 70
    assert hurricane.score >= 80


def test_denver_flood_and_hurricane_scores():
    flood = score_flood_risk(
        FloodZoneData(flood_zone="X", base_flood_elevation=None, special_flood_hazard_area=False),
        DENVER_LAT,
        DENVER_LON,
    )
    hurricane = score_hurricane_risk(HurricaneData(), DENVER_LAT, DENVER_LON)

    assert flood.score <= 30
    assert hurricane.score <= 15


def test_paradise_wildfire_score():
    wildfire = score_wildfire_risk(
        WildfireData(
            fire_count_20_years=60,
            fire_weather_zone="Western",
            wui_classification="High-WUI",
        ),
        PARADISE_LAT,
        PARADISE_LON,
    )

    assert wildfire.score >= 75


def test_phoenix_heat_score():
    heat = score_heat_risk(
        HeatRiskData(
            extreme_heat_days_per_year=75.0,
            trend_direction="increasing",
            projected_2050_delta_c=3.0,
        ),
        PHOENIX_LAT,
        PHOENIX_LON,
    )

    assert heat.score >= 70


def test_iowa_city_moderate_flood_low_hurricane():
    flood = score_flood_risk(
        FloodZoneData(flood_zone="X", base_flood_elevation=None, special_flood_hazard_area=True),
        IOWA_CITY_LAT,
        IOWA_CITY_LON,
    )
    hurricane = score_hurricane_risk(HurricaneData(), IOWA_CITY_LAT, IOWA_CITY_LON)

    assert 26 <= flood.score <= 50
    assert hurricane.score <= 15


def test_all_hazard_scores_stay_within_range():
    profiles = [
        (
            FloodZoneData(flood_zone="AE", base_flood_elevation=10.0, special_flood_hazard_area=True),
            HurricaneData(historical_storm_count=20, nearest_track_distance_km=20.0),
            HeatRiskData(extreme_heat_days_per_year=40.0, trend_direction="increasing", projected_2050_delta_c=2.5),
            WildfireData(fire_count_20_years=25, fire_weather_zone="Western", wui_classification="Intermix"),
            MIAMI_LAT,
            MIAMI_LON,
        ),
        (
            FloodZoneData(flood_zone="X", base_flood_elevation=None, special_flood_hazard_area=False),
            HurricaneData(),
            HeatRiskData(),
            WildfireData(),
            DENVER_LAT,
            DENVER_LON,
        ),
    ]

    for flood_data, hurricane_data, heat_data, wildfire_data, lat, lon in profiles:
        scores = [
            score_flood_risk(flood_data, lat, lon).score,
            score_hurricane_risk(hurricane_data, lat, lon).score,
            score_heat_risk(heat_data, lat, lon).score,
            score_wildfire_risk(wildfire_data, lat, lon).score,
        ]
        assert all(0 <= score <= 100 for score in scores)


@pytest.mark.parametrize(
    "overall_score, expected_verdict",
    [
        (20, "Go"),
        (35, "Go"),
        (36, "Caution"),
        (50, "Caution"),
        (65, "Caution"),
        (66, "Avoid"),
        (90, "Avoid"),
    ],
)
def test_verdict_thresholds(overall_score, expected_verdict):
    assert score_to_verdict(overall_score) == expected_verdict


def test_compute_overall_score_weighted_average():
    overall = compute_overall_score(_hazard(80), _hazard(60), _hazard(40), _hazard(20))
    assert overall == 54


@pytest.mark.asyncio
async def test_build_risk_report_integration():
    coordinates = Coordinates(
        latitude=MIAMI_LAT,
        longitude=MIAMI_LON,
        formatted_address="Miami Beach, FL",
        place_id="test-place-id",
    )

    with ExitStack() as stack:
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_flood_zone_data",
                new=AsyncMock(
                    return_value=FloodZoneData(
                        flood_zone="AE",
                        base_flood_elevation=12.0,
                        special_flood_hazard_area=True,
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_hurricane_data",
                new=AsyncMock(
                    return_value=HurricaneData(
                        historical_storm_count=45,
                        nearest_track_distance_km=12.0,
                        category_distribution={
                            "category_1": 10,
                            "category_2": 8,
                            "category_3": 12,
                            "category_4": 8,
                            "category_5": 3,
                        },
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_heat_risk_data",
                new=AsyncMock(
                    return_value=HeatRiskData(
                        extreme_heat_days_per_year=55.0,
                        trend_direction="increasing",
                        projected_2050_delta_c=2.5,
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_wildfire_data",
                new=AsyncMock(
                    return_value=WildfireData(
                        fire_count_20_years=5,
                        fire_weather_zone="Southern Plains",
                        wui_classification="Interface",
                    )
                ),
            )
        )
        report = await build_risk_report(coordinates)

    assert report.address == "Miami Beach, FL"
    assert 0 <= report.overall_risk_score <= 100
    assert report.verdict in {"Go", "Caution", "Avoid"}
    assert report.generated_at


def test_analyze_endpoint_returns_report():
    coordinates = Coordinates(
        latitude=DENVER_LAT,
        longitude=DENVER_LON,
        formatted_address="Denver, CO",
        place_id="denver-place-id",
    )

    async def mock_get_db():
        yield AsyncMock()

    async def mock_optional_user():
        return None

    app.dependency_overrides[get_db] = mock_get_db
    app.dependency_overrides[get_optional_user] = mock_optional_user

    with ExitStack() as stack:
        stack.enter_context(
            patch(
                "app.api.v1.endpoints.risk.enforce_anonymous_analysis_limit",
                new=AsyncMock(return_value=None),
            )
        )
        stack.enter_context(
            patch(
                "app.api.v1.endpoints.risk.geocode_address",
                new=AsyncMock(return_value=coordinates),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_flood_zone_data",
                new=AsyncMock(
                    return_value=FloodZoneData(
                        flood_zone="X",
                        base_flood_elevation=None,
                        special_flood_hazard_area=False,
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_hurricane_data",
                new=AsyncMock(return_value=HurricaneData()),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_heat_risk_data",
                new=AsyncMock(return_value=HeatRiskData()),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_wildfire_data",
                new=AsyncMock(return_value=WildfireData()),
            )
        )
        response = client.post("/api/v1/analyze", json={"address": "Denver, CO"})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["address"] == "Denver, CO"
    assert "overall_risk_score" in payload
    assert payload["verdict"] in {"Go", "Caution", "Avoid"}
