from __future__ import annotations

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.constants import DEMO_SUBJECT
from app.models import Task

DEMO_SEED_PLANS: list[dict[str, object]] = [
    {
        "title": "Launch a tech podcast in 30 days",
        "subtasks": [
            {
                "step": 1,
                "title": "Define niche and audience",
                "description": "Identify your target listener, unique angle, and success metrics (downloads, reviews).",
                "priority": "high",
                "timeline": "Days 1-3",
            },
            {
                "step": 2,
                "title": "Set up production stack",
                "description": "Choose mic, recording software, hosting (Spotify/Apple), and a publishing cadence.",
                "priority": "high",
                "timeline": "Days 4-7",
            },
            {
                "step": 3,
                "title": "Record pilot episodes",
                "description": "Batch-record 3 episodes to build momentum and refine your format before launch.",
                "priority": "medium",
                "timeline": "Week 2",
            },
            {
                "step": 4,
                "title": "Create launch assets",
                "description": "Design cover art, write show notes, and publish a landing page with email signup.",
                "priority": "medium",
                "timeline": "Week 3",
            },
            {
                "step": 5,
                "title": "Publish and promote",
                "description": "Release episode 1, promote on LinkedIn/X, and schedule a 4-week content cadence.",
                "priority": "low",
                "timeline": "Week 4",
            },
        ],
    },
    {
        "title": "Migrate a monolith to microservices",
        "subtasks": [
            {
                "step": 1,
                "title": "Map system boundaries",
                "description": "Identify bounded contexts and select the first module to extract from the monolith.",
                "priority": "high",
                "timeline": "Days 1-3",
            },
            {
                "step": 2,
                "title": "Design migration plan",
                "description": "Define service contracts, API gateway routes, and a strangler-fig rollout strategy.",
                "priority": "high",
                "timeline": "Days 4-7",
            },
            {
                "step": 3,
                "title": "Stand up platform infra",
                "description": "Configure CI/CD, observability, and rollback mechanisms before any cutover.",
                "priority": "medium",
                "timeline": "Week 2",
            },
            {
                "step": 4,
                "title": "Extract first service",
                "description": "Move the highest-churn module behind feature flags and run integration tests.",
                "priority": "medium",
                "timeline": "Week 3",
            },
            {
                "step": 5,
                "title": "Monitor and iterate",
                "description": "Track SLOs in production and plan the next extraction boundary.",
                "priority": "low",
                "timeline": "Week 4",
            },
        ],
    },
    {
        "title": "Plan a product launch on a budget",
        "subtasks": [
            {
                "step": 1,
                "title": "Validate value proposition",
                "description": "Run 5–10 target-user interviews to confirm the problem and willingness to pay.",
                "priority": "high",
                "timeline": "Days 1-3",
            },
            {
                "step": 2,
                "title": "Build launch landing page",
                "description": "Ship a minimal page with waitlist, analytics, and one clear call-to-action.",
                "priority": "high",
                "timeline": "Days 4-7",
            },
            {
                "step": 3,
                "title": "Prepare launch assets",
                "description": "Create a demo video, 3 social posts, and a short email sequence.",
                "priority": "medium",
                "timeline": "Week 2",
            },
            {
                "step": 4,
                "title": "Execute launch day",
                "description": "Coordinate Product Hunt, social channels, and email in a single launch checklist.",
                "priority": "medium",
                "timeline": "Week 3",
            },
            {
                "step": 5,
                "title": "Measure and iterate",
                "description": "Track sign-ups and activation for 7 days, then ship the top friction fix.",
                "priority": "low",
                "timeline": "Week 4",
            },
        ],
    },
]


def ensure_demo_seed(db: Session) -> None:
    count = db.scalar(select(func.count()).select_from(Task).where(Task.owner == DEMO_SUBJECT))
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
    db.execute(delete(Task).where(Task.owner == DEMO_SUBJECT))
    db.commit()
    ensure_demo_seed(db)
