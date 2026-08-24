from app.core.database_url import sync_database_url


def test_sync_database_url_converts_asyncpg_driver():
    url = "postgresql+asyncpg://postgres:password@localhost:5432/climate_risk"
    assert sync_database_url(url) == (
        "postgresql+psycopg2://postgres:password@localhost:5432/climate_risk"
    )


def test_sync_database_url_preserves_other_drivers():
    url = "postgresql://postgres:password@localhost:5432/climate_risk"
    assert sync_database_url(url) == url
