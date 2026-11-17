import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrateDatabase } from "../src/db/migrate.ts";
import { DailyTaskRepository } from "../src/services/dailyTaskRepository.ts";
import { openTestDatabase } from "./sqliteAdapter.mjs";

const input = {
  schedule: { frequency: "monthly", startDate: "2026-01-01", dayOfMonth: 31 },
  tree: {
    id: "root",
    title: "Original",
    note: null,
    status: "todo",
    children: [],
  },
};

test("revision history, unique occurrences and statuses survive reopening", async () => {
  const directory = mkdtempSync(join(tmpdir(), "myd-daily-test-"));
  const filename = join(directory, "test.db");
  let db = openTestDatabase(filename);
  try {
    await migrateDatabase(db);
    let repository = new DailyTaskRepository(db);
    await repository.create(input, "2026-01-01");
    const initial = await repository.readSnapshot();
    const revisionId = initial.templates[0].revisions[0].id;
    const occurrence = {
      taskId: "root",
      localDate: "2026-01-31",
      revisionId,
      tree: { ...input.tree, status: "done" },
    };
    await repository.saveOccurrence(occurrence);
    await repository.saveOccurrence(occurrence);
    await repository.writeRevision("root", "2026-02-01", {
      ...input,
      tree: { ...input.tree, title: "New title" },
    });
    await repository.writeRevision("root", "2026-02-01", {
      ...input,
      tree: { ...input.tree, title: "Final title" },
    });
    await repository.endTemplate("root", "2026-02-02");
    db.close();
    db = openTestDatabase(filename);
    repository = new DailyTaskRepository(db);
    const restored = await repository.readSnapshot();
    assert.equal(restored.occurrences.length, 1);
    assert.equal(restored.occurrences[0].tree.title, "Original");
    assert.equal(restored.occurrences[0].tree.status, "done");
    assert.equal(restored.templates[0].revisions.length, 2);
    assert.equal(restored.templates[0].revisions[1].tree.title, "Final title");
    assert.equal(restored.templates[0].deletedFrom, "2026-02-02");
    await assert.rejects(
      db.runAsync("DELETE FROM daily_tasks WHERE id = ?", "root"),
      /FOREIGN KEY/,
    );
    await assert.rejects(
      db.runAsync("UPDATE daily_task_occurrences SET status = 'paused'"),
      /CHECK/,
    );
    await assert.rejects(
      repository.saveOccurrence({
        ...occurrence,
        tree: { ...input.tree, status: "paused" },
      }),
    );
    await assert.rejects(
      repository.saveOccurrence({
        ...occurrence,
        localDate: "2026-02-01",
        revisionId: "missing",
      }),
      /FOREIGN KEY/,
    );
    assert.deepEqual(await db.getAllAsync("PRAGMA foreign_key_check"), []);
  } finally {
    db.close();
    rmSync(directory, { recursive: true });
  }
});
