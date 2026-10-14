export type TaskStatus = "todo" | "done" | "failed" | "excused" | "paused";

export type TaskKind = "regular" | "recurring";

export type DayState = "perfect" | "soft" | "failed" | "empty" | "unmarked";

export type TaskActionContext = "regular" | "daily";

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

// export type RecurrenceRule =
//   | { frequency: 'daily';   interval: number; startsAt: number; endsAt: number | null }
//   | { frequency: 'weekly';  daysOfWeek: number[]; interval: number; startsAt: number; endsAt: number | null }
//   | { frequency: 'monthly'; dayOfMonth: number; interval: number; startsAt: number; endsAt: number | null };

// export type Completion = {
//   id: string;
//   taskId: string;
//   day: string;
//   status: TaskStatus;
//   note: string | null;
//   completedAt: number;
// };

// export type DaySummary = {
//   day: string;
//   scheduledCount: number;
//   doneCount: number;
//   failedCount: number;
//   excusedCount: number;
//   unmarkedCount: number;
//   state: DayState;
//   updatedAt: number;
// };
