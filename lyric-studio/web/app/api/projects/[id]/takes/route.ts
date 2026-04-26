import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { createTake, listTakes } from "@/lib/takes";
import { DATA_ROOT } from "@/lib/storage";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const takes = listTakes(getDb(), id);
  return NextResponse.json({ takes });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const db = getDb();
  if (!getProject(db, id)) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  // Pre-allocate a directory with a temporary UUID so we have a place to write
  // the file before createTake generates the canonical take ID.
  const tempId = randomUUID();
  const tempDir = path.join(DATA_ROOT, "projects", id, "takes", tempId);
  fs.mkdirSync(tempDir, { recursive: true });

  const tempRawPath = path.join(tempDir, "raw.wav");
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(tempRawPath, buffer);

  // createTake generates its own UUID — we pass the temp path so the record
  // is valid immediately. Then we rename the directory to match the real take.id
  // and update the path column to reflect the new location.
  const take = createTake(db, { project_id: id, path: tempRawPath });

  const canonicalDir = path.join(DATA_ROOT, "projects", id, "takes", take.id);
  if (tempDir !== canonicalDir) {
    fs.renameSync(tempDir, canonicalDir);
    const canonicalPath = path.join(canonicalDir, "raw.wav");
    db.prepare("UPDATE takes SET path = ? WHERE id = ?").run(canonicalPath, take.id);
    take.path = canonicalPath;
  }

  return NextResponse.json({ take }, { status: 201 });
}
