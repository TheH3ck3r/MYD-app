import assert from "node:assert/strict";
import { test } from "node:test";
import { migrateDatabase } from "../src/db/migrate.ts";
import { DailyTaskRepository } from "../src/services/dailyTaskRepository.ts";
import { DailyTaskService } from "../src/services/dailyTaskService.ts";
import { resolveDailyDay } from "../src/utils/dailyHistory.ts";
import { openTestDatabase } from "./sqliteAdapter.mjs";

const initial = () => ({
  schedule: {
    frequency: "weekly",
    startDate: "2026-01-01",
    anchorWeekStart: "2025-12-29",
    intervalWeeks: 1,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  tree: {
    id: "root",
    title: "Original",
    note: "Original note",
    status: "todo",
    children: [
      { id: "child", title: "Child", note: null, status: "todo", children: [] },
    ],
  },
});

const fixture = async () => {
  const db = openTestDatabase();
  await migrateDatabase(db);
  let date = "2026-01-01";
  const run = async (work) => {
    await db.execAsync("BEGIN IMMEDIATE");
    try {
      const result = await work(new DailyTaskRepository(db));
      await db.execAsync("COMMIT");
      return result;
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
  };
  return {
    db,
    service: new DailyTaskService(run, () => date),
    setDate(value) {
      date = value;
    },
  };
};

test("subtask edits use tomorrow's revision without changing today's outcomes or siblings", async () => {
  const { db, service, setDate } = await fixture();
  try {
    await service.create(initial());
    setDate("2026-01-10");
    await service.setStatus("root", "child", "2026-01-10", "done");
    const added = await service.addSubtask("root", "child", {
      title: "Nested",
      note: "Nested note",
    });
    const nested =
      added.templates[0].revisions.at(-1).tree.children[0].children[0];
    await service.editNode("root", "child", {
      title: "Renamed child",
      note: "Changed note",
    });
    const renamed = await service.editNode("root", nested.id, {
      title: "Renamed nested",
      note: "",
    });
    const today = resolveDailyDay(renamed, "2026-01-10", "2026-01-10")[0].tree;
    assert.equal(today.children[0].title, "Child");
    assert.equal(today.children[0].status, "done");
    assert.equal(today.children[0].children.length, 0);
    const tomorrow = resolveDailyDay(renamed, "2026-01-11", "2026-01-10")[0]
      .tree;
    assert.equal(tomorrow.children[0].title, "Renamed child");
    assert.equal(tomorrow.children[0].children[0].title, "Renamed nested");
    assert.equal(tomorrow.children[0].children[0].note, null);
    assert.equal(tomorrow.children[0].status, "todo");
    assert.equal(renamed.templates[0].revisions.length, 2);
    assert.equal(
      resolveDailyDay(renamed, "2026-01-09", "2026-01-10")[0].tree.children[0]
        .title,
      "Child",
    );
  } finally {
    db.close();
  }
});

test("root schedule editing moves the entire pending tree and retains earlier subtask edits", async () => {
  const { db, service, setDate } = await fixture();
  try {
    await service.create(initial());
    setDate("2026-01-10");
    await service.addSubtask("root", "root", {
      title: "Second child",
      note: "",
    });
    const schedule = {
      frequency: "monthly",
      startDate: "2026-01-01",
      dayOfMonth: 12,
    };
    await service.editNode(
      "root",
      "root",
      { title: "New root", note: "New root note" },
      schedule,
    );
    const snapshot = await service.editNode("root", "child", {
      title: "New child",
      note: "",
    });
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-10", "2026-01-10")[0].tree.title,
      "Original",
    );
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-11", "2026-01-10").length,
      0,
    );
    const day = resolveDailyDay(snapshot, "2026-01-12", "2026-01-10")[0];
    assert.deepEqual(day.schedule, schedule);
    assert.equal(day.tree.title, "New root");
    assert.deepEqual(
      day.tree.children.map((node) => node.title),
      ["New child", "Second child"],
    );
    assert.equal(
      day.tree.children.every((node) => !("schedule" in node)),
      true,
    );
    await assert.rejects(
      service.editNode("root", "child", { title: "Child", note: "" }, schedule),
      /только у родительской/,
    );
  } finally {
    db.close();
  }
});

