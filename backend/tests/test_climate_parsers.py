from app.services.climate.flood_data import parse_flood_zone_response
from app.services.climate.heat_data import count_extreme_heat_days
from app.services.climate.hurricane_data import parse_hurricane_response


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


def test_parse_fema_nfhl_defaults_when_empty():
    parsed = parse_flood_zone_response({"features": []})
    assert parsed.flood_zone == "X"
    assert parsed.special_flood_hazard_area is False
    assert parsed.base_flood_elevation is None


def test_parse_ibtracs_hurricane_features():
    payload = {
        "features": [
            {
                "attributes": {
                    "SID": "AL012020",
                    "NAME": "SALLY",
                    "SEASON": 2020,
                    "USA_WIND": 90,
                    "LAT": 25.8,
                    "LON": -80.2,
                }
            },
            {
                "attributes": {
                    "SID": "AL012020",
                    "NAME": "SALLY",
                    "SEASON": 2020,
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


def test_parse_noaa_cdo_tmax_results_counts_extreme_heat_days():
    results = [
        {"datatype": "TMAX", "value": 96.0},
        {"datatype": "TMAX", "value": 90.0},
        {"datatype": "TMAX", "value": 100.0},
        {"datatype": "TMAX", "value": 94.9},
    ]
    assert count_extreme_heat_days(results) == 2.0
    assert count_extreme_heat_days([]) == 0.0
