import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSection } from "@/lib/sections";
import { getProject } from "@/lib/projects";
import { polishLine } from "@/lib/claude";

export async function POST(req: Request) {
  const { section_id, line_index, line } = await req.json();
  const section = getSection(getDb(), section_id);
  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 });
  const project = getProject(getDb(), section.project_id);
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const lines: { text: string }[] = JSON.parse(section.lines_json);
  const same_section_lyrics = lines.slice(0, line_index).map((l) => l.text).join("\n");

  try {
    const polished = await polishLine({
      line,
      section_notes: section.notes,
      same_section_lyrics,
      genre: project.genre,
    });
    return NextResponse.json({ polished });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
