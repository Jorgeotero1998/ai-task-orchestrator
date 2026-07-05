from __future__ import annotations

import os

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    cors_origins_csv: str = "http://localhost:3000"

    @property
    def resolved_database_url(self) -> str:
        url = (
            os.getenv("DATABASE_URL")
            or os.getenv("POSTGRES_URL")
            or os.getenv("POSTGRES_PRISMA_URL")
            or os.getenv("POSTGRES_URL_NON_POOLING")
            or self.database_url
        ).strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and "+psycopg" not in url:
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_csv.split(",") if o.strip()]


settings = Settings()
