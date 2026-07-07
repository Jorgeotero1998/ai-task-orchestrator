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
    steps = [line.strip(" *-•\t").strip() for line in content.splitlines() if line.strip()]
    steps = [s for s in steps if len(s) >= 3]
    return steps[:5]


def _fallback_steps(title: str) -> list[str]:
    """Deterministic decomposition used when the LLM is unavailable.

    Keeps the live demo meaningful even if ``GROQ_API_KEY`` is not configured
    on the deployment. Real AI output is always preferred when the key exists.
    """

    goal = title.strip().rstrip(".")
    return [
        f"Clarify the objective and success criteria for \"{goal}\".",
        f"Break \"{goal}\" into key milestones and required resources.",
        "Assign owners and set realistic deadlines for each milestone.",
        "Execute the highest-impact milestone first and track progress.",
        f"Review results, gather feedback, and iterate toward \"{goal}\".",
    ]


def orchestrate_steps(*, title: str) -> tuple[list[str], str, str]:
    """Return ``(steps, raw_response, source)``.

    ``source`` is ``"ai"`` when Groq produced the plan, otherwise ``"fallback"``.
    The demo never hard-fails: on a missing key or provider error it degrades
    gracefully to a deterministic decomposition.
    """

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not configured; using deterministic fallback.")
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
    except Exception:  # noqa: BLE001 - degrade gracefully for any provider error
        logger.exception("Groq orchestration failed; using deterministic fallback.")
        steps = _fallback_steps(title)
        return steps, "\n".join(steps), "fallback"
