from __future__ import annotations

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.constants import DEMO_SUBJECT
from app.models import Task

DEMO_SEED_PLANS: list[dict[str, object]] = [
    {
        "title": "Launch a tech podcast in 30 days",
        "subtasks": [
            "Define your niche, target audience, and unique angle for the show.",
            "Set up recording gear, hosting platform, and distribution channels (Spotify, Apple).",
            "Record and edit a 3-episode pilot batch to build launch momentum.",
            "Create cover art, show notes, and a simple landing page with email signup.",
            "Publish episode 1, promote across LinkedIn/X, and schedule a 4-week content cadence.",
        ],
    },
    {
        "title": "Migrate a monolith to microservices",
        "subtasks": [
            "Map current monolith domains and identify bounded contexts to extract first.",
            "Define service contracts, API gateways, and an incremental strangler-fig migration plan.",
            "Stand up CI/CD, observability, and shared infra (Docker, K8s or managed containers).",
            "Extract the highest-churn module into its own service with feature flags for rollback.",
            "Run load tests, monitor SLOs, and iterate on the next service boundary.",
        ],
    },
    {
        "title": "Plan a product launch on a budget",
        "subtasks": [
            "Validate the core value proposition with 5–10 target-user interviews.",
            "Build a minimal landing page with waitlist, analytics, and one clear CTA.",
            "Prepare launch assets: demo video, 3 social posts, and a short email sequence.",
            "Coordinate a launch day checklist across Product Hunt, social, and email channels.",
            "Track sign-ups and activation for 7 days, then prioritize the top friction point.",
        ],
    },
]


def ensure_demo_seed(db: Session) -> None:
    """Seed polished sample plans for the demo user (once)."""

    count = db.scalar(
        select(func.count()).select_from(Task).where(Task.owner == DEMO_SUBJECT)
    )
    if count and count > 0:
        return

    for plan in DEMO_SEED_PLANS:
        db.add(
            Task(
                title=str(plan["title"]),
                owner=DEMO_SUBJECT,
                subtasks=list(plan["subtasks"]),  # type: ignore[arg-type]
                raw_response="demo-seed",
            )
        )
    db.commit()


def reset_demo_seed(db: Session) -> None:
    """Replace demo history with curated samples (idempotent)."""

    db.execute(delete(Task).where(Task.owner == DEMO_SUBJECT))
    db.commit()
    ensure_demo_seed(db)