test("deleting a subtask removes only its future subtree, retaining root schedule and historical content", async () => {
  const { db, service, setDate } = await fixture();
  try {
    const input = initial();
    input.tree.children[0].children.push({
      id: "nested",
      title: "Nested",
      note: null,
      status: "todo",
      children: [],
    });
    input.tree.children.push({
      id: "sibling",
      title: "Sibling",
      note: null,
      status: "todo",
      children: [],
    });
    await service.create(input);
    setDate("2026-01-10");
    const snapshot = await service.deleteSubtask("root", "child");
    const today = resolveDailyDay(snapshot, "2026-01-10", "2026-01-10")[0];
    const tomorrow = resolveDailyDay(snapshot, "2026-01-11", "2026-01-10")[0];
    assert.equal(today.tree.children[0].children[0].id, "nested");
    assert.deepEqual(
      tomorrow.tree.children.map((node) => node.id),
      ["sibling"],
    );
    assert.deepEqual(tomorrow.schedule, input.schedule);
    assert.equal(snapshot.templates[0].deletedFrom, null);
    const beforeInvalidEdit = await service.load();
    await assert.rejects(
      service.addSubtask("root", "child", { title: "Orphan", note: "" }),
      /уже удалена/,
    );
    await assert.rejects(
      service.editNode("root", "child", { title: "Deleted", note: "" }),
      /уже удалена/,
    );
    await assert.rejects(service.deleteSubtask("root", "root"), /корневой/);
    assert.deepEqual(await service.load(), beforeInvalidEdit);
  } finally {
    db.close();
  }
});

test("a failed subtask revision rolls back preservation writes and never touches Regular data", async () => {
  const { db, service } = await fixture();
  try {
    await service.create(initial());
    await db.runAsync(
      "INSERT INTO tasks (id, title, created_at, updated_at) VALUES ('regular', 'Keep', 1, 1)",
    );
    const before = await service.load();
    const regular = await db.getAllAsync("SELECT * FROM tasks");
    await db.execAsync(
      "CREATE TRIGGER fail_tree_edit BEFORE INSERT ON daily_task_revisions BEGIN SELECT RAISE(ABORT, 'Test tree failure'); END",
    );
    await assert.rejects(
      service.addSubtask("root", "child", { title: "Nested", note: "" }),
      /Test tree failure/,
    );
    assert.deepEqual(await service.load(), before);
    assert.deepEqual(await db.getAllAsync("SELECT * FROM tasks"), regular);
  } finally {
    db.close();
  }
});

test("structural edits reject blank titles and edits of deleted repetitions", async () => {
  const { db, service } = await fixture();
  try {
    await service.create(initial());
    await assert.rejects(
      service.addSubtask("root", "root", { title: "   ", note: "" }),
      /название/,
    );
    await assert.rejects(
      service.editNode("root", "child", { title: "", note: "" }),
      /название/,
    );
    assert.equal((await service.load()).occurrences.length, 0);
    await service.delete("root");
    await assert.rejects(
      service.editNode("root", "child", { title: "Changed", note: "" }),
      /уже удалено/,
    );
    await assert.rejects(
      service.addSubtask("root", "root", { title: "New", note: "" }),
      /уже удалено/,
    );
    await assert.rejects(service.deleteSubtask("root", "child"), /уже удалено/);
  } finally {
    db.close();
  }
});

test("editing before any occurrence preserves today and unmaterialized past content", async () => {
  const { db, service, setDate } = await fixture();
  try {
    const input = initial();
    await service.create(input);
    setDate("2026-01-10");
    const updated = {
      ...input,
      schedule: {
        frequency: "monthly",
        startDate: "2026-01-01",
        dayOfMonth: 11,
      },
      tree: { ...input.tree, title: "Changed", note: "New note", children: [] },
    };
    const snapshot = await service.update("root", updated);
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-02", "2026-01-10")[0].tree.title,
      "Original",
    );
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-02", "2026-01-10")[0].tree.status,
      "failed",
    );
    const today = resolveDailyDay(snapshot, "2026-01-10", "2026-01-10")[0];
    assert.equal(today.tree.title, "Original");
    assert.equal(today.tree.children.length, 1);
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-11", "2026-01-10")[0].tree.title,
      "Changed",
    );
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-12", "2026-01-10").length,
      0,
    );
    assert.equal(snapshot.occurrences.length, 1);
    await service.setStatus("root", "child", "2026-01-10", "done");
    setDate("2026-01-11");
    const next = await service.load();
    assert.equal(
      resolveDailyDay(next, "2026-01-10", "2026-01-11")[0].tree.status,
      "done",
    );
    assert.equal(
      resolveDailyDay(next, "2026-01-11", "2026-01-11")[0].tree.status,
      "todo",
    );
  } finally {
    db.close();
  }
});

