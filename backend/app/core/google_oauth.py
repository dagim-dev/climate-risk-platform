from __future__ import annotations

from typing import Any, Optional

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import settings


class GoogleIdentity:
    def __init__(self, google_id: str, email: str, name: Optional[str]):
        self.google_id = google_id
        self.email = email
        self.name = name


def verify_google_id_token(token: str) -> GoogleIdentity:
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")

    try:
        payload: dict[str, Any] = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise ValueError("Invalid Google ID token") from exc

    google_id = payload.get("sub")
    email = payload.get("email")
    if not google_id or not email:
        raise ValueError("Google ID token is missing required claims")
    if payload.get("email_verified") is False:
        raise ValueError("Google email is not verified")

    name = payload.get("name")
    return GoogleIdentity(
        google_id=str(google_id),
        email=str(email),
        name=str(name) if name else None,
    )
