import pytest

from app.services.climate.flood_data import (
    PROVIDER_FALLBACK,
    FloodZoneUndetermined,
    parse_flood_zone_response,
)
from app.services.scoring.flood_scorer import score_flood_risk
from app.services.climate.heat_data import (
    hot_days_trend_per_decade,
    parse_annual_hot_days,
    select_station,
    trend_direction_from_slope,
)
from app.services.climate.utils import raise_for_arcgis_error
from app.services.climate.wildfire_data import parse_whp_histogram
from app.services.climate.hurricane_data import count_close_passes, parse_hurricane_response


def test_parse_fema_nfhl_selects_highest_risk_zone():
    payload = {
        "features": [
            {"attributes": {"FLD_ZONE": "X", "SFHA_TF": "F", "STATIC_BFE": None}},
            {"attributes": {"FLD_ZONE": "AE", "SFHA_TF": "T", "STATIC_BFE": 8.0}},
        ]
    }

    parsed = parse_flood_zone_response(payload)

    assert parsed.flood_zone == "AE"
    assert parsed.special_flood_hazard_area is True
    assert parsed.base_flood_elevation == 8.0


def test_parse_fema_nfhl_without_map_coverage_is_undetermined():
    # The full NFHL includes minimal-hazard zone X, so no polygon means no flood map here.
    with pytest.raises(FloodZoneUndetermined):
        parse_flood_zone_response({"features": []})


def test_parse_fallback_miss_is_unconfirmed_not_zone_x():
    parsed = parse_flood_zone_response({"features": []}, provider=PROVIDER_FALLBACK)
    assert parsed.mapped is False
    hazard = score_flood_risk(parsed, 39.7392, -104.9903)
    assert hazard.confidence == "Low"
    assert "Outside FEMA-mapped" in hazard.primary_factors[0]


def test_parse_fema_zone_d_is_undetermined():
    with pytest.raises(FloodZoneUndetermined):
        parse_flood_zone_response({"features": [{"attributes": {"FLD_ZONE": "D", "SFHA_TF": "F"}}]})


def test_bfe_sentinel_is_treated_as_missing():
    parsed = parse_flood_zone_response(
        {"features": [{"attributes": {"FLD_ZONE": "AE", "SFHA_TF": "T", "STATIC_BFE": -9999}}]}
    )
    assert parsed.base_flood_elevation is None
    hazard = score_flood_risk(parsed, 39.7392, -104.9903)
    assert not any("BFE" in factor for factor in hazard.primary_factors)


@pytest.mark.parametrize(
    "subtype",
    ["0.2 PCT ANNUAL CHANCE FLOOD HAZARD", "0.2 Percent Annual Chance Flood Hazard"],
)
def test_shaded_zone_x_scores_moderate(subtype):
    # Real response for downtown New Orleans (SFHA_TF is "F" for shaded X).
    parsed = parse_flood_zone_response(
        {"features": [{"attributes": {"FLD_ZONE": "X", "ZONE_SUBTY": subtype, "SFHA_TF": "F", "STATIC_BFE": None}}]}
    )
    hazard = score_flood_risk(parsed, 39.7392, -104.9903)
    assert hazard.score == 40
    assert "0.2%" in hazard.primary_factors[0]


def test_shaded_x_outranks_unshaded_x_and_a99_is_high_risk():
    parsed = parse_flood_zone_response(
        {
            "features": [
                {"attributes": {"FLD_ZONE": "X", "ZONE_SUBTY": "AREA OF MINIMAL FLOOD HAZARD", "SFHA_TF": "F"}},
                {"attributes": {"FLD_ZONE": "X", "ZONE_SUBTY": "AREA WITH REDUCED FLOOD RISK DUE TO LEVEE", "SFHA_TF": "F"}},
            ]
        }
    )
    assert "LEVEE" in parsed.zone_subtype
    a99 = parse_flood_zone_response(
        {"features": [{"attributes": {"FLD_ZONE": "X", "SFHA_TF": "F"}}, {"attributes": {"FLD_ZONE": "A99", "SFHA_TF": "T"}}]}
    )
    assert a99.flood_zone == "A99"
    assert score_flood_risk(a99, 39.7392, -104.9903).score >= 80


