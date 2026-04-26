import type Database from "better-sqlite3";

export interface RhymeResult {
  word: string;
  type: "perfect" | "slant";
}

export function cacheKey(word: string, budget: number, genre: string): string {
  return `${word.toLowerCase()}|${budget}|${genre}`;
}

export function getCachedRhymes(db: Database.Database, key: string): RhymeResult[] | null {
  const row = db.prepare("SELECT json_result FROM rhyme_cache WHERE key = ?").get(key) as { json_result: string } | undefined;
  return row ? JSON.parse(row.json_result) : null;
}

export function setCachedRhymes(db: Database.Database, key: string, results: RhymeResult[]): void {
  db.prepare(
    "INSERT OR REPLACE INTO rhyme_cache (key, json_result, created_at) VALUES (?, ?, ?)"
  ).run(key, JSON.stringify(results), Date.now());
}
