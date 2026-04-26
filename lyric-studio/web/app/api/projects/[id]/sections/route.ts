import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listSections, createSection } from "@/lib/sections";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ sections: listSections(getDb(), id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  try {
    const section = createSection(getDb(), {
      project_id: id,
      name: body.name,
      bar_start: body.bar_start,
      bar_end: body.bar_end,
      lines_per_phrase: body.lines_per_phrase,
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
}
