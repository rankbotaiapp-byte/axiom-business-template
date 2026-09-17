import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 5;

const V2_TABLES = `
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY NOT NULL,
  weekly_hours REAL NOT NULL,
  constraints TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS responsibilities (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  weekly_hours REAL NOT NULL,
  non_negotiable INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS visions (
  id TEXT PRIMARY KEY NOT NULL,
  statement TEXT NOT NULL,
  evidence TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'archived')),
  phase TEXT NOT NULL CHECK(phase IN ('foundation', 'capitalization')),
  created_at TEXT NOT NULL,
  archived_at TEXT
);
CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY NOT NULL,
  vision_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK(phase IN ('foundation', 'capitalization')),
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  action TEXT NOT NULL,
  evidence TEXT NOT NULL,
  hours REAL NOT NULL,
  principle TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'active', 'complete')),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  outcome TEXT,
  FOREIGN KEY (vision_id) REFERENCES visions(id)
);
CREATE TABLE IF NOT EXISTS portfolio (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  vision_id TEXT,
  step_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS thresholds (
  id TEXT PRIMARY KEY NOT NULL,
  vision_id TEXT NOT NULL,
  key TEXT NOT NULL,
  crossed_at TEXT NOT NULL,
  UNIQUE(vision_id, key)
);
`;

const V3_TABLES = `
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY NOT NULL,
  standard_accepted INTEGER NOT NULL DEFAULT 0,
  standard_accepted_at TEXT
);
CREATE TABLE IF NOT EXISTS intake (
  id TEXT PRIMARY KEY NOT NULL,
  omitted_responsibilities TEXT NOT NULL,
  actual_hours_note TEXT NOT NULL,
  competing_goals TEXT NOT NULL,
  completed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS competing_goals (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  weekly_hours REAL NOT NULL,
  created_at TEXT NOT NULL
);
`;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = result?.user_version ?? 0;
  if (current >= DATABASE_VERSION) {
    return;
  }

  if (current === 0) {
    try {
      await db.execAsync(`PRAGMA journal_mode = 'wal';`);
    } catch {
      // WAL is unavailable on some web builds; continue with the default journal.
    }
    current = 1;
  }

  if (current === 1) {
    await db.execAsync(V2_TABLES);
    current = 2;
  }

  if (current === 2) {
    await db.execAsync(`
CREATE TABLE IF NOT EXISTS portfolio_v3 (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  vision_id TEXT,
  step_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
INSERT INTO portfolio_v3 SELECT id, kind, vision_id, step_id, title, body, created_at FROM portfolio;
DROP TABLE portfolio;
ALTER TABLE portfolio_v3 RENAME TO portfolio;
`);
    await db.execAsync(V3_TABLES);
    await addColumn(db, 'visions', 'plan_locked', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn(db, 'visions', 'plan_locked_at', 'TEXT');
    await addColumn(db, 'steps', 'due_at', 'TEXT');
    await addColumn(db, 'steps', 'activated_at', 'TEXT');
    await addColumn(db, 'steps', 'last_miss_at', 'TEXT');
    current = 3;
  }

  if (current === 3) {
    await addColumn(db, 'settings', 'begin_completed', 'INTEGER NOT NULL DEFAULT 0');
    current = 4;
  }

  if (current === 4) {
    await addColumn(db, 'visions', 'route', `TEXT NOT NULL DEFAULT 'necessary'`);
    current = 5;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function addColumn(
  db: SQLiteDatabase,
  table: string,
  column: string,
  spec: string
): Promise<void> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (rows.some((row) => row.name === column)) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${spec}`);
}
