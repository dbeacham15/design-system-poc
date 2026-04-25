-- Phase 1 schema: projects, sections, rhyme cache, _migrations.
-- Phase 2 will add: takes, settings, voice fields on projects.

CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  ran_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'analyzing',  -- analyzing | drafting | analysis_failed | lyrics_done
  instrumental_path TEXT,
  bpm REAL,
  key TEXT,
  time_sig TEXT,
  duration_ms INTEGER,
  downbeat_offset_ms INTEGER,
  rms_envelope_json TEXT,
  energy_regions_json TEXT,
  genre TEXT NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bar_start INTEGER NOT NULL,
  bar_end INTEGER NOT NULL,
  lines_per_phrase INTEGER NOT NULL DEFAULT 2,
  notes TEXT,
  lines_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sections_project ON sections(project_id, bar_start);

CREATE TABLE IF NOT EXISTS rhyme_cache (
  key TEXT PRIMARY KEY,  -- e.g., "love|14|pop"
  json_result TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
