import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveDailyDay,
  validateDailyTree,
} from "../src/utils/dailyHistory.ts";

const tree = {
  id: "root",
  title: "Original",
  note: "Note",
  status: "todo",
  children: [
    { id: "child", title: "Child", note: null, status: "todo", children: [] },
  ],
};
const schedule = {
  frequency: "weekly",
  startDate: "2026-01-01",
  anchorWeekStart: "2025-12-29",
  intervalWeeks: 1,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
};
const revision = {
  id: "v1",
  taskId: "root",
  effectiveFrom: "2026-01-01",
  schedule,
  tree,
};
const snapshot = {
  templates: [
    {
      id: "root",
      createdOn: "2026-01-01",
      deletedFrom: null,
      revisions: [revision],
    },
  ],
  occurrences: [],
};

test("unmaterialized historical days fail independently while today and future remain todo", () => {
  const past = resolveDailyDay(snapshot, "2026-01-02", "2026-01-10");
  assert.equal(past[0].tree.status, "failed");
  assert.equal(past[0].tree.children[0].status, "failed");
  assert.equal(
    resolveDailyDay(snapshot, "2026-01-10", "2026-01-10")[0].tree.status,
    "todo",
  );
  assert.equal(
    resolveDailyDay(snapshot, "2026-01-11", "2026-01-10")[0].tree.status,
    "todo",
  );
  assert.equal(tree.status, "todo");
  assert.equal(resolveDailyDay(snapshot, "2025-12-31", "2026-01-10").length, 0);
});

test("later revisions and logical deletion preserve unmaterialized history", () => {
  const revised = structuredClone(snapshot);
  revised.templates[0].revisions.push({
    ...revision,
    id: "v2",
    effectiveFrom: "2026-01-11",
    tree: { ...tree, title: "Updated", children: [] },
  });
  revised.templates[0].deletedFrom = "2026-01-13";
  assert.equal(
    resolveDailyDay(revised, "2026-01-10", "2026-01-15")[0].tree.title,
    "Original",
  );
  assert.equal(
    resolveDailyDay(revised, "2026-01-11", "2026-01-15")[0].tree.title,
    "Updated",
  );
  assert.equal(resolveDailyDay(revised, "2026-01-13", "2026-01-15").length, 0);
});

test("recorded occurrence content and excused outcomes survive rollover and edits", () => {
  const recorded = structuredClone(snapshot);
  recorded.occurrences.push({
    taskId: "root",
    revisionId: "v1",
    localDate: "2026-01-02",
    tree: {
      ...tree,
      status: "excused",
      children: [{ ...tree.children[0], status: "excused" }],
    },
  });
  const day = resolveDailyDay(recorded, "2026-01-02", "2026-02-01");
  assert.equal(day[0].tree.status, "excused");
  assert.equal(day[0].tree.children[0].status, "excused");
  assert.equal(
    resolveDailyDay(recorded, "2026-01-03", "2026-02-01")[0].tree.status,
    "failed",
  );
});

test("Daily rejects paused status, duplicate IDs and blank titles", () => {
  assert.throws(() => validateDailyTree({ ...tree, status: "paused" }));
  assert.throws(() =>
    validateDailyTree({ ...tree, children: [{ ...tree, children: [] }] }),
  );
  assert.throws(() => validateDailyTree({ ...tree, title: "   " }));
});