test("deletion before any occurrence preserves today, history, and today's status operations", async () => {
  const { db, service, setDate } = await fixture();
  try {
    await service.create(initial());
    setDate("2026-01-10");
    const snapshot = await service.delete("root");
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-09", "2026-01-10")[0].tree.status,
      "failed",
    );
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-10", "2026-01-10")[0].tree.title,
      "Original",
    );
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-11", "2026-01-10").length,
      0,
    );
    const marked = await service.setStatus(
      "root",
      "root",
      "2026-01-10",
      "excused",
    );
    assert.equal(marked.occurrences[0].tree.status, "excused");
    assert.equal(marked.occurrences[0].tree.children[0].status, "excused");
    setDate("2026-01-12");
    const reopened = await service.load();
    assert.equal(reopened.occurrences[0].tree.status, "excused");
    await assert.rejects(
      service.setStatus("root", "root", "2026-01-12", "done"),
    );
  } finally {
    db.close();
  }
});

test("failed revision write rolls back today's snapshot and leaves Regular unchanged", async () => {
  const { db, service } = await fixture();
  try {
    await db.runAsync(
      "INSERT INTO tasks (id, title, created_at, updated_at) VALUES ('regular', 'Keep', 1, 1)",
    );
    const regular = await db.getAllAsync("SELECT * FROM tasks");
    await service.create(initial());
    await db.execAsync(
      "CREATE TRIGGER fail_revision BEFORE INSERT ON daily_task_revisions BEGIN SELECT RAISE(ABORT, 'Test write failure'); END;",
    );
    await assert.rejects(
      service.update("root", initial()),
      /Test write failure/,
    );
    const snapshot = await service.load();
    assert.equal(snapshot.occurrences.length, 0);
    assert.equal(snapshot.templates[0].revisions.length, 1);
    assert.deepEqual(await db.getAllAsync("SELECT * FROM tasks"), regular);
  } finally {
    db.close();
  }
});

test("validation and history read-only boundaries reject invalid writes atomically", async () => {
  const { db, service, setDate } = await fixture();
  try {
    await assert.rejects(
      service.create({
        ...initial(),
        schedule: { ...initial().schedule, daysOfWeek: [] },
      }),
    );
    await assert.rejects(
      service.create({ ...initial(), tree: { ...initial().tree, title: "" } }),
    );
    assert.equal((await service.load()).templates.length, 0);
    await service.create(initial());
    await assert.rejects(
      service.setStatus("root", "root", "2026-01-01", "paused"),
    );
    await assert.rejects(
      service.setStatus("root", "root", "2026-01-02", "done"),
    );
    setDate("2026-01-02");
    await assert.rejects(
      service.setStatus("root", "root", "2026-01-01", "done"),
    );
    assert.equal((await service.load()).occurrences.length, 0);
  } finally {
    db.close();
  }
});

test("clock rollback cannot edit a template into already recorded history", async () => {
  const { db, service, setDate } = await fixture();
  try {
    await service.create(initial());
    setDate("2026-01-10");
    await service.setStatus("root", "root", "2026-01-10", "done");
    setDate("2026-01-05");
    await assert.rejects(service.update("root", initial()), /Дата устройства/);
    await assert.rejects(service.delete("root"), /Дата устройства/);
    assert.equal((await service.load()).templates[0].deletedFrom, null);
  } finally {
    db.close();
  }
});

test("rollover persists todo failures while future views never create occurrences", async () => {
  const { db, service, setDate } = await fixture();
  try {
    await service.create(initial());
    await service.setStatus("root", "child", "2026-01-01", "done");
    await service.setStatus("root", "root", "2026-01-01", "todo");
    setDate("2026-01-03");
    const snapshot = await service.load();
    assert.equal(snapshot.occurrences[0].tree.status, "failed");
    assert.equal(snapshot.occurrences[0].tree.children[0].status, "done");
    resolveDailyDay(snapshot, "2030-01-01", "2026-01-03");
    assert.equal((await service.load()).occurrences.length, 1);
    assert.equal(
      resolveDailyDay(snapshot, "2026-01-02", "2026-01-03")[0].tree.status,
      "failed",
    );
  } finally {
    db.close();
  }
});