def test_parse_ibtracs_hurricane_features():
    payload = {
        "features": [
            {
                "attributes": {
                    "SID": "AL012020",
                    "NAME": "SALLY",
                    "year": 2020,
                    "USA_WIND": 90,
                    "LAT": 25.8,
                    "LON": -80.2,
                }
            },
            {
                "attributes": {
                    "SID": "AL012020",
                    "NAME": "SALLY",
                    "year": 2020,
                    "USA_WIND": 110,
                    "LAT": 25.7,
                    "LON": -80.1,
                }
            },
        ]
    }

    parsed = parse_hurricane_response(
        payload,
        latitude=25.76,
        longitude=-80.19,
        cutoff_year=1970,
    )

    assert parsed.historical_storm_count == 1
    assert parsed.category_distribution["category_3"] == 1
    assert parsed.category_distribution["category_2"] == 0
    assert parsed.nearest_track_distance_km < 50
    assert parsed.tropical_systems_100km == 1
    assert parsed.hurricane_passes_100km == 1
    assert parsed.major_hurricane_passes_100km == 1


def test_close_pass_uses_distance_to_track_segment_not_just_endpoints():
    # Two 6-hourly points ~240 km apart on either side of the site; the track passes ~30 km away.
    features = [
        {"attributes": {"SID": "S1", "LAT": 25.5, "LON": -81.4, "USA_WIND": 100, "Hurricane_Date": 1}},
        {"attributes": {"SID": "S1", "LAT": 25.5, "LON": -79.0, "USA_WIND": 90, "Hurricane_Date": 2}},
        # A weak system passing close, and a hurricane passing far away.
        {"attributes": {"SID": "S2", "LAT": 25.8, "LON": -80.2, "USA_WIND": 40, "Hurricane_Date": 1}},
        {"attributes": {"SID": "S3", "LAT": 29.0, "LON": -80.2, "USA_WIND": 120, "Hurricane_Date": 1}},
    ]

    assert count_close_passes(features, 25.77, -80.19) == (2, 1, 1)


def test_parse_noaa_gsoy_dx90_results_by_year():
    results = [
        {"date": "2019-01-01T00:00:00", "datatype": "DX90", "value": 40},
        {"date": "2020-01-01T00:00:00", "datatype": "DX90", "value": 52},
        {"date": "2020-01-01T00:00:00", "datatype": "TMAX", "value": 99},
        {"date": "2021-01-01T00:00:00", "datatype": "DX90", "value": None},
    ]
    assert parse_annual_hot_days(results) == {2019: 40.0, 2020: 52.0}
    assert parse_annual_hot_days([]) == {}


def test_hot_days_trend_is_least_squares_per_decade():
    assert hot_days_trend_per_decade([10.0, 11.0, 12.0, 13.0]) == 10.0
    assert hot_days_trend_per_decade([30.0, 30.0, 30.0]) == 0.0
    assert hot_days_trend_per_decade([5.0]) == 0.0
    # One hot outlier year at the end must not dominate like an endpoint-to-endpoint slope.
    noisy = [30.0] * 29 + [80.0]
    assert hot_days_trend_per_decade(noisy) < 10.0
    assert trend_direction_from_slope(5.0) == "increasing"
    assert trend_direction_from_slope(-5.0) == "decreasing"
    assert trend_direction_from_slope(1.0) == "stable"


def test_select_station_prefers_nearest_long_record():
    stations = [
        # Closest, but only one year of data.
        {"id": "short", "latitude": 33.45, "longitude": -112.07, "mindate": "2020-01-01", "maxdate": "2021-01-01", "datacoverage": 0.5},
        {"id": "long", "latitude": 33.43, "longitude": -112.00, "mindate": "1933-01-01", "maxdate": "2026-01-01", "datacoverage": 1.0},
        {"id": "far", "latitude": 33.80, "longitude": -112.40, "mindate": "1950-01-01", "maxdate": "2026-01-01", "datacoverage": 0.95},
    ]
    assert select_station(stations, 33.4484, -112.074, 1996, 2026)["id"] == "long"
    assert select_station(stations[:1], 33.4484, -112.074, 1996, 2026) is None


