import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateDailyStreaks } from "../src/utils/dailyStreaks.ts";

const makeSnapshot = (days, daysOfWeek = [0, 1, 2, 3, 4, 5, 6]) => {
  const templates = ["a", "b"].map((id) => ({
    id,
    createdOn: "2026-01-01",
    deletedFrom: null,
    revisions: [
      {
        id: `v-${id}`,
        taskId: id,
        effectiveFrom: "2026-01-01",
        schedule: {
          frequency: "weekly",
          startDate: "2026-01-01",
          intervalWeeks: 1,
          daysOfWeek,
          anchorWeekStart: "2025-12-29",
        },
        tree: { id, title: id, note: null, status: "todo", children: [] },
      },
    ],
  }));
  const occurrences = days.flatMap((statuses, index) =>
    statuses.map((status, i) => {
      const template = templates[i];
      return {
        taskId: template.id,
        revisionId: template.revisions[0].id,
        localDate: `2026-01-${String(index + 1).padStart(2, "0")}`,
        tree: { ...template.revisions[0].tree, status },
      };
    }),
  );
  return { templates, occurrences };
};

test("Perfect and Active follow the complete root-outcome matrix", () => {
  for (const [statuses, expected] of [
    [["done", "done"], { perfect: 1, active: 1 }],
    [["done", "excused"], { perfect: 0, active: 1 }],
    [["excused", "excused"], { perfect: 0, active: 0 }],
    [["done", "failed"], { perfect: 0, active: 0 }],
    [["done", "todo"], { perfect: 0, active: 0 }],
  ]) {
    assert.deepEqual(
      calculateDailyStreaks(makeSnapshot([statuses]), "2026-01-02"),
      expected,
    );
  }
});

test("all-excused days bridge Active continuity without increasing count", () => {
  const snapshot = makeSnapshot([
    ["done", "done"],
    ["excused", "excused"],
    ["done", "done"],
  ]);
  assert.deepEqual(calculateDailyStreaks(snapshot, "2026-01-04"), {
    perfect: 1,
    active: 2,
  });
});

test("empty days preserve both streaks while today's outcomes are excluded", () => {
  // Thursday and Saturday are scheduled; Friday is neutral.
  const snapshot = makeSnapshot(
    [["done", "done"], [], ["done", "done"], ["failed", "failed"]],
    [4, 6],
  );
  assert.deepEqual(calculateDailyStreaks(snapshot, "2026-01-04"), {
    perfect: 2,
    active: 2,
  });
  assert.deepEqual(
    calculateDailyStreaks({ templates: [], occurrences: [] }, "2026-01-04"),
    { perfect: 0, active: 0 },
  );
});

test("unmaterialized closed-app dates break streaks and future starts do not count", () => {
  assert.deepEqual(
    calculateDailyStreaks(makeSnapshot([["done", "done"]]), "2026-01-03"),
    { perfect: 0, active: 0 },
  );
  assert.deepEqual(calculateDailyStreaks(makeSnapshot([]), "2025-12-31"), {
    perfect: 0,
    active: 0,
  });
});
