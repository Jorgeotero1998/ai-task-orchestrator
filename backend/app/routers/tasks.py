from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Task
from app.schemas import OrchestrateRequest, OrchestrateResponse, TaskOut
from app.security import require_auth
from app.services.orchestrator import orchestrate_steps


router = APIRouter(prefix="/api", tags=["tasks"])


@router.get("/tasks", response_model=list[TaskOut])
def list_tasks(
    sub: str = Depends(require_auth),
    db: Session = Depends(get_db),
) -> list[TaskOut]:
    rows = db.execute(
        select(Task)
        .where(Task.owner == sub)
        .order_by(Task.created_at.desc())
        .limit(20)
    ).scalars().all()
    return [
        TaskOut(id=r.id, title=r.title, subtasks=r.subtasks, created_at=r.created_at)
        for r in rows
    ]


@router.post("/orchestrate", response_model=OrchestrateResponse)
def orchestrate(
    payload: OrchestrateRequest,
    sub: str = Depends(require_auth),
    db: Session = Depends(get_db),
) -> OrchestrateResponse:
    steps, raw, source = orchestrate_steps(title=payload.title)
    task = Task(title=payload.title, owner=sub, subtasks=steps, raw_response=raw)
    db.add(task)
    db.commit()
    return OrchestrateResponse(
        steps=steps,
        subtasks=[s["title"] for s in steps],
        source=source,
    )
