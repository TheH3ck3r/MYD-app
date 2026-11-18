import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { autorun } from "mobx";
import { DailyTasksStore } from "../src/stores/dailyTasksStore.ts";

const makeSnapshot = () => {
  const tree = {
    id: "root",
    title: "Today root",
    note: "Root note",
    status: "todo",
    children: [
      {
        id: "child",
        title: "Today child",
        note: null,
        status: "todo",
        children: [],
      },
    ],
  };
  const schedule = {
    frequency: "weekly",
    startDate: "2026-01-01",
    anchorWeekStart: "2025-12-29",
    intervalWeeks: 1,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  };
  return {
    templates: [
      {
        id: "root",
        createdOn: "2026-01-01",
        deletedFrom: null,
        revisions: [
          {
            id: "v1",
            taskId: "root",
            effectiveFrom: "2026-01-01",
            schedule,
            tree,
          },
          {
            id: "v2",
            taskId: "root",
            effectiveFrom: "2026-01-11",
            schedule,
            tree: {
              ...tree,
              title: "Tomorrow root",
              children: [{ ...tree.children[0], title: "Tomorrow child" }],
            },
          },
        ],
      },
    ],
    occurrences: [
      {
        taskId: "root",
        revisionId: "v1",
        localDate: "2026-01-10",
        tree: {
          ...tree,
          status: "done",
          children: [{ ...tree.children[0], status: "done" }],
        },
      },
    ],
  };
};

const fixture = (snapshot = makeSnapshot()) => {
  const state = { snapshot, date: "2026-01-10", failure: null };
  const calls = [];
  const service = Object.fromEntries(
    [
      "load",
      "create",
      "update",
      "delete",
      "deleteAll",
      "editNode",
      "addSubtask",
      "deleteSubtask",
      "setStatus",
    ].map((name) => [
      name,
      async (...args) => {
        calls.push({ name, args });
        if (state.failure) throw state.failure;
        return structuredClone(state.snapshot);
      },
    ]),
  );
  const listeners = new Set();
  const source = {
    currentState: "active",
    addEventListener(event, listener) {
      assert.equal(event, "change");
      listeners.add(listener);
      return {
        remove() {
          listeners.delete(listener);
        },
      };
    },
  };
  const store = new DailyTasksStore(
    service,
    () => state.date,
    async () => source,
  );
  return { store, service, state, calls, source, listeners };
};

test("store selects occurrence content separately from pending template and prepares node-specific forms", async () => {
  const { store } = fixture();
  await store.load();
  const target = { taskId: "root", nodeId: "child" };
  assert.equal(store.getTaskDetails(target).task.title, "Today child");
  assert.equal(
    store.getTaskDetails({ ...target, template: true }).task.title,
    "Tomorrow child",
  );
  assert.equal(
    store.getTaskDetails({ ...target, template: true }).statusReadOnly,
    true,
  );
  assert.equal(store.templateItems[0].tree.title, "Tomorrow root");
  assert.equal(store.completedCount, 1);

  const form = store.getEditForm(target);
  assert.equal(form.fields.title, "Tomorrow child");
  assert.equal(form.schedule, undefined);
  assert.equal(store.getFormData(form).parentTitle, "Tomorrow root");
  assert.equal(store.getFormData(form).editingExisting, true);
  assert.equal(
    store.getEditForm({ taskId: "root", nodeId: "root" }).schedule.frequency,
    "weekly",
  );
  assert.equal(store.getSubtaskForm(target).parentId, "child");
  assert.equal(store.getEditForm({ taskId: "root", nodeId: "missing" }), null);
});

test("deleted future nodes retain today's marks but lose structural actions", async () => {
  const snapshot = makeSnapshot();
  snapshot.templates[0].revisions[1].tree.children = [];
  const { store } = fixture(snapshot);
  await store.load();
  const target = { taskId: "root", nodeId: "child" };
  assert.equal(store.getTaskDetails(target).task.status, "done");
  assert.equal(store.getTaskDetails(target).notice, "deletedNode");
  assert.equal(store.getTaskDetails(target).actionsAvailable, false);
  assert.equal(store.getSubtaskForm(target), null);

  const deleted = makeSnapshot();
  deleted.templates[0].deletedFrom = "2026-01-11";
  const other = fixture(deleted).store;
  await other.load();
  assert.equal(other.getTaskDetails(target).notice, "deletedTemplate");
  assert.equal(other.getEditForm(target), null);
});

test("calendar indicators, date modes and empty days come from store outcomes", async () => {
  const { store } = fixture();
  await store.load();
  assert.equal(store.getDayState("2025-12-31"), "empty");
  assert.equal(store.getDayState("2026-01-09"), "failed");
  assert.equal(store.getDayState("2026-01-10"), "done");
  assert.equal(store.getDayState("2026-01-11"), "todo");
  store.selectDate("2026-01-09");
  assert.equal(store.dateMode, "history");
  assert.equal(store.readOnly, true);
  assert.equal(
    store.getTaskDetails({ taskId: "root", nodeId: "child" }).notice,
    "history",
  );
  store.selectDate("2026-01-11");
  assert.equal(store.dateMode, "future");
  store.selectDate("2026-01-10");
  assert.equal(store.dateMode, "today");
});

