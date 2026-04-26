import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export interface Take {
  id: string;
  project_id: string;
  kind: string;
  path: string;
  trim_start_ms: number;
  trim_end_ms: number;
  is_processed: number;
  harmony_enabled: number;
  pitch_correction: number;
  created_at: number;
}

export function createTake(
  db: Database.Database,
  input: { project_id: string; path: string; kind?: string }
): Take {
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO takes (id, project_id, kind, path, trim_start_ms, trim_end_ms,
      is_processed, harmony_enabled, pitch_correction, created_at)
     VALUES (?, ?, ?, ?, 0, 0, 0, 0, 1, ?)`
  ).run(id, input.project_id, input.kind ?? "lead", input.path, now);
  return getTake(db, id)!;
}

export function getTake(db: Database.Database, id: string): Take | null {
  return (db.prepare("SELECT * FROM takes WHERE id = ?").get(id) as Take) ?? null;
}

export function listTakes(db: Database.Database, project_id: string): Take[] {
  return db
    .prepare("SELECT * FROM takes WHERE project_id = ? ORDER BY created_at ASC")
    .all(project_id) as Take[];
}

export function updateTake(
  db: Database.Database,
  id: string,
  updates: Partial<
    Pick<Take, "trim_start_ms" | "trim_end_ms" | "is_processed" | "harmony_enabled" | "pitch_correction">
  >
): Take | null {
  const fields = Object.keys(updates) as (keyof typeof updates)[];
  if (fields.length === 0) return getTake(db, id);
  const sets = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => updates[f]);
  db.prepare(`UPDATE takes SET ${sets} WHERE id = ?`).run(...values, id);
  return getTake(db, id);
}

export function deleteTake(db: Database.Database, id: string): void {
  db.prepare("DELETE FROM takes WHERE id = ?").run(id);
}
