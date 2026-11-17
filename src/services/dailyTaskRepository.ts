import type { DailyDatabase } from "../db/dailyDatabase";
import type {
  DailyOccurrence,
  DailySchedule,
  DailySnapshot,
  DailyTaskInput,
  DailyTemplate,
} from "../types/dailyTasks";
import { validateDailyTree, resetDailyTree } from "../utils/dailyHistory";
import {
  validateDailyDate,
  validateDailySchedule,
} from "../utils/dailyRecurrence";

export const createDailyId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

type TemplateRow = {
  id: string;
  created_on: string;
  deleted_from: string | null;
};
type RevisionRow = {
  id: string;
  task_id: string;
  effective_from: string;
  schedule_json: string;
  tree_json: string;
};
type OccurrenceRow = {
  task_id: string;
  local_date: string;
  revision_id: string;
  tree_json: string;
  status: string;
};

const parseSchedule = (json: string): DailySchedule => {
  const value: unknown = JSON.parse(json);
  if (
    typeof value !== "object" ||
    value === null ||
    !("startDate" in value) ||
    typeof value.startDate !== "string" ||
    !("frequency" in value)
  ) {
    throw new Error("Invalid stored Daily schedule");
  }
  let schedule: DailySchedule;
  if (
    value.frequency === "weekly" &&
    "daysOfWeek" in value &&
    Array.isArray(value.daysOfWeek) &&
    "intervalWeeks" in value &&
    typeof value.intervalWeeks === "number" &&
    "anchorWeekStart" in value &&
    typeof value.anchorWeekStart === "string"
  ) {
    // Validate each weekday before narrowing its numeric type.
    const daysOfWeek = value.daysOfWeek.map((day: unknown) => {
      if (
        day !== 0 &&
        day !== 1 &&
        day !== 2 &&
        day !== 3 &&
        day !== 4 &&
        day !== 5 &&
        day !== 6
      )
        throw new Error("Invalid stored weekday");
      return day;
    });
    schedule = {
      frequency: "weekly",
      startDate: value.startDate,
      anchorWeekStart: value.anchorWeekStart,
      intervalWeeks: value.intervalWeeks,
      daysOfWeek,
    };
  } else if (
    value.frequency === "monthly" &&
    "dayOfMonth" in value &&
    typeof value.dayOfMonth === "number"
  ) {
    schedule = {
      frequency: "monthly",
      startDate: value.startDate,
      dayOfMonth: value.dayOfMonth,
    };
  } else {
    throw new Error("Invalid stored Daily schedule");
  }
  validateDailySchedule(schedule);
  return schedule;
};

export class DailyTaskRepository {
  private readonly db: DailyDatabase;

  constructor(db: DailyDatabase) {
    this.db = db;
  }

  async readSnapshot(): Promise<DailySnapshot> {
    const tasks = await this.db.getAllAsync<TemplateRow>(
      "SELECT id, created_on, deleted_from FROM daily_tasks ORDER BY created_at, id",
    );
    const revisions = await this.db.getAllAsync<RevisionRow>(
      "SELECT * FROM daily_task_revisions ORDER BY effective_from",
    );
    const occurrences = await this.db.getAllAsync<OccurrenceRow>(
      "SELECT * FROM daily_task_occurrences ORDER BY local_date",
    );
    const templates: DailyTemplate[] = tasks.map((row) => ({
      id: row.id,
      createdOn: row.created_on,
      deletedFrom: row.deleted_from,
      revisions: [],
    }));
    const byId = new Map(templates.map((item) => [item.id, item]));
    for (const row of revisions) {
      const tree = validateDailyTree(JSON.parse(row.tree_json));
      if (tree.id !== row.task_id)
        throw new Error("Daily revision root mismatch");
      const template = byId.get(row.task_id);
      if (!template) throw new Error("Orphaned Daily revision");
      template.revisions.push({
        id: row.id,
        taskId: row.task_id,
        effectiveFrom: row.effective_from,
        schedule: parseSchedule(row.schedule_json),
        tree,
      });
    }
    return {
      templates,
      occurrences: occurrences.map((row) => {
        const tree = validateDailyTree(JSON.parse(row.tree_json));
        if (tree.id !== row.task_id || tree.status !== row.status)
          throw new Error("Daily occurrence status mismatch");
        return {
          taskId: row.task_id,
          localDate: row.local_date,
          revisionId: row.revision_id,
          tree,
        };
      }),
    };
  }

  async create(input: DailyTaskInput, createdOn: string): Promise<string> {
    validateDailyDate(createdOn);
    validateDailySchedule(input.schedule);
    const tree = resetDailyTree(validateDailyTree(input.tree));
    await this.db.runAsync(
      "INSERT INTO daily_tasks (id, created_on, created_at) VALUES (?, ?, ?)",
      tree.id,
      createdOn,
      Date.now(),
    );
    await this.writeRevision(tree.id, createdOn, { ...input, tree });
    return tree.id;
  }

  async writeRevision(
    taskId: string,
    effectiveFrom: string,
    input: DailyTaskInput,
  ): Promise<void> {
    validateDailyDate(effectiveFrom);
    validateDailySchedule(input.schedule);
    const tree = resetDailyTree(validateDailyTree(input.tree));
    if (tree.id !== taskId) throw new Error("Daily revision root mismatch");
    await this.db.runAsync(
      `INSERT INTO daily_task_revisions (id, task_id, effective_from, schedule_json, tree_json)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (task_id, effective_from) DO UPDATE SET schedule_json = excluded.schedule_json, tree_json = excluded.tree_json`,
      createDailyId(),
      taskId,
      effectiveFrom,
      JSON.stringify(input.schedule),
      JSON.stringify(tree),
    );
  }

  async endTemplate(taskId: string, deletedFrom: string): Promise<void> {
    validateDailyDate(deletedFrom);
    const result = await this.db.runAsync(
      "UPDATE daily_tasks SET deleted_from = ? WHERE id = ? AND deleted_from IS NULL",
      deletedFrom,
      taskId,
    );
    if (result.changes !== 1)
      throw new Error("Daily template is already deleted or missing");
  }

  async saveOccurrence(occurrence: DailyOccurrence): Promise<void> {
    validateDailyDate(occurrence.localDate);
    const tree = validateDailyTree(occurrence.tree);
    if (tree.id !== occurrence.taskId)
      throw new Error("Daily occurrence root mismatch");
    await this.db.runAsync(
      `INSERT INTO daily_task_occurrences (task_id, local_date, revision_id, tree_json, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (task_id, local_date) DO UPDATE SET tree_json = excluded.tree_json, status = excluded.status, updated_at = excluded.updated_at`,
      occurrence.taskId,
      occurrence.localDate,
      occurrence.revisionId,
      JSON.stringify(tree),
      tree.status,
      Date.now(),
    );
  }
}
