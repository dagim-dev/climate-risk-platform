from app.core.google_oauth import GoogleIdentity


def test_register_login_and_me(client):
    register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner@example.com",
            "password": "securepass",
            "name": "Owner",
        },
    )
    assert register.status_code == 201
    body = register.json()
    assert body["user"]["email"] == "owner@example.com"
    assert body["user"]["name"] == "Owner"
    assert "subscription_tier" not in body["user"]
    assert body["access_token"]

    duplicate = client.post(
        "/api/v1/auth/register",
        json={"email": "owner@example.com", "password": "securepass"},
    )
    assert duplicate.status_code == 400

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.com", "password": "securepass"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    wrong = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.com", "password": "wrong-password"},
    )
    assert wrong.status_code == 401

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "owner@example.com"

    unauthenticated = client.get("/api/v1/auth/me")
    assert unauthenticated.status_code == 401


def test_oauth_rejects_unverified_identity(client):
    response = client.post(
        "/api/v1/auth/oauth",
        json={
            "email": "attacker@example.com",
            "name": "Attacker",
            "google_id": "forged-google-id",
        },
    )
    assert response.status_code == 422


def test_oauth_rejects_invalid_google_token(client, monkeypatch):
    def fake_verify(_token: str) -> GoogleIdentity:
        raise ValueError("Invalid Google ID token")

    monkeypatch.setattr("app.api.v1.endpoints.auth.verify_google_id_token", fake_verify)

    response = client.post("/api/v1/auth/oauth", json={"id_token": "garbage-token"})
    assert response.status_code == 401
    assert "Invalid Google ID token" in response.json()["detail"]


def test_oauth_issues_jwt_when_google_token_is_verified(client, monkeypatch):
    def fake_verify(token: str) -> GoogleIdentity:
        assert token == "real-google-id-token"
        return GoogleIdentity(
            google_id="google-sub-123",
            email="user@gmail.com",
            name="Google User",
        )

    monkeypatch.setattr("app.api.v1.endpoints.auth.verify_google_id_token", fake_verify)

    response = client.post("/api/v1/auth/oauth", json={"id_token": "real-google-id-token"})
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "user@gmail.com"
    assert body["user"]["name"] == "Google User"
    assert body["access_token"]

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "user@gmail.com"


def test_google_token_without_email_verified_claim_is_rejected(monkeypatch):
    import pytest

    from app.core import google_oauth

    monkeypatch.setattr(google_oauth.settings, "GOOGLE_CLIENT_ID", "client-id")
    monkeypatch.setattr(
        google_oauth.id_token,
        "verify_oauth2_token",
        lambda *_args, **_kwargs: {"sub": "123", "email": "victim@example.com"},
    )

    with pytest.raises(ValueError, match="not verified"):
        google_oauth.verify_google_id_token("token")


def test_email_is_case_insensitive(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"email": "Mixed.Case@Example.com", "password": "securepass"},
    )
    assert register.status_code == 201
    assert register.json()["user"]["email"] == "mixed.case@example.com"

    duplicate = client.post(
        "/api/v1/auth/register",
        json={"email": "mixed.case@example.com", "password": "securepass"},
    )
    assert duplicate.status_code == 400

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "MIXED.CASE@example.com", "password": "securepass"},
    )
    assert login.status_code == 200
