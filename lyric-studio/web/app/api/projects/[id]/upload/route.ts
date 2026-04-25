import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getDb } from "@/lib/db";
import { getProject, updateProjectAnalysis, updateProjectStatus } from "@/lib/projects";
import { ensureProjectDir, transcodeTo48kWav } from "@/lib/storage";
import { analyzeAudio } from "@/lib/audio-service";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const dir = ensureProjectDir(id);
  const tempPath = path.join(dir, `upload.${file.name.split(".").pop() || "bin"}`);
  const outPath = path.join(dir, "instrumental.wav");

  fs.writeFileSync(tempPath, Buffer.from(await file.arrayBuffer()));

  try {
    await transcodeTo48kWav(tempPath, outPath);
    fs.unlinkSync(tempPath);
    const analysis = await analyzeAudio(outPath);
    updateProjectAnalysis(getDb(), id, { ...analysis, instrumental_path: outPath });
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    updateProjectStatus(getDb(), id, "analysis_failed");
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
