from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, health, tasks

logger = logging.getLogger(__name__)


def _run_migrations() -> None:
    try:
        from alembic import command
        from alembic.config import Config

        command.upgrade(Config("alembic.ini"), "head")
    except Exception:
        logger.exception("Alembic migration skipped or failed")


def create_app() -> FastAPI:
    logging.basicConfig(level=logging.INFO)

    app = FastAPI(
        title="AI Task Orchestrator",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(tasks.router)

    @app.on_event("startup")
    def _startup() -> None:
        _run_migrations()

    return app


app = create_app()

