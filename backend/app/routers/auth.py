from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.schemas import LoginRequest, LoginResponse
from app.security import create_access_token


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    if payload.email != settings.admin_email or payload.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return LoginResponse(token=create_access_token(subject=payload.email))

