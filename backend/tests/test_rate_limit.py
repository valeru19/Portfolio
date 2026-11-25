from __future__ import annotations

from fastapi import HTTPException
from starlette.requests import Request

from app.rate_limit import (
    _rate_buckets,
    client_ip,
    enforce_rate_limit,
    reset_rate_limit_state,
)


def _request(*, host: str = "203.0.113.10", forwarded: str | None = None) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if forwarded is not None:
        headers.append((b"x-forwarded-for", forwarded.encode("latin-1")))
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "path": "/api/applications",
        "raw_path": b"/api/applications",
        "root_path": "",
        "scheme": "http",
        "query_string": b"",
        "headers": headers,
        "client": (host, 54321),
        "server": ("testserver", 80),
    }
    return Request(scope)


def test_client_ip_ignores_forwarded_when_proxy_untrusted(monkeypatch) -> None:
    monkeypatch.setattr("app.rate_limit.settings.trust_proxy", False)
    request = _request(host="198.51.100.2", forwarded="203.0.113.9, 10.0.0.1")
    assert client_ip(request) == "198.51.100.2"


def test_client_ip_uses_forwarded_when_proxy_trusted(monkeypatch) -> None:
    monkeypatch.setattr("app.rate_limit.settings.trust_proxy", True)
    request = _request(host="198.51.100.2", forwarded="203.0.113.9, 10.0.0.1")
    assert client_ip(request) == "203.0.113.9"


def test_enforce_rate_limit_returns_429_after_max(monkeypatch) -> None:
    reset_rate_limit_state()
    monkeypatch.setattr("app.rate_limit.settings.trust_proxy", False)
    monkeypatch.setattr("app.rate_limit.settings.rate_limit_max_requests", 3)
    monkeypatch.setattr("app.rate_limit.settings.rate_limit_window_seconds", 60)

    request = _request()
    enforce_rate_limit(request)
    enforce_rate_limit(request)
    enforce_rate_limit(request)

    try:
        enforce_rate_limit(request)
        raised = False
    except HTTPException as exc:
        raised = True
        assert exc.status_code == 429
    assert raised


def test_cleanup_removes_empty_buckets(monkeypatch) -> None:
    reset_rate_limit_state()
    monkeypatch.setattr("app.rate_limit.settings.trust_proxy", False)
    monkeypatch.setattr("app.rate_limit.settings.rate_limit_max_requests", 100)
    monkeypatch.setattr("app.rate_limit.settings.rate_limit_window_seconds", 60)
    monkeypatch.setattr("app.rate_limit._CLEANUP_EVERY_CHECKS", 1)

    # Seed a stale empty-after-expiry bucket via direct insert, then trigger cleanup.
    _rate_buckets["stale-ip"].append(0.0)
    request = _request(host="203.0.113.20")
    enforce_rate_limit(request)

    assert "stale-ip" not in _rate_buckets
    assert "203.0.113.20" in _rate_buckets
