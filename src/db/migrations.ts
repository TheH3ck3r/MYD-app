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
  {
    version: 2,
    sql: `
      CREATE TABLE daily_tasks (
        id TEXT PRIMARY KEY,
        created_on TEXT NOT NULL CHECK (length(created_on) = 10),
        deleted_from TEXT CHECK (deleted_from IS NULL OR deleted_from > created_on),
        created_at INTEGER NOT NULL
      );
      CREATE TABLE daily_task_revisions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES daily_tasks(id) ON DELETE RESTRICT,
        effective_from TEXT NOT NULL CHECK (length(effective_from) = 10),
        schedule_json TEXT NOT NULL CHECK (json_valid(schedule_json)),
        tree_json TEXT NOT NULL CHECK (json_valid(tree_json)),
        UNIQUE (task_id, effective_from),
        UNIQUE (task_id, id)
      );
      CREATE TABLE daily_task_occurrences (
        task_id TEXT NOT NULL REFERENCES daily_tasks(id) ON DELETE RESTRICT,
        local_date TEXT NOT NULL CHECK (length(local_date) = 10),
        revision_id TEXT NOT NULL,
        tree_json TEXT NOT NULL CHECK (json_valid(tree_json)),
        status TEXT NOT NULL CHECK (status IN ('todo', 'done', 'failed', 'excused')),
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (task_id, local_date),
        FOREIGN KEY (task_id, revision_id)
          REFERENCES daily_task_revisions(task_id, id) ON DELETE RESTRICT
      );
      CREATE INDEX daily_occurrences_date ON daily_task_occurrences(local_date);
    `,
  },
  {
    version: 3,
    sql: `
      ALTER TABLE daily_tasks ADD COLUMN stopped_from TEXT
        CHECK (stopped_from IS NULL OR
          (length(stopped_from) = 10 AND stopped_from >= created_on));
    `,
  },
];
