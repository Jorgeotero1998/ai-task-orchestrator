import { NextResponse } from "next/server";

export async function GET() {
  const apiBase = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    return NextResponse.json({ status: "degraded", error: "NEXT_PUBLIC_API_BASE_URL not set" }, { status: 200 });
  }

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/health`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json({ status: res.ok ? "ok" : "degraded", api: json }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ status: "degraded", error: "API unreachable" }, { status: 200 });
  }
}

