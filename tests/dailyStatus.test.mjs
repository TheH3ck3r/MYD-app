import assert from "node:assert/strict";
import { test } from "node:test";
import { changeDailyStatus } from "../src/utils/dailyStatus.ts";
import { finalizeDailyTree } from "../src/utils/dailyHistory.ts";

const node = (id, status = "todo", children = []) => ({
  id,
  title: id,
  note: null,
  status,
  children,
});

test("Daily parent aggregates identical children and mixed outcomes become todo", () => {
  const tree = node("root", "todo", [node("a"), node("b")]);
  const first = changeDailyStatus(tree, "a", "done");
  assert.equal(first.status, "todo");
  const allDone = changeDailyStatus(first, "b", "done");
  assert.equal(allDone.status, "done");
  assert.equal(changeDailyStatus(allDone, "b", "excused").status, "todo");
  assert.equal(
    finalizeDailyTree(changeDailyStatus(allDone, "b", "excused")).status,
    "failed",
  );
  assert.equal(tree.children[0].status, "todo");
});

test("manual Daily parent change only propagates to todo descendants", () => {
  const tree = node("root", "todo", [
    node("a"),
    node("b", "failed"),
    node("c", "excused"),
    node("d", "done", [node("nested")]),
  ]);
  const changed = changeDailyStatus(tree, "root", "done");
  assert.deepEqual(
    changed.children.map((item) => item.status),
    ["done", "failed", "excused", "done"],
  );
  assert.equal(changed.children[3].children[0].status, "done");
  assert.equal(changed.status, "done");
});

test("nested aggregation reaches the root, and paused is rejected", () => {
  const tree = node("root", "todo", [node("parent", "todo", [node("leaf")])]);
  assert.equal(changeDailyStatus(tree, "leaf", "excused").status, "excused");
  assert.throws(() => changeDailyStatus(tree, "root", "paused"));
  assert.throws(() => changeDailyStatus(tree, "missing", "done"));
});
