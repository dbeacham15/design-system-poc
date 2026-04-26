import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { updateSection, deleteSection } from "@/lib/sections";

export async function PATCH(req: Request, ctx: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await ctx.params;
  const patch = await req.json();
  try {
    return NextResponse.json({ section: updateSection(getDb(), sectionId, patch) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await ctx.params;
  deleteSection(getDb(), sectionId);
  return NextResponse.json({ ok: true });
}
