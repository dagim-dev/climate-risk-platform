import os

import pytest

from app.core.config import Settings


def test_cors_origins_default():
    settings = Settings(
        DATABASE_URL="postgresql+asyncpg://localhost/test",
        GOOGLE_MAPS_API_KEY="test",
        OPENAI_API_KEY="test",
        _env_file=None,
    )
    assert settings.cors_origins_list == ["http://localhost:3000"]


def test_cors_origins_parses_comma_separated_list():
    settings = Settings(
        DATABASE_URL="postgresql+asyncpg://localhost/test",
        GOOGLE_MAPS_API_KEY="test",
        OPENAI_API_KEY="test",
        CORS_ORIGINS="https://climaterisk.io, https://www.climaterisk.io",
        _env_file=None,
    )
    assert settings.cors_origins_list == [
        "https://climaterisk.io",
        "https://www.climaterisk.io",
    ]


def test_production_environment_variables(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://prod/db")
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "maps-key")
    monkeypatch.setenv("OPENAI_API_KEY", "openai-key")
    monkeypatch.setenv("NOAA_API_KEY", "noaa-key")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("APP_VERSION", "2.0.0")
    monkeypatch.setenv("JWT_SECRET", "production-jwt-secret-not-the-dev-default")
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://climaterisk.io,https://www.climaterisk.io",
    )

    settings = Settings(_env_file=None)

    assert settings.ENVIRONMENT == "production"
    assert settings.APP_VERSION == "2.0.0"
    assert "https://climaterisk.io" in settings.cors_origins_list


def test_production_rejects_default_jwt_secret(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://prod/db")
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "maps-key")
    monkeypatch.setenv("OPENAI_API_KEY", "openai-key")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("JWT_SECRET", raising=False)

    with pytest.raises(ValueError, match="JWT_SECRET"):
        Settings(_env_file=None)
