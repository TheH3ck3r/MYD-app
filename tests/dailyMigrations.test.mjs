import assert from "node:assert/strict";
import { test } from "node:test";
import { MIGRATIONS } from "../src/db/migrations.ts";
import { migrateDatabase } from "../src/db/migrate.ts";
import { openTestDatabase } from "./sqliteAdapter.mjs";

test("v3 adds same-day deletion without changing v2 schedules, history or Regular rows", async () => {
  const db = openTestDatabase();
  try {
    await db.execAsync(MIGRATIONS[0].sql);
    await db.execAsync(MIGRATIONS[1].sql);
    await db.execAsync("PRAGMA user_version = 2");
    await db.runAsync(
      "INSERT INTO daily_tasks VALUES ('root', '2026-01-01', '2026-01-05', 1)",
    );
    await db.runAsync(
      "INSERT INTO daily_task_revisions VALUES ('revision', 'root', '2026-01-01', '{}', '{}')",
    );
    await db.runAsync(
      "INSERT INTO daily_task_occurrences VALUES ('root', '2026-01-02', 'revision', '{}', 'done', 1)",
    );
    await db.runAsync(
      "INSERT INTO tasks (id, title, created_at, updated_at) VALUES ('regular', 'Keep', 1, 1)",
    );
    const tables = ["daily_task_revisions", "daily_task_occurrences", "tasks"];
    const before = await Promise.all(
      tables.map((table) => db.getAllAsync(`SELECT * FROM ${table}`)),
    );
    await migrateDatabase(db);
    await migrateDatabase(db);
    assert.deepEqual(
      await Promise.all(
        tables.map((table) => db.getAllAsync(`SELECT * FROM ${table}`)),
      ),
      before,
    );
    assert.deepEqual(
      { ...(await db.getFirstAsync("SELECT * FROM daily_tasks")) },
      {
        id: "root",
        created_on: "2026-01-01",
        deleted_from: "2026-01-05",
        created_at: 1,
        stopped_from: null,
      },
    );
    await db.runAsync("UPDATE daily_tasks SET stopped_from = '2026-01-01'");
    await assert.rejects(
      db.runAsync("UPDATE daily_tasks SET stopped_from = '2025-12-31'"),
    );
    assert.deepEqual(await db.getAllAsync("PRAGMA foreign_key_check"), []);
  } finally {
    db.close();
  }
});

test("legacy database migration preserves Regular data and runs once", async () => {
  const db = openTestDatabase();
  try {
    await db.execAsync(MIGRATIONS[0].sql);
    await db.runAsync(
      "INSERT INTO tasks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
      "regular",
      "Keep me",
      1,
      2,
    );
    await db.runAsync(
      "INSERT INTO tasks (id, parent_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      "child",
      "regular",
      "Child",
      1,
      2,
    );
    const before = await db.getAllAsync("SELECT * FROM tasks ORDER BY id");
    await migrateDatabase(db);
    await migrateDatabase(db);
    assert.deepEqual(
      await db.getAllAsync("SELECT * FROM tasks ORDER BY id"),
      before,
    );
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      3,
    );
    assert.deepEqual(await db.getAllAsync("PRAGMA foreign_key_check"), []);
    await db.runAsync("DELETE FROM tasks WHERE id = ?", "regular");
    assert.equal((await db.getAllAsync("SELECT * FROM tasks")).length, 0);
  } finally {
    db.close();
  }
});

test("failed migration rolls back schema and version atomically", async () => {
  const db = openTestDatabase();
  try {
    await db.execAsync(MIGRATIONS[0].sql);
    await db.execAsync("CREATE TABLE daily_task_revisions (existing TEXT)");
    await assert.rejects(migrateDatabase(db));
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      0,
    );
    assert.equal(
      await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE name = 'daily_tasks'",
      ),
      null,
    );
    assert.ok(
      await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE name = 'tasks'",
      ),
    );
  } finally {
    db.close();
  }
});

test("newer databases are rejected without changing version", async () => {
  const db = openTestDatabase();
  try {
    await db.execAsync("PRAGMA user_version = 99");
    await assert.rejects(migrateDatabase(db), /newer version/);
    assert.equal(
      (await db.getFirstAsync("PRAGMA user_version")).user_version,
      99,
    );
  } finally {
    db.close();
  }
});
