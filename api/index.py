from __future__ import annotations

import sys
from pathlib import Path

from starlette.types import ASGIApp, Receive, Scope, Send

# Vercel Python entrypoint: expose FastAPI app from backend package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import create_app  # noqa: E402


class _StripApiPrefixMiddleware:
    """Strip /api prefix when mounted behind Vercel same-origin rewrites."""

    def __init__(self, app: ASGIApp, prefix: str = "/api") -> None:
        self.app = app
        self.prefix = prefix.rstrip("/")

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path == self.prefix or path.startswith(f"{self.prefix}/"):
                scope = dict(scope)
                scope["path"] = path[len(self.prefix) :] or "/"
        await self.app(scope, receive, send)


app = _StripApiPrefixMiddleware(create_app())
