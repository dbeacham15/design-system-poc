import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { getTake } from "@/lib/takes";
import { getSetting } from "@/lib/settings";
import { startProcessing } from "@/lib/audio-service";
import { DATA_ROOT } from "@/lib/storage";
import path from "node:path";
import fs from "node:fs";

export async function POST(req: Request) {
  const body = await req.json();
  const { project_id, take_id, harmony } = body;
  if (!project_id || !take_id) {
    return NextResponse.json({ error: "project_id and take_id required" }, { status: 400 });
  }

  const db = getDb();
  const project = getProject(db, project_id);
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const take = getTake(db, take_id);
  if (!take) return NextResponse.json({ error: "take not found" }, { status: 404 });

  if (!project.instrumental_path) {
    return NextResponse.json({ error: "project analysis not complete — instrumental_path is null" }, { status: 400 });
  }

  const outputDir = path.join(DATA_ROOT, "projects", project_id, "takes", take_id);
  fs.mkdirSync(outputDir, { recursive: true });

  const latency_ms = Number(getSetting(db, "latency_ms") ?? "25");

  const { job_id } = await startProcessing({
    project_id,
    take_id,
    take_path: take.path,
    instrumental_path: project.instrumental_path,
    key: project.key ?? "C",
    genre: project.genre,
    output_dir: outputDir,
    trim_start_ms: take.trim_start_ms,
    trim_end_ms: take.trim_end_ms,
    latency_ms,
    pitch_correction: take.pitch_correction === 1,
    harmony: harmony === true,
  });

  return NextResponse.json({ job_id });
}
