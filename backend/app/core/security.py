from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        subject = payload.get("sub")
        if subject is None:
            return None
        return str(subject)
    except JWTError:
        return None


def create_pdf_download_token(property_id: int, user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.PDF_SIGNED_URL_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": f"pdf:{property_id}:{user_id}",
        "exp": expire,
        "type": "pdf_download",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_pdf_download_token(token: str, property_id: int) -> int | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "pdf_download":
            return None
        subject = payload.get("sub", "")
        parts = str(subject).split(":")
        if len(parts) != 3 or parts[0] != "pdf" or int(parts[1]) != property_id:
            return None
        return int(parts[2])
    except (JWTError, ValueError):
        return None
