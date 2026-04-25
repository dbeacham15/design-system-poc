import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../migrations";
import { createProject, listProjects, getProject, softDeleteProject, restoreProject, listTrash } from "../projects";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("projects", () => {
  let db: Database.Database;
  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db, MIGRATIONS_DIR);
  });

  it("creates and retrieves a project", () => {
    const p = createProject(db, { title: "Test", genre: "pop" });
    expect(p.id).toBeDefined();
    expect(p.title).toBe("Test");
    expect(p.status).toBe("analyzing");
    expect(getProject(db, p.id)?.title).toBe("Test");
  });

  it("listProjects excludes soft-deleted", () => {
    const a = createProject(db, { title: "A", genre: "pop" });
    createProject(db, { title: "B", genre: "rock" });
    softDeleteProject(db, a.id);
    const visible = listProjects(db);
    expect(visible.map((p) => p.title)).toEqual(["B"]);
  });

  it("listTrash returns only soft-deleted", () => {
    const a = createProject(db, { title: "A", genre: "pop" });
    createProject(db, { title: "B", genre: "rock" });
    softDeleteProject(db, a.id);
    expect(listTrash(db).map((p) => p.title)).toEqual(["A"]);
  });

  it("restoreProject moves project back to live list", () => {
    const a = createProject(db, { title: "A", genre: "pop" });
    softDeleteProject(db, a.id);
    restoreProject(db, a.id);
    expect(listProjects(db).map((p) => p.title)).toEqual(["A"]);
  });
});
