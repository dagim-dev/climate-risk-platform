from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    # Matches the migration: a unique constraint plus a plain lookup index.
    __table_args__ = (Index("ix_users_email", "email"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    properties = relationship("Property", back_populates="user", cascade="all, delete-orphan")
