from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert task orchestrator. Decompose the user's goal into exactly 5 actionable steps.

Return ONLY valid JSON (no markdown) with this exact shape:
{"steps": [
  {
    "step": 1,
    "title": "Short imperative action (max 8 words)",
    "description": "Concrete, specific details the user can execute today.",
    "priority": "high",
    "timeline": "Days 1-3"
  }
]}

Rules:
- exactly 5 steps in the array
- priority must be one of: high, medium, low
- timeline should be a realistic window (e.g. "Days 1-3", "Week 1", "Week 2-3")
- titles start with a verb; descriptions are 1-2 sentences
- tailor every step to the user's specific goal
"""

_TIMELINES = ("Days 1-3", "Days 4-7", "Week 2", "Week 3", "Week 4")
_PRIORITIES = ("high", "high", "medium", "medium", "low")


def _normalize_step(raw: dict[str, Any], index: int) -> dict[str, Any]:
    priority = str(raw.get("priority", "medium")).lower()
    if priority not in {"high", "medium", "low"}:
        priority = _PRIORITIES[min(index, 4)]

    title = str(raw.get("title") or raw.get("step_title") or "").strip()
    description = str(raw.get("description") or raw.get("detail") or title).strip()
    if not title and description:
        title = description.split(".")[0][:80]
    if not description:
        description = title

    return {
        "step": int(raw.get("step") or index + 1),
        "title": title,
        "description": description,
        "priority": priority,
        "timeline": str(raw.get("timeline") or raw.get("timeframe") or _TIMELINES[min(index, 4)]),
    }


def _parse_json_steps(content: str) -> list[dict[str, Any]]:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    data = json.loads(text)
    if not isinstance(data, list):
        raise ValueError("Expected JSON array")
    steps = [_normalize_step(item if isinstance(item, dict) else {"title": str(item)}, i) for i, item in enumerate(data)]
    return steps[:5]


def _lines_to_steps(lines: list[str]) -> list[dict[str, Any]]:
    cleaned = [line.strip(" *-•\t1234567890.").strip() for line in lines if line.strip()]
    cleaned = [s for s in cleaned if len(s) >= 3][:5]
    return [
        {
            "step": i + 1,
            "title": text.split(".")[0][:80] or text[:80],
            "description": text,
            "priority": _PRIORITIES[min(i, 4)],
            "timeline": _TIMELINES[min(i, 4)],
        }
        for i, text in enumerate(cleaned)
    ]


def _fallback_lines(title: str) -> list[str]:
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

    if any(w in lower for w in ("learn", "study", "course", "certification", "exam")):
        return [
            f"Define what success looks like for \"{goal}\" and set a realistic deadline.",
            "Break the material into weekly modules with specific outcomes per module.",
            "Gather resources (books, videos, practice projects) before starting.",
            "Study in focused 90-minute blocks and track progress daily.",
            "Test your knowledge with a project or mock exam, then review gaps.",
        ]

    if any(w in lower for w in ("fitness", "run", "marathon", "gym", "health", "weight", "dance", "bailar")):
        return [
            f"Set a measurable target and baseline for \"{goal}\".",
            "Design a progressive weekly schedule with rest and recovery days.",
            "Prepare gear, nutrition plan, and accountability system.",
            "Execute week 1 at 70% intensity to build consistency.",
            "Track metrics weekly and adjust the plan based on results.",
        ]

    return [
        f"Define the objective, constraints, and success criteria for \"{goal}\".",
        f"Break \"{goal}\" into milestones with owners, timelines, and dependencies.",
        "Identify the highest-leverage milestone and gather required resources.",
        "Execute the first milestone with daily progress tracking.",
        f"Review outcomes, capture lessons learned, and iterate toward \"{goal}\".",
    ]


def _fallback_plan(title: str) -> list[dict[str, Any]]:
    """Built-in orchestrator — always available, no API key required."""

    return _lines_to_steps(_fallback_lines(title))


def _pad_steps(steps: list[dict[str, Any]], title: str) -> list[dict[str, Any]]:
    if len(steps) >= 5:
        return steps[:5]
    filler = _fallback_plan(title)
    seen = {s["title"] for s in steps}
    for item in filler:
        if len(steps) >= 5:
            break
        if item["title"] not in seen:
            item = {**item, "step": len(steps) + 1}
            steps.append(item)
            seen.add(item["title"])
    return steps[:5]


def orchestrate_steps(*, title: str) -> tuple[list[dict[str, Any]], str, str]:
    """Return ``(steps, raw_response, source)``.

    ``source`` is ``ai`` (Groq Llama 3.3) or ``demo`` (built-in orchestrator).
    The demo path never fails — recruiters always get a structured plan.
    """

    if not settings.groq_api_key:
        logger.info("GROQ_API_KEY not configured; using built-in demo orchestrator.")
        steps = _fallback_plan(title)
        return steps, json.dumps(steps), "demo"

    try:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": title},
            ],
            temperature=0.5,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content or ""
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict) and "steps" in parsed:
                steps = [_normalize_step(s, i) for i, s in enumerate(parsed["steps"][:5])]
            else:
                steps = _parse_json_steps(content if content.strip().startswith("[") else json.dumps(parsed))
        except (json.JSONDecodeError, ValueError, KeyError):
            steps = _lines_to_steps([line for line in content.splitlines() if line.strip()])
        if len(steps) < 5:
            steps = _pad_steps(steps, title)
        return steps[:5], content, "ai"
    except Exception:  # noqa: BLE001
        logger.exception("Groq orchestration failed; using built-in demo orchestrator.")
        steps = _fallback_plan(title)
        return steps, json.dumps(steps), "demo"
