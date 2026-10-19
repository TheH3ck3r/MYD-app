export type TaskStatus = "todo" | "done" | "failed" | "excused" | "paused";

export type TaskKind = "regular" | "recurring";

export type DayState = "perfect" | "soft" | "failed" | "empty" | "unmarked";

export type TaskActionContext = "regular" | "daily";

export type TaskFormSheetMode = "create" | "edit";

export type TaskFormState =
  | { type: "create"; parentId: string | null }
  | { type: "edit"; taskId: string }
  | null;

export type Task = {
  id: string;
  parentId: string | null;
  title: string;
  kind: TaskKind;
  position: number;
  createdAt: number;
  updatedAt: number;
  archivedAt: number | null;
  note: string | null;
};

export type TaskItem = {
  id: string;
  title: string;
  note: string | null;
  status: TaskStatus;
  children: TaskItem[];
};

export type TaskStatusChange = {
  id: string;
  title: string;
  status: TaskStatus;
  /** true — родитель подстроился автоматически */
  auto: boolean;
};

export type TaskStatusChangeResult = {
  tree: TaskItem[];
  changes: TaskStatusChange[];
};

// daysOfWeek — числа в JS-конвенции: 0 = вс, 1 = пн, ..., 6 = сб.
export type Recurrence =
  { frequency: "daily" } | { frequency: "weekly"; daysOfWeek: number[] };
