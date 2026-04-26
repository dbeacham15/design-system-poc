import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import path from "node:path";
import { runMigrations } from "../migrations";
import { cacheKey, getCachedRhymes, setCachedRhymes } from "../rhyme";

const M = path.resolve(__dirname, "../../migrations");

describe("rhyme cache", () => {
  let db: Database.Database;
  beforeEach(() => { db = new Database(":memory:"); runMigrations(db, M); });

  it("returns null on miss", () => {
    expect(getCachedRhymes(db, cacheKey("love", 14, "pop"))).toBeNull();
  });

  it("returns stored on hit", () => {
    const k = cacheKey("love", 14, "pop");
    setCachedRhymes(db, k, [{ word: "above", type: "perfect" }]);
    expect(getCachedRhymes(db, k)).toEqual([{ word: "above", type: "perfect" }]);
  });
});
