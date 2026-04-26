import { NextResponse } from "next/server";
import fs from "node:fs";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project?.instrumental_path) {
    return NextResponse.json({ error: "no instrumental" }, { status: 404 });
  }
  const buf = fs.readFileSync(project.instrumental_path);
  return new NextResponse(buf, {
    headers: {
      "content-type": "audio/wav",
      "content-length": buf.length.toString(),
    },
  });
}
