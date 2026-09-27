from contextlib import ExitStack
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.address import Coordinates
from app.schemas.risk import HazardScore
from app.services.climate.flood_data import FloodZoneData, get_flood_zone_data
from app.services.climate.heat_data import HeatRiskData, get_heat_risk_data
from app.services.climate.hurricane_data import HurricaneData, get_hurricane_data
from app.services.climate.source_result import SourceResult
from app.services.climate.wildfire_data import WildfireData, get_wildfire_data
from app.services.scoring.aggregator import build_risk_report
from app.services.scoring.flood_scorer import score_flood_risk
from app.services.scoring.hazard_utils import (
    compute_overall_score,
    compute_verdict,
    score_hazard_from_source,
    score_to_verdict,
    unavailable_hazard,
)
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


def _ok_result(data):
    return SourceResult(status="ok", data=data, as_of=datetime.now(timezone.utc).isoformat())


def _unavailable_result(error: str = "upstream failed"):
    return SourceResult(status="unavailable", data=None, as_of=None, error=error)


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
            tropical_systems_100km=24,
            hurricane_passes_100km=6,
            major_hurricane_passes_100km=2,
        ),
        MIAMI_LAT,
        MIAMI_LON,
    )

    assert flood.score >= 70
    # Live IBTrACS counts for Miami Beach (2026): scored from track history alone.
    assert hurricane.score == 62
    assert hurricane.severity == "High"
    assert "6 hurricane-strength storms passed within 100 km" in hurricane.primary_factors[0]


def test_inland_city_with_only_remnant_storms_scores_low_hurricane():
    # Washington, DC: 13 weakened tropical systems nearby since 1976, none at hurricane strength.
    hurricane = score_hurricane_risk(
        HurricaneData(historical_storm_count=113, tropical_systems_100km=13),
        38.8977,
        -77.0365,
    )

    assert hurricane.score <= 15


def test_desert_city_is_not_scored_for_its_latitude():
    hurricane = score_hurricane_risk(HurricaneData(), PHOENIX_LAT, PHOENIX_LON)

    assert hurricane.score == 0


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
    # USFS WHP class shares sampled around Paradise, CA (2 km box).
    wildfire = score_wildfire_risk(
        WildfireData(
            fire_count_20_years=70,
            whp_class_shares={2: 0.08, 3: 0.11, 4: 0.36, 6: 0.45},
        ),
        PARADISE_LAT,
        PARADISE_LON,
    )

    assert wildfire.score >= 60
    assert "High or Very High" in wildfire.primary_factors[0]


def test_dense_urban_coast_wildfire_stays_low_despite_regional_fire_history():
    # Miami Beach: mostly non-burnable (6) and water (7), many Everglades fires within 50 km.
    wildfire = score_wildfire_risk(
        WildfireData(
            fire_count_20_years=134,
            whp_class_shares={1: 0.02, 2: 0.01, 6: 0.51, 7: 0.46},
        ),
        MIAMI_LAT,
        MIAMI_LON,
    )

    assert wildfire.score < 20


def test_no_burnable_land_scores_near_zero():
    wildfire = score_wildfire_risk(
        WildfireData(fire_count_20_years=0, whp_class_shares={6: 1.0}),
        MIAMI_LAT,
        MIAMI_LON,
    )

    assert wildfire.score == 0
    assert "No burnable wildland" in wildfire.primary_factors[0]


