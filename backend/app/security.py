from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from datetime import timedelta
from typing import Any


HASH_NAME = "pbkdf2_sha256"
HASH_ITERATIONS = 260_000


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, HASH_ITERATIONS)
    return f"{HASH_NAME}${HASH_ITERATIONS}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        name, iterations, salt_text, digest_text = password_hash.split("$", 3)
        if name != HASH_NAME:
            return False
        salt = _b64decode(salt_text)
        expected_digest = _b64decode(digest_text)
        actual_digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations),
        )
    except (ValueError, TypeError):
        return False

    return hmac.compare_digest(actual_digest, expected_digest)


def token_secret() -> bytes:
    return os.getenv("DAJEONG_TOKEN_SECRET", "dajeong-local-dev-secret").encode("utf-8")


def token_expiry_delta() -> timedelta:
    raw_minutes = os.getenv("DAJEONG_TOKEN_EXPIRE_MINUTES", "60")
    return timedelta(minutes=int(raw_minutes))


def create_access_token(user_id: str, role: str) -> str:
    expires_at = int(time.time() + token_expiry_delta().total_seconds())
    payload = {"sub": user_id, "role": role, "exp": expires_at}
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(token_secret(), body.encode("ascii"), hashlib.sha256).digest()
    return f"{body}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        body, signature_text = token.split(".", 1)
        expected_signature = hmac.new(token_secret(), body.encode("ascii"), hashlib.sha256).digest()
        actual_signature = _b64decode(signature_text)
        if not hmac.compare_digest(actual_signature, expected_signature):
            return None

        payload = json.loads(_b64decode(body).decode("utf-8"))
        if int(payload["exp"]) < int(time.time()):
            return None
        return payload
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None
