-- Phase 2: takes, settings, latency on projects.
ALTER TABLE projects ADD COLUMN latency_ms INTEGER;

CREATE TABLE IF NOT EXISTS takes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'lead',
  path TEXT NOT NULL,
  trim_start_ms INTEGER NOT NULL DEFAULT 0,
  trim_end_ms INTEGER NOT NULL DEFAULT 0,
  is_processed INTEGER NOT NULL DEFAULT 0,
  harmony_enabled INTEGER NOT NULL DEFAULT 0,
  pitch_correction INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_takes_project ON takes(project_id, created_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('latency_ms', '25');
