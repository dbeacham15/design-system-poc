import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSection, listSections } from "@/lib/sections";
import { getProject } from "@/lib/projects";
import { generateRhymes } from "@/lib/claude";
import { cacheKey, getCachedRhymes, setCachedRhymes } from "@/lib/rhyme";

export async function POST(req: Request) {
  const { section_id, end_word, syllable_budget, line_index } = await req.json();
  const section = getSection(getDb(), section_id);
  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 });
  const project = getProject(getDb(), section.project_id);
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const k = cacheKey(end_word, syllable_budget, project.genre);
  const cached = getCachedRhymes(getDb(), k);
  if (cached) return NextResponse.json({ rhymes: cached, cached: true });

  // Same-section + previous-section lyric context
  const sections = listSections(getDb(), project.id);
  const idx = sections.findIndex((s) => s.id === section_id);
  const lines: { text: string }[] = JSON.parse(section.lines_json);
  const same_section_lyrics = lines.slice(0, line_index).map((l) => l.text).join("\n");
  const prev_section_lyrics = idx > 0
    ? (JSON.parse(sections[idx - 1].lines_json) as { text: string }[]).map((l) => l.text).join("\n")
    : "";

  try {
    const rhymes = await generateRhymes({
      end_word, syllable_budget,
      section_notes: section.notes,
      same_section_lyrics, prev_section_lyrics,
      genre: project.genre,
    });
    setCachedRhymes(getDb(), k, rhymes);
    return NextResponse.json({ rhymes, cached: false });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
