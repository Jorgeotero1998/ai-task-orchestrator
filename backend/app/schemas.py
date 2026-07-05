from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str


class OrchestrateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class OrchestrateResponse(BaseModel):
    subtasks: list[str]


class TaskOut(BaseModel):
    id: UUID
    title: str
    subtasks: list[str]
    created_at: datetime

