from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.schemas import LoginRequest, LoginResponse
from app.security import create_access_token


router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_SUBJECT = "demo@orchestrator.app"


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if payload.email != settings.admin_email or payload.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return LoginResponse(token=create_access_token(subject=payload.email))


@router.post("/demo", response_model=LoginResponse)
def demo_login() -> LoginResponse:
    """Frictionless demo access.

    Issues a scoped, read/write demo token without credentials so recruiters
    can try the product instantly. Real auth via ``/auth/login`` is unaffected.
    """
    return LoginResponse(token=create_access_token(subject=DEMO_SUBJECT))

