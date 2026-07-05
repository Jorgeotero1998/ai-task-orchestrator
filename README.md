# AI Task Orchestrator

Portfolio-ready AI orchestration product that breaks a goal into **5 actionable steps** (Groq LLM), persists results to Postgres, and ships with a production deploy path.

## Live demo
- **Web**: https://ai-task-orchestrator-inky.vercel.app
- **API**: (deploy backend to Render with `render.yaml` – see Production deploy section)

## What’s deployed
- **Web**: Next.js 15 + React 19 dashboard (`frontend/`)
- **API**: FastAPI + SQLAlchemy + Alembic (`backend/`)
- **DB**: Postgres (recommended: Neon)

## Health checks
- **API**: `GET /health` → `{"status":"ok"}`
- **Web**: `GET /api/health` → checks backend reachability

## Local development (Docker)
1) Copy env template:

```bash
cp .env.example .env
```

2) Start the stack:

```bash
docker compose up -d --build
```

3) Open:
- **Web**: `http://localhost:3000`
- **API**: `http://localhost:8000`

## Configuration (env vars)
See `.env.example`. Minimum production env vars:
- **API**: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `GROQ_API_KEY`
- **Web**: `NEXT_PUBLIC_API_BASE_URL` (and optionally `API_BASE_URL_INTERNAL`)

## Migrations
- The API container runs `alembic upgrade head` on startup.
- To run manually:

```bash
docker compose exec backend alembic -c alembic.ini upgrade head
```

## Production deploy (Vercel + Render + Neon)
### Backend (Render)
1) Create a Neon Postgres database and copy the connection string.
2) Create a new Render **Web Service** from this GitHub repo (Blueprint supported via `render.yaml`).
3) Set env vars on Render:
- `DATABASE_URL`: Neon connection string
- `JWT_SECRET`: strong random value
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: admin credentials
- `GROQ_API_KEY`: your Groq API key
- `CORS_ORIGINS_CSV`: allowed web origins (ex: `https://<your-vercel-domain>`)
4) Verify:
- `GET https://<render-service>/health`

### Frontend (Vercel)
1) Import repo in Vercel and set **Root Directory** to `frontend/`.
2) Set env vars on Vercel:
- `NEXT_PUBLIC_API_BASE_URL=https://<render-service>`
- `API_BASE_URL_INTERNAL=https://<render-service>` (used by `/api/health`)
3) Verify:
- `GET https://<vercel-app>/api/health`

## Security notes
- **No secrets are committed**. Configure via platform env vars.
- If you ever committed an API key, rotate it in your provider dashboard.

