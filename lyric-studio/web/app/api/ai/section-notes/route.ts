import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { getSection, updateSection } from "@/lib/sections";
import { extractSectionFeatures } from "@/lib/audio-service";
import { generateSectionNotes } from "@/lib/claude";
import { barToMs } from "@/lib/bar-math";

export async function POST(req: Request) {
  const { section_id } = await req.json();
  const section = getSection(getDb(), section_id);
  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 });
  const project = getProject(getDb(), section.project_id);
  if (!project?.instrumental_path || !project.bpm || !project.time_sig) {
    return NextResponse.json({ error: "project not ready" }, { status: 400 });
  }

  const start_ms = barToMs(section.bar_start, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
  const end_ms = barToMs(section.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);

  try {
    const features = await extractSectionFeatures(project.instrumental_path, start_ms, end_ms);
    const notes = await generateSectionNotes({
      track: { title: project.title, bpm: project.bpm, key: project.key!, time_sig: project.time_sig, genre: project.genre },
      section: { name: section.name, bar_start: section.bar_start, bar_end: section.bar_end },
      features,
    });
    updateSection(getDb(), section_id, { notes });
    return NextResponse.json({ notes });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