def test_phoenix_heat_score():
    heat = score_heat_risk(
        HeatRiskData(
            extreme_heat_days_per_year=75.0,
            trend_direction="increasing",
            hot_days_trend_per_decade=12.0,
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
            HeatRiskData(extreme_heat_days_per_year=40.0, trend_direction="increasing", hot_days_trend_per_decade=8.0),
            WildfireData(fire_count_20_years=25, whp_class_shares={3: 0.3, 4: 0.4, 5: 0.2, 6: 0.1}),
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


def test_single_high_hazard_raises_go_to_caution():
    # Paradise, CA: wildfire 70 but no flood or hurricane exposure averages to "Go".
    hazards = (_hazard(12), _hazard(0), _hazard(56), _hazard(70))
    verdict, reason = compute_verdict(29, "complete", hazards)

    assert verdict == "Caution"
    assert reason is not None and "Wildfire (70/100)" in reason


def test_multiple_high_hazards_are_all_named():
    _, reason = compute_verdict(34, "complete", (_hazard(80), _hazard(0), _hazard(0), _hazard(72)))

    assert reason == (
        "Raised to Caution: Flood (80/100) and Wildfire (72/100) are high "
        "even though the combined score is low."
    )


def test_go_stays_go_when_no_hazard_is_high():
    verdict, reason = compute_verdict(15, "complete", (_hazard(12), _hazard(6), _hazard(44), _hazard(3)))

    assert verdict == "Go"
    assert reason is None


def test_high_average_verdict_is_not_changed_by_floor():
    verdict, reason = compute_verdict(75, "complete", (_hazard(90), _hazard(100), _hazard(87), _hazard(1)))

    assert verdict == "Avoid"
    assert reason is None


def test_no_verdict_when_partial_even_with_high_hazard():
    assert compute_verdict(40, "partial", (_hazard(90), _hazard(0), _hazard(0), _hazard(0))) == (None, None)


def test_score_to_verdict_none_when_overall_unavailable():
    assert score_to_verdict(None) is None


def test_compute_overall_score_weighted_average():
    overall, status = compute_overall_score(_hazard(80), _hazard(60), _hazard(40), _hazard(20))
    assert overall == 54
    assert status == "complete"


def test_compute_overall_score_partial_when_one_hazard_unavailable():
    missing = unavailable_hazard("FEMA unavailable")
    overall, status = compute_overall_score(_hazard(80), _hazard(60), _hazard(40), missing)
    assert overall == 62
    assert status == "partial"


def test_compute_overall_score_unavailable_when_all_missing():
    missing = unavailable_hazard("failed")
    overall, status = compute_overall_score(missing, missing, missing, missing)
    assert overall is None
    assert status == "unavailable"


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
                    return_value=_ok_result(
                        FloodZoneData(
                            flood_zone="AE",
                            base_flood_elevation=12.0,
                            special_flood_hazard_area=True,
                        )
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_hurricane_data",
                new=AsyncMock(
                    return_value=_ok_result(
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
                        )
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_heat_risk_data",
                new=AsyncMock(
                    return_value=_ok_result(
                        HeatRiskData(
                            extreme_heat_days_per_year=55.0,
                            trend_direction="increasing",
                            hot_days_trend_per_decade=8.0,
                        )
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_wildfire_data",
                new=AsyncMock(
                    return_value=_ok_result(
                        WildfireData(
                            fire_count_20_years=5,
                            whp_class_shares={1: 0.2, 2: 0.1, 6: 0.7},
                        )
                    )
                ),
            )
        )
        report = await build_risk_report(coordinates)

    assert report.address == "Miami Beach, FL"
    assert report.overall_risk_score is not None
    assert 0 <= report.overall_risk_score <= 100
    assert report.verdict in {"Go", "Caution", "Avoid"}
    assert report.overall_status == "complete"
    assert report.generated_at


@pytest.mark.asyncio
async def test_build_risk_report_marks_partial_when_flood_unavailable():
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
                new=AsyncMock(return_value=_unavailable_result("FEMA timeout")),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_hurricane_data",
                new=AsyncMock(return_value=_ok_result(HurricaneData())),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_heat_risk_data",
                new=AsyncMock(return_value=_ok_result(HeatRiskData())),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_wildfire_data",
                new=AsyncMock(return_value=_ok_result(WildfireData())),
            )
        )
        report = await build_risk_report(coordinates)

    assert report.flood_risk.status == "unavailable"
    assert report.flood_risk.score is None
    assert report.overall_status == "partial"
    assert report.overall_risk_score is not None
    assert report.verdict is None


def test_analyze_endpoint_returns_report():
    coordinates = Coordinates(
        latitude=DENVER_LAT,
        longitude=DENVER_LON,
        formatted_address="Denver, CO",
        place_id="denver-place-id",
    )

    with ExitStack() as stack:
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
                    return_value=_ok_result(
                        FloodZoneData(
                            flood_zone="X",
                            base_flood_elevation=None,
                            special_flood_hazard_area=False,
                        )
                    )
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_hurricane_data",
                new=AsyncMock(return_value=_ok_result(HurricaneData())),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_heat_risk_data",
                new=AsyncMock(return_value=_ok_result(HeatRiskData())),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_wildfire_data",
                new=AsyncMock(return_value=_ok_result(WildfireData())),
            )
        )
        response = client.post("/api/v1/analyze", json={"address": "Denver, CO"})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["address"] == "Denver, CO"
    assert "overall_risk_score" in payload
    assert payload["verdict"] in {"Go", "Caution", "Avoid"}


def test_analyze_endpoint_rejects_non_us_address():
    build_risk_report_mock = AsyncMock()

    with ExitStack() as stack:
        stack.enter_context(
            patch(
                "app.api.v1.endpoints.risk.geocode_address",
                new=AsyncMock(
                    side_effect=ValueError("Please enter a valid US address."),
                ),
            )
        )
        stack.enter_context(
            patch(
                "app.api.v1.endpoints.risk.build_risk_report",
                new=build_risk_report_mock,
            )
        )
        response = client.post("/api/v1/analyze", json={"address": "Toronto, ON, Canada"})

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json()["detail"] == "Please enter a valid US address."
    build_risk_report_mock.assert_not_called()


