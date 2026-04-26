import type Database from "better-sqlite3";
import { syllable } from "syllable";
import { getProject } from "./projects";
import { listSections } from "./sections";
import { barToMs } from "./bar-math";

export function buildLyricsJson(db: Database.Database, projectId: string) {
  const project = getProject(db, projectId);
  if (!project) throw new Error("project not found");
  const sections = listSections(db, projectId);

  return {
    project: {
      title: project.title,
      bpm: project.bpm,
      downbeat_offset_ms: project.downbeat_offset_ms ?? 0,
      time_sig: project.time_sig,
      duration_ms: project.duration_ms,
      genre: project.genre,
      key: project.key,
    },
    sections: sections.map((s) => {
      const lines = JSON.parse(s.lines_json) as { text: string; bar_start: number; bar_end: number }[];
      const time_start_ms = barToMs(s.bar_start, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!);
      const time_end_ms = barToMs(s.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!);
      return {
        name: s.name,
        bar_start: s.bar_start,
        bar_end: s.bar_end,
        time_start_ms, time_end_ms,
        notes: s.notes,
        lines: lines.map((l) => ({
          text: l.text,
          bar_start: l.bar_start,
          bar_end: l.bar_end,
          time_start_ms: barToMs(l.bar_start, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!),
          time_end_ms: barToMs(l.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!),
          syllable_count: countSyllablesQuick(l.text),
        })),
      };
    }),
  };
}

export function buildLyricsMd(db: Database.Database, projectId: string): string {
  const project = getProject(db, projectId);
  if (!project) throw new Error("project not found");
  const sections = listSections(db, projectId);

  const parts: string[] = [];
  parts.push(`# ${project.title}`);
  parts.push("");
  parts.push(
    `**BPM:** ${project.bpm} | **Key:** ${project.key} | **Time:** ${project.time_sig} | ` +
    `**Length:** ${formatDuration(project.duration_ms ?? 0)} | **Genre:** ${project.genre}`
  );
  parts.push("");
  for (const s of sections) {
    parts.push(`## ${s.name} (bars ${s.bar_start}-${s.bar_end})`);
    if (s.notes) {
      parts.push(`> Notes: ${s.notes}`);
    }
    parts.push("");
    const lines = JSON.parse(s.lines_json) as { text: string; bar_start: number; bar_end: number }[];
    for (const l of lines) {
      parts.push(`[bars ${l.bar_start}-${l.bar_end}]  ${l.text}`);
    }
    parts.push("");
  }
  return parts.join("\n");
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function countSyllablesQuick(text: string): number {
  return text ? syllable(text) : 0;
}
