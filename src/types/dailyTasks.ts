/** A local calendar date in YYYY-MM-DD format, validated at runtime. */
export type DailyLocalDate = string;

/** JavaScript weekday numbering: Sunday = 0, Monday = 1. */
export type DailyWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DailyStatus = "todo" | "done" | "failed" | "excused";

export type DailyNodeFields = { title: string; note: string };

export type DailyTaskNode = {
  id: string;
  title: string;
  note: string | null;
  status: DailyStatus;
  children: DailyTaskNode[];
};

export type DailyRevision = {
  id: string;
  taskId: string;
  effectiveFrom: DailyLocalDate;
  schedule: DailySchedule;
  tree: DailyTaskNode;
};

export type DailyTemplate = {
  id: string;
  createdOn: DailyLocalDate;
  deletedFrom: DailyLocalDate | null;
  revisions: DailyRevision[];
};

export type DailyOccurrence = {
  taskId: string;
  localDate: DailyLocalDate;
  revisionId: string;
  tree: DailyTaskNode;
};

export type DailySnapshot = {
  templates: DailyTemplate[];
  occurrences: DailyOccurrence[];
};

export type DailyTaskInput = {
  schedule: DailySchedule;
  tree: DailyTaskNode;
};

export type DailyDayTask = DailyOccurrence & {
  schedule: DailySchedule;
};

export type DailyTaskTarget = { taskId: string; nodeId: string };

export type DailyOpenedTask = DailyTaskTarget & { template?: boolean };

export type DailyTaskFormState =
  | { mode: "create"; input: DailyTaskInput }
  | {
      mode: "edit";
      taskId: string;
      nodeId: string;
      fields: DailyNodeFields;
      schedule?: DailySchedule;
      parentTitle: string;
    }
  | { mode: "add"; taskId: string; parentId: string; parentTitle: string };

export type DailyTaskFormData = {
  title: string;
  initialValues: DailyNodeFields;
  schedule?: DailySchedule;
  parentTitle?: string;
  creating: boolean;
  editingExisting: boolean;
};

export type DailyTaskNotice =
  "template" | "history" | "deletedTemplate" | "deletedNode";

export type DailyTaskDetails = {
  task: DailyTaskNode | null;
  readOnly: boolean;
  statusReadOnly: boolean;
  actionsAvailable: boolean;
  notice: DailyTaskNotice | null;
};

export type DailyTemplateListItem = {
  taskId: string;
  tree: DailyTaskNode;
  schedule: DailySchedule;
  effectiveFrom: DailyLocalDate;
};

export type DailyDateMode = "today" | "history" | "future";
export type DailyCalendarDayState = DailyStatus | "empty";

export type DailySchedule = {
  startDate: DailyLocalDate;
} & (
  | {
      frequency: "weekly";
      daysOfWeek: readonly DailyWeekday[];
      intervalWeeks: number;
      /** Monday of a reference week; independent of the scheduling start date. */
      anchorWeekStart: DailyLocalDate;
    }
  | {
      frequency: "monthly";
      dayOfMonth: number;
    }
);
