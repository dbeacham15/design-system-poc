import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { createProject } from "../projects";
import {
  createSection, listSections, updateSection, deleteSection, validateSectionPlacement
} from "../sections";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("sections", () => {
  let db: Database.Database;
  let projectId: string;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db, MIGRATIONS_DIR);
    projectId = createProject(db, { title: "T", genre: "pop" }).id;
  });

  it("creates and lists sections sorted by bar_start", () => {
    createSection(db, { project_id: projectId, name: "Chorus", bar_start: 17, bar_end: 24 });
    createSection(db, { project_id: projectId, name: "Verse 1", bar_start: 5, bar_end: 12 });
    const list = listSections(db, projectId);
    expect(list.map((s) => s.name)).toEqual(["Verse 1", "Chorus"]);
  });

  it("rejects overlapping sections", () => {
    createSection(db, { project_id: projectId, name: "A", bar_start: 5, bar_end: 12 });
    expect(() =>
      createSection(db, { project_id: projectId, name: "B", bar_start: 10, bar_end: 15 })
    ).toThrow(/overlap/i);
  });

  it("validateSectionPlacement detects overlaps", () => {
    createSection(db, { project_id: projectId, name: "A", bar_start: 5, bar_end: 12 });
    expect(validateSectionPlacement(db, projectId, 6, 8, null)).toBe("overlap");
    expect(validateSectionPlacement(db, projectId, 13, 16, null)).toBe("ok");
  });

  it("update preserves lines_json when not specified", () => {
    const s = createSection(db, { project_id: projectId, name: "A", bar_start: 5, bar_end: 12 });
    updateSection(db, s.id, { lines_json: '[{"text":"hi","bar_start":5,"bar_end":6}]' });
    updateSection(db, s.id, { name: "Renamed" });
    const list = listSections(db, projectId);
    expect(list[0].lines_json).toContain("hi");
    expect(list[0].name).toBe("Renamed");
  });
});
