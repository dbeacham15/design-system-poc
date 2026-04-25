import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject, softDeleteProject, permanentlyDeleteProject } from "@/lib/projects";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const permanent = url.searchParams.get("permanent") === "true";
  if (permanent) {
    permanentlyDeleteProject(getDb(), id);
  } else {
    softDeleteProject(getDb(), id);
  }
  return NextResponse.json({ ok: true });
}
