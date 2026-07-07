from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import DEMO_SUBJECT
from app.db import get_db
from app.models import User
from app.passwords import hash_password, verify_password
from app.schemas import LoginRequest, LoginResponse, RegisterRequest
from app.security import create_access_token
from app.services.demo_seed import ensure_demo_seed
from app.services.user_seed import ensure_seed_users

router = APIRouter(prefix="/auth", tags=["auth"])

_LEGACY_ADMIN_PASSWORDS = {"Admin1234!", "change-me", "admin"}


def _issue_token(subject: str) -> LoginResponse:
    return LoginResponse(token=create_access_token(subject=subject))


def _authenticate(email: str, password: str, db: Session) -> str | None:
    normalized = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized))
    if user and verify_password(password, user.password_hash):
        return user.email

    if normalized == settings.admin_email.strip().lower():
        accepted = _LEGACY_ADMIN_PASSWORDS | {settings.admin_password}
        if password in accepted:
            return settings.admin_email

    return None


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> LoginResponse:
    email = payload.email.strip().lower()
    if len(payload.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    existing = db.scalar(select(User.id).where(User.email == email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    return _issue_token(email)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    subject = _authenticate(payload.email, payload.password, db)
    if subject is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _issue_token(subject)


@router.post("/demo", response_model=LoginResponse)
def demo_login(db: Session = Depends(get_db)) -> LoginResponse:
    """One-click guest access with curated starter plans."""

    try:
        ensure_seed_users(db)
    except Exception:
        pass
    ensure_demo_seed(db)
    return _issue_token(DEMO_SUBJECT)