def test_parse_whp_histogram_returns_class_shares():
    payload = {
        "histograms": [
            {"size": 7, "min": 0.5, "max": 7.5, "counts": [0, 0, 10, 30, 0, 60, 0]}
        ]
    }
    assert parse_whp_histogram(payload) == {3: 0.1, 4: 0.3, 6: 0.6}


def test_parse_whp_histogram_without_coverage_raises():
    with pytest.raises(RuntimeError):
        parse_whp_histogram({"histograms": []})
    with pytest.raises(RuntimeError):
        parse_whp_histogram({"histograms": [{"size": 2, "min": 0, "max": 2, "counts": [0, 0]}]})


def test_arcgis_error_payload_raises_instead_of_parsing_as_empty():
    with pytest.raises(RuntimeError, match="Invalid query"):
        raise_for_arcgis_error({"error": {"code": 400, "message": "Invalid query"}})
    assert raise_for_arcgis_error({"features": []}) == {"features": []}


def test_parse_flood_zone_records_fallback_provider():
    parsed = parse_flood_zone_response(
        {"features": [{"attributes": {"FLD_ZONE": "VE", "SFHA_TF": "T", "STATIC_BFE": 9}}]},
        provider=PROVIDER_FALLBACK,
    )
    assert parsed.flood_zone == "VE"
    assert parsed.provider == PROVIDER_FALLBACK


def test_peak_wind_does_not_inflate_close_pass_intensity():
    # A storm that is a tropical storm while near the property but a major hurricane
    # far away must count as a tropical system here, not a hurricane pass.
    features = [
        {"attributes": {"OBJECTID": 1, "SID": "S1", "year": 2020, "USA_WIND": 40, "LAT": 25.80, "LON": -80.10, "Hurricane_Date": 1}},
        {"attributes": {"OBJECTID": 2, "SID": "S1", "year": 2020, "USA_WIND": 40, "LAT": 25.90, "LON": -80.00, "Hurricane_Date": 2}},
        {"attributes": {"OBJECTID": 3, "SID": "S1", "year": 2020, "USA_WIND": 45, "LAT": 27.50, "LON": -78.00, "Hurricane_Date": 3}},
        {"attributes": {"OBJECTID": 4, "SID": "S1", "year": 2020, "USA_WIND": 120, "LAT": 29.50, "LON": -75.00, "Hurricane_Date": 4}},
    ]
    parsed = parse_hurricane_response({"features": features}, 25.79, -80.13, 1976)

    assert parsed.tropical_systems_100km == 1
    assert parsed.hurricane_passes_100km == 0
    assert parsed.category_distribution["category_4"] == 1
    assert features[0]["attributes"]["USA_WIND"] == 40


def test_hurricane_parser_skips_blank_numeric_fields():
    features = [
        {"attributes": {"SID": "S1", "year": 2020, "USA_WIND": " ", "LAT": "", "LON": -80.1, "Hurricane_Date": "x"}},
        {"attributes": {"SID": "S2", "year": 2020, "USA_WIND": 70, "LAT": 25.8, "LON": -80.1, "Hurricane_Date": 5}},
    ]
    parsed = parse_hurricane_response({"features": features}, 25.79, -80.13, 1976)

    assert parsed.historical_storm_count == 2
    assert parsed.hurricane_passes_100km == 1


def test_hot_days_trend_uses_actual_years_across_gaps():
    # +1 day/year, but with a 10-year gap in the record: still +10 days per decade.
    years = [2000, 2001, 2002, 2013, 2014, 2015]
    values = [float(year - 2000) for year in years]
    assert hot_days_trend_per_decade(values, years) == 10.0


def test_parse_whp_histogram_with_zero_based_bins():
    # Bins centred on x.5 must not be shifted by banker's rounding.
    payload = {"histograms": [{"size": 7, "min": 0, "max": 7, "counts": [0, 0, 0, 0, 5, 0, 5]}]}
    assert parse_whp_histogram(payload) == {5: 0.5, 7: 0.5}


def test_parse_whp_histogram_matches_live_service_shape():
    # Shape returned by the real service for Paradise, CA (bins centred on integers).
    payload = {"histograms": [{"size": 7, "min": -0.5, "max": 6.5, "counts": [0, 0, 30, 38, 131, 0, 162]}]}
    shares = parse_whp_histogram(payload)
    assert set(shares) == {2, 3, 4, 6}
