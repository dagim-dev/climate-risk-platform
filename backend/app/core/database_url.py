def sync_database_url(url: str) -> str:
    """Alembic uses a synchronous engine; swap asyncpg for psycopg2."""
    if "+asyncpg" in url:
        return url.replace("postgresql+asyncpg", "postgresql+psycopg2", 1)
    return url
