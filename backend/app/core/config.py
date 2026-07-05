from __future__ import annotations

import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Normalize provider DB URLs for SQLAlchemy + psycopg.

    - Convert postgres/postgresql schemes to postgresql+psycopg
    - Remove libpq-only `channel_binding` (can break serverless drivers)
    """

    url = (url or "").strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    parts = urlsplit(url)
    if not parts.query:
        return url

    params = parse_qsl(parts.query, keep_blank_values=True)
    filtered = [(k, v) for k, v in params if (k or "").lower() != "channel_binding"]
    if len(filtered) == len(params):
        return url

    new_query = urlencode(filtered, doseq=True)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, new_query, parts.fragment))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"

    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/ai_task_orchestrator"

    jwt_secret: str = "change-me"
    jwt_issuer: str = "ai-task-orchestrator"
    jwt_audience: str = "ai-task-orchestrator"
    jwt_exp_minutes: int = 60 * 24 * 7  # 7 days

    admin_email: str = "admin@example.com"
    admin_password: str = "change-me"

    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    cors_origins_csv: str = "https://ai-task-orchestrator-inky.vercel.app,http://localhost:3000"

    @property
    def resolved_database_url(self) -> str:
        url = (
            os.getenv("DATABASE_URL")
            or os.getenv("POSTGRES_URL")
            or os.getenv("POSTGRES_PRISMA_URL")
            or os.getenv("POSTGRES_URL_NON_POOLING")
            or self.database_url
        ).strip()
        return normalize_database_url(url)

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_csv.split(",") if o.strip()]


settings = Settings()
