import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { restoreProject } from "@/lib/projects";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  restoreProject(getDb(), id);
  return NextResponse.json({ ok: true });
}
