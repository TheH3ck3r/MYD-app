import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import { migrateDatabase } from "../src/db/migrate.ts";
import { openTestDatabase } from "./sqliteAdapter.mjs";

const require = createRequire(import.meta.url);

// Replace only native/store adapters; execute the real service and MobX store.
const loadSource = (filename, dependencies) => {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(filename, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  const module = { exports: {} };
  const resolve = (name) =>
    name in dependencies ? dependencies[name] : require(name);
  new Function("require", "module", "exports", outputText)(
    resolve,
    module,
    module.exports,
  );
  return module.exports;
};

test("Regular cleanup removes nested and archived Regular rows and leaves Daily tables unchanged", async () => {
  const db = openTestDatabase();
  try {
    await migrateDatabase(db);
    await db.runAsync(
      "INSERT INTO tasks (id, title, created_at, updated_at) VALUES ('root', 'Regular', 1, 1)",
    );
    await db.runAsync(
      "INSERT INTO tasks (id, parent_id, title, created_at, updated_at) VALUES ('child', 'root', 'Child', 1, 1)",
    );
    await db.runAsync(
      "INSERT INTO tasks (id, title, archived_at, created_at, updated_at) VALUES ('archived', 'Archived', 2, 1, 1)",
    );
    await db.runAsync(
      "INSERT INTO daily_tasks (id, created_on, created_at) VALUES ('daily', '2026-01-01', 1)",
    );
    const before = await db.getAllAsync("SELECT * FROM daily_tasks");
    const service = loadSource("../src/services/tasks.ts", {
      "@/db/client": { getDb: async () => db },
    });
    await service.deleteAllRegularTasks();
    assert.deepEqual(await db.getAllAsync("SELECT * FROM tasks"), []);
    assert.deepEqual(await db.getAllAsync("SELECT * FROM daily_tasks"), before);
    assert.deepEqual(await db.getAllAsync("PRAGMA foreign_key_check"), []);
  } finally {
    db.close();
  }
});

const settingsFixture = () => {
  const calls = [];
  const regular = {
    loading: false,
    deleteAllTasks: async () => calls.push("regular"),
  };
  const daily = { isBusy: false, deleteAll: async () => calls.push("daily") };
  const { settingsStore: store } = loadSource(
    "../src/stores/settingsStore.ts",
    {
      "./regularTasksStore": { regularTasksStore: regular },
      "./dailyTasksStore": { dailyTasksStore: daily },
      "./notifyStore": { notifyStore: { show: () => calls.push("success") } },
    },
  );
  return { store, regular, daily, calls };
};

test("settings requires confirmation, supports cancellation and dispatches only the chosen domain", async () => {
  const { store, calls } = settingsFixture();
  await store.confirmCleanup();
  store.requestCleanup("daily");
  store.cancelCleanup();
  await store.confirmCleanup();
  assert.deepEqual(calls, []);
  store.requestCleanup("regular");
  await store.confirmCleanup();
  assert.deepEqual(calls, ["regular", "success"]);
  assert.equal(store.cleanupDomain, null);
  store.requestCleanup("daily");
  await store.confirmCleanup();
  assert.deepEqual(calls, ["regular", "success", "daily", "success"]);
});

test("settings blocks repeated confirmation during writes and keeps failure available for retry", async () => {
  const { store, daily, calls } = settingsFixture();
  let reject;
  daily.deleteAll = () =>
    new Promise((_, fail) => {
      reject = fail;
      calls.push("write");
    });
  store.requestCleanup("daily");
  const pending = store.confirmCleanup();
  store.cancelCleanup();
  await store.confirmCleanup();
  assert.equal(store.cleanupDomain, "daily");
  assert.deepEqual(calls, ["write"]);
  reject(new Error("Storage failure"));
  await pending;
  assert.equal(store.clearing, false);
  assert.equal(store.cleanupDomain, "daily");
  assert.match(store.confirmationMessage, /Storage failure/);
  daily.deleteAll = async () => calls.push("retry");
  await store.confirmCleanup();
  assert.deepEqual(calls, ["write", "retry", "success"]);
});
