import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getTake, updateTake, deleteTake } from "@/lib/takes";
import { DATA_ROOT } from "@/lib/storage";
import fs from "node:fs";
import path from "node:path";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; takeId: string }> }
) {
  const { id, takeId } = await ctx.params;
  const db = getDb();
  const take = getTake(db, takeId);
  if (!take) {
    return NextResponse.json({ error: "take not found" }, { status: 404 });
  }
  if (take.project_id !== id) {
    return NextResponse.json({ error: "take not found" }, { status: 404 });
  }
  const body = await req.json();
  const allowed = ["trim_start_ms", "trim_end_ms", "is_processed", "harmony_enabled", "pitch_correction"];
  const updates: Record<string, number> = {};
  for (const k of allowed) {
    if (k in body) updates[k] = Number(body[k]);
  }
  const updated = updateTake(db, takeId, updates as Parameters<typeof updateTake>[2]);
  return NextResponse.json({ take: updated });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; takeId: string }> }
) {
  const { id, takeId } = await ctx.params;
  const db = getDb();
  const take = getTake(db, takeId);
  if (!take) return NextResponse.json({ error: "take not found" }, { status: 404 });
  if (take.project_id !== id) {
    return NextResponse.json({ error: "take not found" }, { status: 404 });
  }
  deleteTake(db, takeId);
  // Remove the entire take directory (raw.wav + any stems)
  const takeDir = path.join(DATA_ROOT, "projects", id, "takes", takeId);
  if (fs.existsSync(takeDir)) fs.rmSync(takeDir, { recursive: true });
  return NextResponse.json({ ok: true });
}
