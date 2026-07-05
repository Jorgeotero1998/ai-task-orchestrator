from __future__ import annotations

from fastapi import HTTPException, status
from groq import Groq

from app.core.config import settings


def orchestrate_steps(*, title: str) -> tuple[list[str], str]:
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is not configured",
        )

    client = Groq(api_key=settings.groq_api_key)
    completion = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert task orchestrator. "
                    "Return exactly 5 short, actionable steps. "
                    "No introductions, one step per line."
                ),
            },
            {"role": "user", "content": title},
        ],
    )

    content = completion.choices[0].message.content or ""
    steps = [line.strip(" *-").strip() for line in content.splitlines() if line.strip()]
    steps = [s for s in steps if len(s) >= 3]
    return steps[:5], content

