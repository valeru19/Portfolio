from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from .config import settings

# Чистим словарь каждые N успешных проверок, чтобы не раздувать память.
_CLEANUP_EVERY_CHECKS = 32

_rate_buckets: dict[str, deque[float]] = defaultdict(deque)
_checks_since_cleanup = 0


def reset_rate_limit_state() -> None:
    """Очистка buckets — для тестов между кейсами."""
    global _checks_since_cleanup
    _rate_buckets.clear()
    _checks_since_cleanup = 0


def client_ip(request: Request) -> str:
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip() or "unknown"
    if request.client:
        return request.client.host
    return "unknown"


def _cleanup_stale_buckets(now: float, window: float) -> None:
    stale_keys: list[str] = []
    for key, bucket in _rate_buckets.items():
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if not bucket:
            stale_keys.append(key)
    for key in stale_keys:
        del _rate_buckets[key]


def enforce_rate_limit(request: Request) -> None:
    global _checks_since_cleanup

    ip = client_ip(request)
    now = time.monotonic()
    window = float(settings.rate_limit_window_seconds)
    bucket = _rate_buckets[ip]

    while bucket and now - bucket[0] > window:
        bucket.popleft()

    if len(bucket) >= settings.rate_limit_max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )

    bucket.append(now)

    _checks_since_cleanup += 1
    if _checks_since_cleanup >= _CLEANUP_EVERY_CHECKS:
        _checks_since_cleanup = 0
        _cleanup_stale_buckets(now, window)
