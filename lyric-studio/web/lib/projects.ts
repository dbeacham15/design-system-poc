import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

export type ProjectStatus = "analyzing" | "drafting" | "analysis_failed" | "lyrics_done";

export interface Project {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  status: ProjectStatus;
  instrumental_path: string | null;
  bpm: number | null;
  key: string | null;
  time_sig: string | null;
  duration_ms: number | null;
  downbeat_offset_ms: number | null;
  rms_envelope_json: string | null;
  energy_regions_json: string | null;
  genre: string;
  deleted_at: number | null;
}

export function createProject(db: Database.Database, input: { title: string; genre: string }): Project {
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO projects (id, title, created_at, updated_at, status, genre)
     VALUES (?, ?, ?, ?, 'analyzing', ?)`
  ).run(id, input.title, now, now, input.genre);
  return getProject(db, id)!;
}

export function getProject(db: Database.Database, id: string): Project | null {
  return (db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project) ?? null;
}

export function listProjects(db: Database.Database): Project[] {
  return db
    .prepare("SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC")
    .all() as Project[];
}

export function listTrash(db: Database.Database): Project[] {
  return db
    .prepare("SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")
    .all() as Project[];
}

export function softDeleteProject(db: Database.Database, id: string): void {
  db.prepare("UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?").run(
    Date.now(), Date.now(), id
  );
}

export function restoreProject(db: Database.Database, id: string): void {
  db.prepare("UPDATE projects SET deleted_at = NULL, updated_at = ? WHERE id = ?").run(
    Date.now(), id
  );
}

export function permanentlyDeleteProject(db: Database.Database, id: string): void {
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function updateProjectStatus(
  db: Database.Database,
  id: string,
  status: ProjectStatus
): void {
  db.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?").run(
    status, Date.now(), id
  );
}

export function updateProjectAnalysis(
  db: Database.Database,
  id: string,
  analysis: {
    bpm: number;
    key: string;
    time_sig: string;
    duration_ms: number;
    downbeat_offset_ms: number;
    rms_envelope: number[];
    energy_regions: unknown[];
    instrumental_path: string;
  }
): void {
  db.prepare(
    `UPDATE projects SET
      bpm = ?, key = ?, time_sig = ?, duration_ms = ?, downbeat_offset_ms = ?,
      rms_envelope_json = ?, energy_regions_json = ?, instrumental_path = ?,
      status = 'drafting', updated_at = ?
     WHERE id = ?`
  ).run(
    analysis.bpm, analysis.key, analysis.time_sig, analysis.duration_ms,
    analysis.downbeat_offset_ms, JSON.stringify(analysis.rms_envelope),
    JSON.stringify(analysis.energy_regions), analysis.instrumental_path,
    Date.now(), id
  );
}
