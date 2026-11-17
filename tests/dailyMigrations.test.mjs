import assert from "node:assert/strict";
import { test } from "node:test";
import { MIGRATIONS } from "../src/db/migrations.ts";
import { migrateDatabase } from "../src/db/migrate.ts";
import { openTestDatabase } from "./sqliteAdapter.mjs";

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
      2,
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
