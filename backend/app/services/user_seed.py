from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import User
from app.passwords import hash_password


def ensure_seed_users(db: Session) -> None:
    """Create the configured admin account when credentials are provided."""

    if not settings.admin_password:
        return

    normalized = settings.admin_email.strip().lower()
    exists = db.scalar(select(User.id).where(User.email == normalized))
    if not exists:
        db.add(User(email=normalized, password_hash=hash_password(settings.admin_password)))
    db.commit()
