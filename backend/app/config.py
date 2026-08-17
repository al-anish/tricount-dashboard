"""Application configuration, loaded from environment variables (.env).

We deliberately avoid pydantic-settings here (it's not part of the requested
stack) and just read `os.environ` after `load_dotenv()` has populated it.
"""
from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Minimal settings holder. Never log `tricount_token`."""

    def __init__(self) -> None:
        token = os.getenv("TRICOUNT_TOKEN", "").strip()
        if not token:
            raise RuntimeError(
                "TRICOUNT_TOKEN is not set. Copy backend/.env.example to "
                "backend/.env and fill in your Tricount sharing token."
            )
        self.tricount_token: str = token

        origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
        self.cors_origins: list[str] = [
            origin.strip() for origin in origins_raw.split(",") if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Return a process-wide cached Settings instance."""
    return Settings()
