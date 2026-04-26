import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { getSetting, setSetting } from "../settings";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

describe("settings", () => {
  let db: Database.Database;
  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db, MIGRATIONS_DIR);
  });

  it("getSetting returns default latency_ms of 25", () => {
    expect(getSetting(db, "latency_ms")).toBe("25");
  });

  it("setSetting upserts", () => {
    setSetting(db, "latency_ms", "50");
    expect(getSetting(db, "latency_ms")).toBe("50");
  });

  it("getSetting returns null for unknown key", () => {
    expect(getSetting(db, "nonexistent")).toBeNull();
  });
});
