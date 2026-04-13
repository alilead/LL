"""Redact secrets from raw request bodies before logging."""

from __future__ import annotations

import json
from typing import FrozenSet

_REDACT_KEYS: FrozenSet[str] = frozenset(
    {
        "password",
        "current_password",
        "new_password",
        "refresh_token",
        "access_token",
        "secret",
        "client_secret",
        "token",
    }
)


def safe_request_body_log(path: str, raw: bytes) -> str:
    """Return a log-safe string for a request body; never echo passwords or tokens."""
    if not raw:
        return ""
    lower = path.lower()
    needs_redact = any(
        x in lower
        for x in (
            "/login",
            "/register",
            "/password",
            "/token",
            "/email/accounts",
            "/oauth",
        )
    )
    if not needs_redact:
        return raw.decode("utf-8", errors="replace")
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return "<redacted: non-json or binary body>"
    if isinstance(data, dict):
        out: dict = {}
        for k, v in data.items():
            if k.lower() in _REDACT_KEYS or "password" in k.lower():
                out[k] = "***"
            else:
                out[k] = v
        return json.dumps(out, default=str)
    return "<redacted>"
