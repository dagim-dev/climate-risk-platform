from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_sentry_test_endpoint_raises_in_development():
    if settings.ENVIRONMENT == "production":
        return

    response = client.get("/debug/sentry-test")
    assert response.status_code == 500
