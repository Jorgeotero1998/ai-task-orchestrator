"use client";

/** Resolve API paths for local FastAPI vs Vercel `/api` proxy. */
export function createApiClient(apiBase: string) {
  const base = apiBase.replace(/\/$/, "");

  return {
    authDemo: `${base}/auth/demo`,
    authLogin: `${base}/auth/login`,
    tasks: `${base}/tasks`,
    task: (id: string) => `${base}/tasks/${id}`,
    orchestrate: `${base}/orchestrate`,
  };
}
