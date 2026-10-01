from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ClimateSourceCache(Base):
    __tablename__ = "climate_source_cache"

    source: Mapped[str] = mapped_column(String(32), primary_key=True)
    lat_cell: Mapped[int] = mapped_column(Integer, primary_key=True)
    lon_cell: Mapped[int] = mapped_column(Integer, primary_key=True)
    payload: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"), nullable=False
    )
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
