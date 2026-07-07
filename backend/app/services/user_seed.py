from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
from app.models import User
from app.passwords import hash_password


def ensure_seed_users(db: Session) -> None:
    """Create default admin and demo accounts when missing."""

    seeds = [
        (SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD),
        (DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD),
    ]
    for email, plain in seeds:
        normalized = email.strip().lower()
        exists = db.scalar(select(User.id).where(User.email == normalized))
        if exists:
            continue
        db.add(User(email=normalized, password_hash=hash_password(plain)))
    db.commit()
