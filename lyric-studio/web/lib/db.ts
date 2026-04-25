import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { runMigrations } from "./migrations";

const DB_PATH = path.resolve(process.cwd(), "..", "data", "data.db");
const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

declare global {
  // eslint-disable-next-line no-var
  var __lyric_studio_db: Database.Database | undefined;
}

function init(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__lyric_studio_db) {
    globalThis.__lyric_studio_db = init();
  }
  return globalThis.__lyric_studio_db;
}
