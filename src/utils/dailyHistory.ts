import type {
  DailyDayTask,
  DailyRevision,
  DailySnapshot,
  DailyStatus,
  DailyTaskNode,
  DailyTemplate,
} from "../types/dailyTasks";
import { isDailyScheduledOn, validateDailyDate } from "./dailyRecurrence";

export const isDailyStatus = (value: unknown): value is DailyStatus =>
  value === "todo" ||
  value === "done" ||
  value === "failed" ||
  value === "excused";

export const validateDailyTree = (value: unknown): DailyTaskNode => {
  const ids = new Set<string>();
  const visit = (node: unknown): DailyTaskNode => {
    if (typeof node !== "object" || node === null) {
      throw new Error("Invalid Daily task tree");
    }
    if (
      !("id" in node) ||
      typeof node.id !== "string" ||
      !node.id ||
      ids.has(node.id) ||
      !("title" in node) ||
      typeof node.title !== "string" ||
      !node.title.trim() ||
      !("note" in node) ||
      (node.note !== null && typeof node.note !== "string") ||
      !("status" in node) ||
      !isDailyStatus(node.status) ||
      !("children" in node) ||
      !Array.isArray(node.children)
    ) {
      throw new Error("Invalid Daily task fields or duplicate node ID");
    }
    ids.add(node.id);
    return {
      id: node.id,
      title: node.title.trim(),
      note: node.note?.trim() || null,
      status: node.status,
      children: node.children.map(visit),
    };
  };
  return visit(value);
};

export const resetDailyTree = (tree: DailyTaskNode): DailyTaskNode => ({
  ...tree,
  status: "todo",
  children: tree.children.map(resetDailyTree),
});

export const finalizeDailyTree = (tree: DailyTaskNode): DailyTaskNode => ({
  ...tree,
  status: tree.status === "todo" ? "failed" : tree.status,
  children: tree.children.map(finalizeDailyTree),
});

export const dailyRevisionOn = (
  template: DailyTemplate,
  date: string,
): DailyRevision | null => {
  if (
    date < template.createdOn ||
    (template.deletedFrom && date >= template.deletedFrom)
  ) {
    return null;
  }
  let selected: DailyRevision | null = null;
  for (const revision of template.revisions) {
    if (
      revision.effectiveFrom <= date &&
      (!selected || revision.effectiveFrom > selected.effectiveFrom)
    ) {
      selected = revision;
    }
  }
  return selected;
};

export const resolveDailyDay = (
  snapshot: DailySnapshot,
  date: string,
  today: string,
): DailyDayTask[] => {
  validateDailyDate(date);
  validateDailyDate(today);
  const occurrences = new Map(
    snapshot.occurrences
      .filter((item) => item.localDate === date)
      .map((item) => [item.taskId, item]),
  );
  const result: DailyDayTask[] = [];
  for (const template of snapshot.templates) {
    const recorded = occurrences.get(template.id);
    const revision = recorded
      ? template.revisions.find((item) => item.id === recorded.revisionId)
      : dailyRevisionOn(template, date);
    if (!revision) continue;
    if (!recorded && !isDailyScheduledOn(revision.schedule, date)) continue;
    const tree = recorded?.tree ?? resetDailyTree(revision.tree);
    result.push({
      taskId: template.id,
      localDate: date,
      revisionId: revision.id,
      schedule: revision.schedule,
      tree: date < today ? finalizeDailyTree(tree) : tree,
    });
  }
  return result;
};
