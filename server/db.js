import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

export function initDb(dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      invite_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      location TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS origins (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS check_stages (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      excluded_origin_ids TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS containers (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      origin_id TEXT,
      tag_ids TEXT NOT NULL DEFAULT '[]',
      container_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS item_checks (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      stage_id TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0,
      missing_count INTEGER NOT NULL DEFAULT 0,
      missing_reason TEXT NOT NULL DEFAULT '',
      checked_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_tags_event ON tags(event_id);
    CREATE INDEX IF NOT EXISTS idx_origins_event ON origins(event_id);
    CREATE INDEX IF NOT EXISTS idx_stages_event ON check_stages(event_id);
    CREATE INDEX IF NOT EXISTS idx_containers_event ON containers(event_id);
    CREATE INDEX IF NOT EXISTS idx_containers_code ON containers(code);
    CREATE INDEX IF NOT EXISTS idx_items_event ON items(event_id);
    CREATE INDEX IF NOT EXISTS idx_checks_item ON item_checks(item_id);
  `)

  return db
}

export function rowToEvent(row) {
  if (!row) return null
  return {
    id: row.id,
    inviteCode: row.invite_code,
    name: row.name,
    location: row.location ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function parseJsonArray(str) {
  try {
    const v = JSON.parse(str)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}