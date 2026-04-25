import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../migrations";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("runMigrations", () => {
  let db: Database.Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });

  it("creates _migrations table on first run", () => {
    runMigrations(db, MIGRATIONS_DIR);
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
    expect(row).toBeDefined();
  });

  it("runs 001_init.sql and creates projects table", () => {
    runMigrations(db, MIGRATIONS_DIR);
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").get();
    expect(row).toBeDefined();
  });

  it("is idempotent — second run does nothing new", () => {
    runMigrations(db, MIGRATIONS_DIR);
    const before = db.prepare("SELECT count(*) as c FROM _migrations").get() as { c: number };
    runMigrations(db, MIGRATIONS_DIR);
    const after = db.prepare("SELECT count(*) as c FROM _migrations").get() as { c: number };
    expect(after.c).toBe(before.c);
  });
});
