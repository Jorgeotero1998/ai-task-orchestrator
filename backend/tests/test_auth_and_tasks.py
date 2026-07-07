def _login(client) -> str:
    resp = client.post("/auth/login", json={"email": "admin@example.com", "password": "admin"})
    assert resp.status_code == 200
    return resp.json()["token"]


def _sample_steps(title: str) -> list[dict]:
    return [
        {
            "step": i,
            "title": f"{title} step {i}",
            "description": f"Detailed action for {title} step {i}.",
            "priority": "high" if i == 1 else "medium",
            "timeline": f"Week {i}",
        }
        for i in range(1, 6)
    ]


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
    tasks = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    assert tasks.status_code == 200
    titles = [t["title"] for t in tasks.json()]
    assert len(titles) == 3
    assert "Launch a tech podcast in 30 days" in titles


def test_tasks_scoped_to_owner(client, monkeypatch):
    token = _login(client)

    def _fake_orchestrate_steps(*, title: str):
        steps = _sample_steps(title)
        return steps, "raw", "ai"

    import app.routers.tasks as tasks_router

    monkeypatch.setattr(tasks_router, "orchestrate_steps", _fake_orchestrate_steps)

    client.post(
        "/api/orchestrate",
        json={"title": "Admin-only goal"},
        headers={"Authorization": f"Bearer {token}"},
    )
    demo = client.post("/auth/demo").json()["token"]
    demo_tasks = client.get("/api/tasks", headers={"Authorization": f"Bearer {demo}"}).json()
    assert all(t["title"] != "Admin-only goal" for t in demo_tasks)


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
    assert len(body["steps"]) == 5
    assert len(body["subtasks"]) == 5
    assert body["source"] == "demo"
    assert body["steps"][0]["title"]


def test_orchestrate_creates_task(client, monkeypatch):
    token = _login(client)

    def _fake_orchestrate_steps(*, title: str):
        steps = _sample_steps(title)
        return steps, "raw", "ai"

    import app.routers.tasks as tasks_router

    monkeypatch.setattr(tasks_router, "orchestrate_steps", _fake_orchestrate_steps)

    resp = client.post(
        "/api/orchestrate",
        json={"title": "Build a portfolio-ready deploy"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert len(resp.json()["steps"]) == 5

    resp2 = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 200
    assert len(resp2.json()) == 1
