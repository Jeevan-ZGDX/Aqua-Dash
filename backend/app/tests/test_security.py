"""Unit tests for security primitives: hashing, JWT, cookies."""

import pytest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    TOKEN_TYPE_ACCESS,
    TOKEN_TYPE_REFRESH,
)
from app.core.exceptions import InvalidTokenError


def test_hash_and_verify():
    hashed = hash_password("mypassword123")
    assert verify_password("mypassword123", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_and_decode_access_token():
    token, exp = create_access_token("42", extra={"role": "AHOD"})
    payload = decode_token(token, expected_type=TOKEN_TYPE_ACCESS)
    assert payload["sub"] == "42"
    assert payload["role"] == "AHOD"
    assert payload["type"] == TOKEN_TYPE_ACCESS


def test_create_and_decode_refresh_token():
    token, exp = create_refresh_token("42")
    payload = decode_token(token, expected_type=TOKEN_TYPE_REFRESH)
    assert payload["sub"] == "42"


def test_decode_access_with_refresh_type():
    token, _ = create_access_token("42")
    with pytest.raises(InvalidTokenError):
        decode_token(token, expected_type=TOKEN_TYPE_REFRESH)


def test_decode_invalid_token():
    with pytest.raises(InvalidTokenError):
        decode_token("this.is.not.a.valid.jwt")


def test_revoked_token():
    from app.core.security import revoke_token
    from app.core.constants import Roles

    token, _ = create_access_token("99", extra={"role": Roles.AHOD.value})
    revoke_token(token)
    with pytest.raises(Exception):
        decode_token(token, expected_type=TOKEN_TYPE_ACCESS)


def test_password_complexity():
    # bcrypt truncates passwords at 72 bytes; the test verifies basic behaviour
    hashed = hash_password("A" * 30)
    assert verify_password("A" * 30, hashed)
    assert not verify_password("B" * 30, hashed)