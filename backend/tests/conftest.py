import asyncio
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.rate_limit import analyze_limiter
from app.main import app
from app.models.climate_source_cache import ClimateSourceCache  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.models.user import User  # noqa: F401


@pytest.fixture(autouse=True)
def reset_rate_limits() -> Generator[None, None, None]:
    analyze_limiter.reset()
    yield
    analyze_limiter.reset()


@pytest.fixture
def client(tmp_path, monkeypatch) -> Generator[TestClient, None, None]:
    db_path = tmp_path / "test.db"
    monkeypatch.setattr(
        "app.core.config.settings.GOOGLE_CLIENT_ID",
        "test-google-client-id.apps.googleusercontent.com",
    )

    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")

    async def create_tables() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(create_tables())
    TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())
