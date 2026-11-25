from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _split_origins(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def _resolve_database_url(raw: str | None) -> str:
    default = f"sqlite:///{(BASE_DIR / 'data' / 'portfolio.db').as_posix()}"
    url = (raw or default).strip() or default
    if not url.startswith("sqlite:///"):
        return url
    path = Path(url.removeprefix("sqlite:///"))
    if not path.is_absolute():
        path = (BASE_DIR / path).resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{path.as_posix()}"


class Settings:
    admin_key: str = os.getenv("ADMIN_KEY", "change-me-admin-key")
    cors_origins: list[str] = _split_origins(
        os.getenv(
            "CORS_ORIGINS",
            "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:4173,http://localhost:4173,null",
        )
    )
    database_url: str = _resolve_database_url(os.getenv("DATABASE_URL"))
    rate_limit_window_seconds: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    rate_limit_max_requests: int = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "10"))


settings = Settings()
