from __future__ import annotations

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
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_csv.split(",") if o.strip()]


settings = Settings()

