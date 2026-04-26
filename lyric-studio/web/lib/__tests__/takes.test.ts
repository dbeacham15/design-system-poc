import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { createProject } from "../projects";
import { createTake, listTakes, getTake, updateTake, deleteTake } from "../takes";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("takes", () => {
  let db: Database.Database;
  let projectId: string;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db, MIGRATIONS_DIR);
    projectId = createProject(db, { title: "T", genre: "pop" }).id;
  });

  it("creates and retrieves a take", () => {
    const t = createTake(db, { project_id: projectId, path: "/tmp/raw.wav" });
    expect(t.id).toBeDefined();
    expect(t.project_id).toBe(projectId);
    expect(t.kind).toBe("lead");
    expect(t.is_processed).toBe(0);
    expect(getTake(db, t.id)?.path).toBe("/tmp/raw.wav");
  });

  it("listTakes returns all takes for a project ordered by created_at", () => {
    createTake(db, { project_id: projectId, path: "/a.wav" });
    createTake(db, { project_id: projectId, path: "/b.wav" });
    expect(listTakes(db, projectId)).toHaveLength(2);
  });

  it("updateTake sets trim and flags", () => {
    const t = createTake(db, { project_id: projectId, path: "/raw.wav" });
    const updated = updateTake(db, t.id, {
      trim_start_ms: 200,
      trim_end_ms: 5000,
      is_processed: 1,
    });
    expect(updated?.trim_start_ms).toBe(200);
    expect(updated?.trim_end_ms).toBe(5000);
    expect(updated?.is_processed).toBe(1);
  });

  it("deleteTake removes the record", () => {
    const t = createTake(db, { project_id: projectId, path: "/raw.wav" });
    deleteTake(db, t.id);
    expect(getTake(db, t.id)).toBeNull();
  });
});