@pytest.mark.asyncio
async def test_fema_failure_without_cache_is_unavailable_not_low_risk():
    with patch(
        "app.services.climate.flood_data._fetch_flood_zone_live",
        new=AsyncMock(side_effect=httpx.TimeoutException("timeout")),
    ):
        with patch(
            "app.services.climate.source_cache.get_cached_payload",
            new=AsyncMock(return_value=None),
        ):
            result = await get_flood_zone_data(MIAMI_LAT, MIAMI_LON)

    assert result.status == "unavailable"
    assert result.data is None


@pytest.mark.asyncio
async def test_fema_failure_serves_stale_cache():
    flood = FloodZoneData(
        flood_zone="AE",
        base_flood_elevation=10.0,
        special_flood_hazard_area=True,
    )
    fetched_at = datetime.now(timezone.utc)

    with patch(
        "app.services.climate.flood_data._fetch_flood_zone_live",
        new=AsyncMock(side_effect=httpx.HTTPError("503")),
    ):
        with patch(
            "app.services.climate.source_cache.get_cached_payload",
            new=AsyncMock(return_value=(flood.model_dump(mode="json"), fetched_at)),
        ):
            result = await get_flood_zone_data(MIAMI_LAT, MIAMI_LON)

    assert result.status == "stale"
    assert result.data is not None
    assert result.data.flood_zone == "AE"


@pytest.mark.asyncio
async def test_noaa_heat_missing_api_key_is_unavailable_not_placeholder(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.NOAA_API_KEY", "")

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(return_value=None),
    ):
        result = await get_heat_risk_data(PHOENIX_LAT, PHOENIX_LON)

    assert result.status == "unavailable"
    assert result.data is None
    assert result.error is not None
    assert "NOAA_API_KEY" in result.error


@pytest.mark.asyncio
async def test_noaa_heat_missing_api_key_serves_stale_cache(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.NOAA_API_KEY", "")
    heat = HeatRiskData(
        extreme_heat_days_per_year=55.0,
        trend_direction="increasing",
        hot_days_trend_per_decade=8.0,
    )
    fetched_at = datetime.now(timezone.utc)

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(return_value=(heat.model_dump(mode="json"), fetched_at)),
    ):
        result = await get_heat_risk_data(PHOENIX_LAT, PHOENIX_LON)

    assert result.status == "stale"
    assert result.data is not None
    assert result.data.extreme_heat_days_per_year == 55.0
    assert result.error is not None


@pytest.mark.asyncio
async def test_noaa_heat_live_failure_serves_stale_cache(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.NOAA_API_KEY", "test-noaa-token")
    heat = HeatRiskData(
        extreme_heat_days_per_year=40.0,
        trend_direction="stable",
        hot_days_trend_per_decade=1.0,
    )
    fetched_at = datetime.now(timezone.utc)

    with patch(
        "app.services.climate.heat_data._fetch_heat_risk_live",
        new=AsyncMock(side_effect=httpx.HTTPError("503")),
    ):
        with patch(
            "app.services.climate.source_cache.get_cached_payload",
            new=AsyncMock(return_value=(heat.model_dump(mode="json"), fetched_at)),
        ):
            result = await get_heat_risk_data(PHOENIX_LAT, PHOENIX_LON)

    assert result.status == "stale"
    assert result.data is not None
    assert result.data.extreme_heat_days_per_year == 40.0


@pytest.mark.asyncio
async def test_noaa_heat_missing_api_key_does_not_score_as_low_risk(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.NOAA_API_KEY", "")

    with patch(
        "app.services.climate.source_cache.get_cached_payload",
        new=AsyncMock(return_value=None),
    ):
        result = await get_heat_risk_data(PHOENIX_LAT, PHOENIX_LON)

    placeholder_score = score_heat_risk(HeatRiskData(), PHOENIX_LAT, PHOENIX_LON).score
    scored = score_hazard_from_source(result, score_heat_risk, PHOENIX_LAT, PHOENIX_LON)

    assert scored.status == "unavailable"
    assert scored.score is None
    assert placeholder_score is not None
    assert placeholder_score < 20


@pytest.mark.asyncio
async def test_fema_failure_does_not_score_as_zone_x_low_risk():
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
                new=AsyncMock(return_value=_unavailable_result("FEMA 500")),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_hurricane_data",
                new=AsyncMock(return_value=_ok_result(HurricaneData())),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_heat_risk_data",
                new=AsyncMock(return_value=_ok_result(HeatRiskData())),
            )
        )
        stack.enter_context(
            patch(
                "app.services.scoring.aggregator.get_wildfire_data",
                new=AsyncMock(return_value=_ok_result(WildfireData())),
            )
        )
        report = await build_risk_report(coordinates)

    assert report.flood_risk.status == "unavailable"
    assert report.flood_risk.score is None
    factors = " ".join(report.flood_risk.primary_factors).lower()
    assert "zone x" not in factors
