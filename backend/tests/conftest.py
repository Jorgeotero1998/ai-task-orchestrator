import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def _test_env():
    os.environ.setdefault(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/ai_task_orchestrator_test",
    )
    os.environ.setdefault("JWT_SECRET", "test-secret")
    os.environ.setdefault("ADMIN_EMAIL", "admin@example.com")
    os.environ.setdefault("ADMIN_PASSWORD", "admin")


@pytest.fixture()
def client():
    from app.main import app
    from app.db import Base, engine

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestClient(app) as c:
        yield c