test("form dispatch preserves creation identity and routes nested edits without giving children schedules", async () => {
  const { store, calls, state } = fixture();
  await store.load();
  state.date = "2026-01-12";
  const create = store.getCreateForm();
  assert.equal(create.input.schedule.startDate, state.date);
  assert.equal(create.input.schedule.anchorWeekStart, "2026-01-12");
  assert.equal(store.getFormData(create).creating, true);
  const fields = { title: "New task", note: "" };
  await store.submitForm(create, fields, create.input.schedule);
  const creation = calls.at(-1);
  assert.equal(creation.name, "create");
  assert.equal(creation.args[0].tree.id, create.input.tree.id);
  assert.equal(creation.args[0].tree.note, null);
  const target = { taskId: "root", nodeId: "child" };
  await store.submitForm(store.getSubtaskForm(target), fields);
  assert.deepEqual(calls.at(-1), {
    name: "addSubtask",
    args: ["root", "child", fields],
  });
  await store.submitForm(store.getEditForm(target), fields);
  assert.deepEqual(calls.at(-1), {
    name: "editNode",
    args: ["root", "child", fields, undefined],
  });
  await assert.rejects(store.submitForm(create, fields), /расписание/);
});

test("status and deletion handlers route by target and reject read-only or invalid status actions", async () => {
  const { store, calls } = fixture();
  await store.load();
  const target = { taskId: "root", nodeId: "child" };
  assert.equal(await store.updateTaskStatus(target, "excused"), true);
  assert.deepEqual(calls.at(-1), {
    name: "setStatus",
    args: ["root", "child", "2026-01-10", "excused"],
  });
  const count = calls.length;
  assert.equal(await store.updateTaskStatus(target, "paused"), false);
  assert.equal(
    await store.updateTaskStatus({ ...target, template: true }, "done"),
    false,
  );
  store.selectDate("2026-01-09");
  assert.equal(await store.updateTaskStatus(target, "done"), false);
  assert.equal(calls.length, count);
  store.selectDate("2026-01-10");
  await store.toggleTask("root", "child");
  assert.equal(calls.at(-1).args.at(-1), "todo");
  await store.deleteTarget(target);
  assert.deepEqual(calls.at(-1), {
    name: "deleteSubtask",
    args: ["root", "child"],
  });
  await store.deleteTarget({ taskId: "root", nodeId: "root" });
  assert.deepEqual(calls.at(-1), { name: "delete", args: ["root"] });
  assert.equal(store.getDeleteConfirmation(target).title, "Удалить подзадачу?");
});

test("failed saves propagate to the form, preserve state, and expose errors to status/delete UI", async () => {
  const { store, state } = fixture();
  await store.load();
  const before = JSON.stringify(store.snapshot);
  const target = { taskId: "root", nodeId: "child" };
  state.failure = new Error("Write failed");
  await assert.rejects(
    store.submitForm(store.getEditForm(target), { title: "Changed", note: "" }),
    /Write failed/,
  );
  assert.equal(store.error, "Write failed");
  assert.equal(store.isBusy, false);
  assert.equal(JSON.stringify(store.snapshot), before);
  assert.equal(await store.updateTaskStatus(target, "done"), false);
  await store.deleteTarget(target);
  assert.equal(store.error, "Write failed");
  assert.equal(JSON.stringify(store.snapshot), before);
});

test("task detail selectors remain reactive after replacing the committed snapshot", async () => {
  const { store, state } = fixture();
  await store.load();
  const titles = [];
  const stop = autorun(() =>
    titles.push(
      store.getTaskDetails({ taskId: "root", nodeId: "child" }).task.title,
    ),
  );
  state.snapshot.occurrences[0].tree.children[0].title = "Committed change";
  await store.load();
  stop();
  assert.deepEqual(titles, ["Today child", "Committed change"]);
});

test("foreground watcher follows today on resume, preserves historical selection, and cleans up", async (context) => {
  context.mock.timers.enable({ apis: ["setInterval"] });
  const { store, state, calls, source, listeners } = fixture();
  const stop = store.watchForeground();
  try {
    await setImmediate();
    assert.equal(listeners.size, 1);
    state.date = "2026-01-11";
    context.mock.timers.tick(30_000);
    await setImmediate();
    assert.equal(store.today, "2026-01-11");
    assert.equal(store.selectedDate, "2026-01-11");
    store.selectDate("2026-01-09");
    state.date = "2026-01-12";
    for (const listener of listeners) listener("active");
    await setImmediate();
    assert.equal(store.today, "2026-01-12");
    assert.equal(store.selectedDate, "2026-01-09");
    source.currentState = "background";
    state.date = "2026-01-13";
    const count = calls.length;
    context.mock.timers.tick(30_000);
    await setImmediate();
    assert.equal(calls.length, count);
  } finally {
    stop();
  }
  assert.equal(listeners.size, 0);
  const count = calls.length;
  context.mock.timers.tick(30_000);
  await setImmediate();
  assert.equal(calls.length, count);
});

test("unfocused watcher does not attach a late native subscription", async () => {
  const { store, listeners } = fixture();
  const stop = store.watchForeground();
  stop();
  await setImmediate();
  assert.equal(listeners.size, 0);
});
