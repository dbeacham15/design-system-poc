import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { createProject, updateProjectAnalysis } from "../projects";
import { createSection, updateSection } from "../sections";
import { buildLyricsJson, buildLyricsMd } from "../exports";

const M = path.resolve(__dirname, "../../migrations");

describe("exports", () => {
  let db: Database.Database;

  beforeEach(() => { db = new Database(":memory:"); runMigrations(db, M); });

  it("buildLyricsJson includes per-line ms timestamps", () => {
    const p = createProject(db, { title: "X", genre: "pop" });
    updateProjectAnalysis(db, p.id, {
      bpm: 120, key: "Cm", time_sig: "4/4",
      duration_ms: 60000, downbeat_offset_ms: 0,
      rms_envelope: [], energy_regions: [],
      instrumental_path: "/tmp/x.wav",
    });
    const s = createSection(db, { project_id: p.id, name: "V1", bar_start: 1, bar_end: 4 });
    updateSection(db, s.id, {
      lines_json: JSON.stringify([{ text: "hello world", bar_start: 1, bar_end: 2 }]),
    });
    const out = buildLyricsJson(db, p.id);
    expect(out.project.bpm).toBe(120);
    expect(out.sections[0].lines[0].time_start_ms).toBe(0);
    expect(out.sections[0].lines[0].time_end_ms).toBe(4000); // 2 bars × 2000ms
  });

  it("buildLyricsMd includes section header + bar-prefixed lines", () => {
    const p = createProject(db, { title: "X", genre: "pop" });
    updateProjectAnalysis(db, p.id, {
      bpm: 120, key: "Cm", time_sig: "4/4",
      duration_ms: 60000, downbeat_offset_ms: 0,
      rms_envelope: [], energy_regions: [],
      instrumental_path: "/tmp/x.wav",
    });
    const s = createSection(db, { project_id: p.id, name: "V1", bar_start: 1, bar_end: 4 });
    updateSection(db, s.id, {
      lines_json: JSON.stringify([{ text: "hello world", bar_start: 1, bar_end: 2 }]),
    });
    const md = buildLyricsMd(db, p.id);
    expect(md).toContain("# X");
    expect(md).toContain("## V1 (bars 1-4)");
    expect(md).toContain("[bars 1-2]  hello world");
  });
});
