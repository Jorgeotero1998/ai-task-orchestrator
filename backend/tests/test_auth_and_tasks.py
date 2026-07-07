def _login(client) -> str:
    resp = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin"})
    assert resp.status_code == 200
    return resp.json()["token"]


def test_tasks_empty_initially(client):
    token = _login(client)
    resp = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == []


def test_demo_login_issues_token(client):
    resp = client.post("/auth/demo")
    assert resp.status_code == 200
    token = resp.json()["token"]
    assert token
    # Demo token must be accepted by protected routes.
    tasks = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    assert tasks.status_code == 200


def test_orchestrate_fallback_without_key(client, monkeypatch):
    token = _login(client)
    from app.services import orchestrator

    monkeypatch.setattr(orchestrator.settings, "groq_api_key", None, raising=False)

    resp = client.post(
        "/api/orchestrate",
        json={"title": "Launch a podcast"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["subtasks"]) == 5
    assert body["source"] == "fallback"


def test_orchestrate_creates_task(client, monkeypatch):
    token = _login(client)

    def _fake_orchestrate_steps(*, title: str):
        steps = [f"{title} step {i}" for i in range(1, 6)]
        return steps, "raw", "ai"

    import app.routers.tasks as tasks_router

    monkeypatch.setattr(tasks_router, "orchestrate_steps", _fake_orchestrate_steps)

    resp = client.post(
        "/api/orchestrate",
        json={"title": "Build a portfolio-ready deploy"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()["subtasks"]) == 5

    resp2 = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 200
    assert len(resp2.json()) == 1

