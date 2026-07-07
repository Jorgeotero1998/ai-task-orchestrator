"use client";

/** Resolve API paths for local FastAPI vs Vercel `/api` proxy. */
export function createApiClient(apiBase: string) {
  const base = apiBase.replace(/\/$/, "");
  const apiPrefix = base === "/api" ? `${base}/api` : `${base}/api`;

  return {
    authDemo: `${base}/auth/demo`,
    authLogin: `${base}/auth/login`,
    tasks: `${apiPrefix}/tasks`,
    task: (id: string) => `${apiPrefix}/tasks/${id}`,
    orchestrate: `${apiPrefix}/orchestrate`,
  };
}
