from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Task
from app.schemas import OrchestrateRequest, OrchestrateResponse, TaskOut
from app.security import require_auth
from app.services.orchestrator import orchestrate_steps

router = APIRouter(tags=["tasks"])


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


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_task(
    task_id: UUID,
    sub: str = Depends(require_auth),
    db: Session = Depends(get_db),
) -> Response:
    row = db.get(Task, task_id)
    if row is None or row.owner != sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/tasks", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def clear_tasks(
    sub: str = Depends(require_auth),
    db: Session = Depends(get_db),
) -> Response:
    db.execute(delete(Task).where(Task.owner == sub))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
