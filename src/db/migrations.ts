export const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'regular',
        status TEXT NOT NULL DEFAULT 'todo',
        note TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        recurrence TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        archived_at INTEGER
      );
    `,
  },
];
