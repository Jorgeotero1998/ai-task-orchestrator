from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import DEMO_SUBJECT
from app.db import get_db
from app.schemas import LoginRequest, LoginResponse
from app.security import create_access_token
from app.services.demo_seed import ensure_demo_seed


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if payload.email != settings.admin_email or payload.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return LoginResponse(token=create_access_token(subject=payload.email))


@router.post("/demo", response_model=LoginResponse)
def demo_login(db: Session = Depends(get_db)) -> LoginResponse:
    """Guest access with curated starter plans when history is empty."""

    ensure_demo_seed(db)
    return LoginResponse(token=create_access_token(subject=DEMO_SUBJECT))
