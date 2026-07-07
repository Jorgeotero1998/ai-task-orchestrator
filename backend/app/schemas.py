from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginResponse(BaseModel):
    token: str


class OrchestrateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class PlanStep(BaseModel):
    step: int
    title: str
    description: str
    priority: str = "medium"
    timeline: str = ""


class OrchestrateResponse(BaseModel):
    steps: list[PlanStep]
    subtasks: list[str]
    source: str = "ai"


class TaskOut(BaseModel):
    id: UUID
    title: str
    subtasks: list[Any]
    created_at: datetime
