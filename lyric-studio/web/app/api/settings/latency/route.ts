import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";

export async function GET() {
  const value = getSetting(getDb(), "latency_ms") ?? "25";
  return NextResponse.json({ latency_ms: Number(value) });
}

export async function POST(req: Request) {
  const { latency_ms } = await req.json();
  const val = Number(latency_ms);
  if (!Number.isFinite(val) || val < 0 || val > 500) {
    return NextResponse.json({ error: "latency_ms must be 0–500" }, { status: 400 });
  }
  setSetting(getDb(), "latency_ms", String(val));
  return NextResponse.json({ latency_ms: val });
}
