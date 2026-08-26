from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_and_verify_password():
    hashed = hash_password("secure-password")
    assert hashed != "secure-password"
    assert verify_password("secure-password", hashed)
    assert not verify_password("wrong-password", hashed)


def test_access_token_round_trip():
    token = create_access_token("42")
    assert decode_access_token(token) == "42"


def test_decode_invalid_token_returns_none():
    assert decode_access_token("not-a-valid-token") is None
