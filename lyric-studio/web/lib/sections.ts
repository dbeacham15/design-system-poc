import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export interface Section {
  id: string;
  project_id: string;
  name: string;
  bar_start: number;
  bar_end: number;
  lines_per_phrase: number;
  notes: string | null;
  lines_json: string;
  created_at: number;
  updated_at: number;
}

export function listSections(db: Database.Database, projectId: string): Section[] {
  return db
    .prepare("SELECT * FROM sections WHERE project_id = ? ORDER BY bar_start ASC")
    .all(projectId) as Section[];
}

export function getSection(db: Database.Database, id: string): Section | null {
  return (db.prepare("SELECT * FROM sections WHERE id = ?").get(id) as Section) ?? null;
}

export function validateSectionPlacement(
  db: Database.Database,
  projectId: string,
  bar_start: number,
  bar_end: number,
  excludeId: string | null
): "ok" | "overlap" | "invalid" {
  if (bar_end <= bar_start) return "invalid";
  const others = listSections(db, projectId);
  for (const s of others) {
    if (s.id === excludeId) continue;
    if (bar_start < s.bar_end && bar_end > s.bar_start) return "overlap";
  }
  return "ok";
}

export function createSection(
  db: Database.Database,
  input: { project_id: string; name: string; bar_start: number; bar_end: number; lines_per_phrase?: number }
): Section {
  const placement = validateSectionPlacement(db, input.project_id, input.bar_start, input.bar_end, null);
  if (placement !== "ok") throw new Error(`section placement ${placement}`);

  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO sections (id, project_id, name, bar_start, bar_end, lines_per_phrase, lines_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?)`
  ).run(
    id, input.project_id, input.name, input.bar_start, input.bar_end,
    input.lines_per_phrase ?? 2, now, now
  );
  return getSection(db, id)!;
}

export function updateSection(
  db: Database.Database,
  id: string,
  patch: Partial<Pick<Section, "name" | "bar_start" | "bar_end" | "lines_per_phrase" | "notes" | "lines_json">>
): Section {
  const existing = getSection(db, id);
  if (!existing) throw new Error("not found");

  if (patch.bar_start !== undefined || patch.bar_end !== undefined) {
    const newStart = patch.bar_start ?? existing.bar_start;
    const newEnd = patch.bar_end ?? existing.bar_end;
    const placement = validateSectionPlacement(db, existing.project_id, newStart, newEnd, id);
    if (placement !== "ok") throw new Error(`section placement ${placement}`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const k of ["name", "bar_start", "bar_end", "lines_per_phrase", "notes", "lines_json"] as const) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(patch[k]);
    }
  }
  if (fields.length === 0) return existing;
  fields.push("updated_at = ?");
  values.push(Date.now(), id);
  db.prepare(`UPDATE sections SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getSection(db, id)!;
}

export function deleteSection(db: Database.Database, id: string): void {
  db.prepare("DELETE FROM sections WHERE id = ?").run(id);
}
