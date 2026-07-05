def _login(client) -> str:
    resp = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin"})
    assert resp.status_code == 200
    return resp.json()["token"]


def test_tasks_empty_initially(client):
    token = _login(client)
    resp = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == []


def test_orchestrate_creates_task(client, monkeypatch):
    token = _login(client)

    def _fake_orchestrate_steps(*, title: str):
        return [f"{title} step 1", f"{title} step 2", f"{title} step 3", f"{title} step 4", f"{title} step 5"], "raw"

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

