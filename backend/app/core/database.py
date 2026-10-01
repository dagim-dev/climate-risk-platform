from collections.abc import AsyncGenerator
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

class Base(DeclarativeBase):
    pass


# Supabase's transaction pooler (PgBouncer/Supavisor) can't track prepared
# statements across pooled connections, so asyncpg's statement cache must be off
# and statement names must be unique.
_connect_args = (
    {
        "statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
    }
    if settings.DATABASE_URL.startswith("postgresql+asyncpg")
    else {}
)

engine = create_async_engine(settings.DATABASE_URL, echo=False, connect_args=_connect_args)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
