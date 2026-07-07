from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an expert task orchestrator. "
    "Break the user's goal into exactly 5 short, concrete, actionable steps. "
    "Each step must start with a verb and be self-contained. "
    "No introductions, no numbering, one step per line."
)


def _clean_steps(content: str) -> list[str]:
    steps = [line.strip(" *-•\t1234567890.").strip() for line in content.splitlines() if line.strip()]
    steps = [s for s in steps if len(s) >= 3]
    return steps[:5]


def _fallback_steps(title: str) -> list[str]:
    """Goal-aware deterministic decomposition when Groq is unavailable."""

    goal = title.strip().rstrip(".")
    lower = goal.lower()

    if any(w in lower for w in ("podcast", "content", "blog", "newsletter", "youtube")):
        return [
            f"Define the niche, audience, and success metrics for \"{goal}\".",
            "Choose your publishing platform, cadence, and basic production stack.",
            "Create a 2-week content calendar with topics and distribution channels.",
            "Produce and publish your first piece, then gather audience feedback.",
            "Iterate on format and promotion based on engagement data.",
        ]

    if any(w in lower for w in ("migrate", "monolith", "microservice", "refactor", "legacy")):
        return [
            "Map current system boundaries and identify the first module to extract.",
            f"Design service contracts and a phased migration plan for \"{goal}\".",
            "Set up CI/CD, observability, and rollback mechanisms before cutting over.",
            "Extract the highest-risk module behind feature flags and run integration tests.",
            "Monitor production metrics and iterate on the next extraction boundary.",
        ]

    if any(w in lower for w in ("launch", "mvp", "startup", "product", "saas")):
        return [
            f"Validate demand and define the MVP scope for \"{goal}\".",
            "Build a landing page with analytics, waitlist, and one core user flow.",
            "Prepare launch assets: demo, FAQs, and a coordinated announcement plan.",
            "Execute a focused launch across your top 2–3 acquisition channels.",
            "Measure activation and retention for 7 days, then ship the top fix.",
        ]

    if any(w in lower for w in ("hire", "team", "recruit", "onboard")):
        return [
            f"Write a clear role definition and success profile aligned with \"{goal}\".",
            "Source candidates through referrals, LinkedIn, and niche communities.",
            "Run structured interviews with a scorecard and practical exercise.",
            "Extend an offer with a 30/60/90-day onboarding plan.",
            "Review hiring outcomes and refine the pipeline for the next role.",
        ]

    return [
        f"Define the objective, constraints, and success criteria for \"{goal}\".",
        f"Break \"{goal}\" into milestones with owners, timelines, and dependencies.",
        "Identify the highest-leverage milestone and gather required resources.",
        "Execute the first milestone with daily progress tracking.",
        f"Review outcomes, capture lessons learned, and iterate toward \"{goal}\".",
    ]


def orchestrate_steps(*, title: str) -> tuple[list[str], str, str]:
    """Return ``(steps, raw_response, source)``."""

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not configured; using goal-aware fallback.")
        steps = _fallback_steps(title)
        return steps, "\n".join(steps), "fallback"

    try:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": title},
            ],
            temperature=0.6,
            max_tokens=512,
        )
        content = completion.choices[0].message.content or ""
        steps = _clean_steps(content)
        if not steps:
            raise ValueError("Empty completion from Groq")
        return steps, content, "ai"
    except Exception:  # noqa: BLE001
        logger.exception("Groq orchestration failed; using goal-aware fallback.")
        steps = _fallback_steps(title)
        return steps, "\n".join(steps), "fallback"
