import { makeAutoObservable, runInAction } from "mobx";
import type {
  DailySnapshot,
  DailyStatus,
  DailyTaskInput,
  DailyNodeFields,
  DailySchedule,
  DailyOpenedTask,
  DailyTaskTarget,
  DailyTaskFormState,
  DailyTaskFormData,
  DailyTaskDetails,
  DailyTemplateListItem,
  DailyCalendarDayState,
  DailyDateMode,
} from "../types/dailyTasks";
import type { TaskStatus } from "../types/tasks";
import { DailyTaskService } from "../services/dailyTaskService";
import { createDailyId } from "../services/dailyTaskRepository";
import { currentDailyDate, dailyAnchorWeek } from "../utils/dailyRecurrence";
import { isDailyStatus, resolveDailyDay } from "../utils/dailyHistory";
import { findDailyNode } from "../utils/dailyStatus";
import { calculateDailyStreaks } from "../utils/dailyStreaks";

// Native persistence is loaded on demand; the store can be tested independently.
const service = new DailyTaskService(async (work) => {
  const { withDailyRepository } = await import("../services/dailyTasks");
  return withDailyRepository(work);
}, currentDailyDate);

type DailyStoreService = Pick<
  DailyTaskService,
  | "load"
  | "create"
  | "update"
  | "deleteAll"
  | "delete"
  | "editNode"
  | "addSubtask"
  | "deleteSubtask"
  | "setStatus"
>;

interface DailyForegroundSource {
  readonly currentState: string | null;
  addEventListener(
    event: "change",
    listener: (state: string) => void,
  ): { remove(): void };
}

export class DailyTasksStore {
  snapshot: DailySnapshot = { templates: [], occurrences: [] };
  today: string;
  selectedDate: string;
  loading = false;
  busy = false;
  loaded = false;
  error: string | null = null;

  private readonly service: DailyStoreService;
  private readonly currentDate: () => string;
  private readonly getForeground: () => Promise<DailyForegroundSource>;

  constructor(
    taskService: DailyStoreService = service,
    currentDate: () => string = currentDailyDate,
    getForeground: () => Promise<DailyForegroundSource> = async () =>
      (await import("react-native")).AppState,
  ) {
    this.service = taskService;
    this.currentDate = currentDate;
    this.getForeground = getForeground;
    this.today = currentDate();
    this.selectedDate = this.today;
    makeAutoObservable<this, "service" | "currentDate" | "getForeground">(
      this,
      { service: false, currentDate: false, getForeground: false },
    );
  }

  get tasks() {
    return resolveDailyDay(this.snapshot, this.selectedDate, this.today);
  }

  get streaks() {
    return calculateDailyStreaks(this.snapshot, this.today);
  }

  get templates() {
    return this.snapshot.templates.filter((item) => item.deletedFrom === null);
  }

  get isBusy() {
    return this.busy || this.loading;
  }

  get readOnly() {
    return this.selectedDate !== this.today;
  }

  get dateMode(): DailyDateMode {
    return !this.readOnly
      ? "today"
      : this.selectedDate < this.today
        ? "history"
        : "future";
  }

  get completedCount() {
    return this.tasks.filter((task) => task.tree.status === "done").length;
  }

  get templateItems(): DailyTemplateListItem[] {
    return this.templates.flatMap((template) => {
      const revision = template.revisions[template.revisions.length - 1];
      return revision
        ? [
            {
              taskId: template.id,
              tree: revision.tree,
              schedule: revision.schedule,
              effectiveFrom: revision.effectiveFrom,
            },
          ]
        : [];
    });
  }

  getDayState = (date: string): DailyCalendarDayState => {
    const tasks = resolveDailyDay(this.snapshot, date, this.today);
    if (!tasks.length) return "empty";
    if (tasks.every((task) => task.tree.status === "done")) return "done";
    if (tasks.some((task) => task.tree.status === "failed")) return "failed";
    if (tasks.every((task) => task.tree.status === "excused")) return "excused";
    return "todo";
  };

  getTaskDetails = (opened: DailyOpenedTask | null): DailyTaskDetails => {
    const template = this.snapshot.templates.find(
      (item) => item.id === opened?.taskId,
    );
    const revision = template?.revisions[template.revisions.length - 1];
    const tree = opened?.template
      ? revision?.tree
      : this.tasks.find((item) => item.taskId === opened?.taskId)?.tree;
    const task = tree && opened ? findDailyNode(tree, opened.nodeId) : null;
    const futureNode =
      revision && opened ? findDailyNode(revision.tree, opened.nodeId) : null;
    return {
      task,
      readOnly: this.readOnly && !opened?.template,
      statusReadOnly: !!opened?.template,
      actionsAvailable: !!futureNode && !template?.deletedFrom,
      notice: !opened
        ? null
        : opened.template
          ? "template"
          : this.readOnly
            ? "history"
            : template?.deletedFrom
              ? "deletedTemplate"
              : !futureNode
                ? "deletedNode"
                : null,
    };
  };

  getCreateForm = (): DailyTaskFormState => {
    const today = this.currentDate();
    return {
      mode: "create",
      input: {
        schedule: {
          frequency: "weekly",
          startDate: today,
          anchorWeekStart: dailyAnchorWeek(today),
          intervalWeeks: 1,
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        },
        tree: {
          id: createDailyId(),
          title: "",
          note: null,
          status: "todo",
          children: [],
        },
      },
    };
  };

  getEditForm = (target: DailyTaskTarget | null): DailyTaskFormState | null => {
    if (!target) return null;
    const template = this.templates.find((item) => item.id === target.taskId);
    const revision = template?.revisions[template.revisions.length - 1];
    const node = revision ? findDailyNode(revision.tree, target.nodeId) : null;
    if (!revision || !node) return null;
    return {
      mode: "edit",
      ...target,
      fields: { title: node.title, note: node.note ?? "" },
      schedule: target.nodeId === target.taskId ? revision.schedule : undefined,
      parentTitle: revision.tree.title,
    };
  };

  getSubtaskForm = (
    target: DailyTaskTarget | null,
  ): DailyTaskFormState | null => {
    const form = this.getEditForm(target);
    return form?.mode === "edit"
      ? {
          mode: "add",
          taskId: form.taskId,
          parentId: form.nodeId,
          parentTitle: form.parentTitle,
        }
      : null;
  };

  getFormData = (form: DailyTaskFormState): DailyTaskFormData => ({
    title:
      form.mode === "create"
        ? "Новая задача"
        : form.mode === "add"
          ? "Новая подзадача"
          : "Редактировать задачу",
    initialValues: form.mode === "edit" ? form.fields : { title: "", note: "" },
    schedule:
      form.mode === "create"
        ? form.input.schedule
        : form.mode === "edit"
          ? form.schedule
          : undefined,
    parentTitle: form.mode === "create" ? undefined : form.parentTitle,
    creating: form.mode !== "edit",
    editingExisting: form.mode !== "create",
  });

  getDeleteConfirmation = (target: DailyTaskTarget | null) => {
    const root = !target || target.nodeId === target.taskId;
    return {
      title: root ? "Удалить повторение?" : "Удалить подзадачу?",
      message: root
        ? "Задача и её подзадачи будут удалены за сегодня и на будущие дни. История прошедших дней сохранится."
        : "Подзадача и её вложенные подзадачи будут удалены за сегодня и на будущие дни. История прошедших дней сохранится. Расписание родителя не изменится.",
    };
  };

  selectDate = (date: string) => {
    this.selectedDate = date;
  };

  refreshClock = () => {
    const today = this.currentDate();
    const followedToday = this.selectedDate === this.today;
    this.today = today;
    if (followedToday) this.selectedDate = today;
  };

  load = async () => {
    if (this.loading || this.busy) return;
    this.refreshClock();
    this.loading = true;
    this.error = null;
    try {
      const snapshot = await this.service.load();
      runInAction(() => {
        this.snapshot = snapshot;
        this.loaded = true;
      });
    } catch (cause) {
      runInAction(() => {
        this.error =
          cause instanceof Error ? cause.message : "Не удалось загрузить Daily";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  private mutate = async (operation: () => Promise<DailySnapshot>) => {
    if (this.busy || this.loading)
      throw new Error("Дождитесь завершения текущей операции");
    this.refreshClock();
    this.busy = true;
    this.error = null;
    try {
      const snapshot = await operation();
      runInAction(() => {
        this.snapshot = snapshot;
      });
    } catch (cause) {
      runInAction(() => {
        this.error =
          cause instanceof Error
            ? cause.message
            : "Не удалось сохранить изменения";
      });
      throw cause;
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  };

  create = (input: DailyTaskInput) =>
    this.mutate(() => this.service.create(input));
  update = (id: string, input: DailyTaskInput) =>
    this.mutate(() => this.service.update(id, input));
  deleteAll = () => this.mutate(() => this.service.deleteAll());
  delete = (id: string) => this.mutate(() => this.service.delete(id));
  editNode = (
    taskId: string,
    nodeId: string,
    fields: DailyNodeFields,
    schedule?: DailySchedule,
  ) =>
    this.mutate(() => this.service.editNode(taskId, nodeId, fields, schedule));
  addSubtask = (taskId: string, parentId: string, fields: DailyNodeFields) =>
    this.mutate(() => this.service.addSubtask(taskId, parentId, fields));
  deleteSubtask = (taskId: string, nodeId: string) =>
    this.mutate(() => this.service.deleteSubtask(taskId, nodeId));
  setStatus = (taskId: string, nodeId: string, status: DailyStatus) => {
    const date = this.selectedDate;
    return this.mutate(() =>
      this.service.setStatus(taskId, nodeId, date, status),
    );
  };

  submitForm = async (
    form: DailyTaskFormState,
    fields: DailyNodeFields,
    schedule?: DailySchedule,
  ) => {
    if (form.mode === "create") {
      if (!schedule) throw new Error("Укажите расписание задачи");
      await this.create({
        schedule,
        tree: {
          ...form.input.tree,
          title: fields.title,
          note: fields.note || null,
        },
      });
    } else if (form.mode === "add") {
      await this.addSubtask(form.taskId, form.parentId, fields);
    } else {
      await this.editNode(form.taskId, form.nodeId, fields, schedule);
    }
  };

  updateTaskStatus = async (
    target: DailyOpenedTask | null,
    status: TaskStatus,
  ): Promise<boolean> => {
    if (!target || target.template || this.readOnly || !isDailyStatus(status))
      return false;
    try {
      await this.setStatus(target.taskId, target.nodeId, status);
      return true;
    } catch {
      return false;
    }
  };

  toggleTask = async (taskId: string, nodeId: string) => {
    if (this.readOnly) return;
    const tree = this.tasks.find((item) => item.taskId === taskId)?.tree;
    const node = tree ? findDailyNode(tree, nodeId) : null;
    if (node)
      await this.updateTaskStatus(
        { taskId, nodeId },
        node.status === "todo" ? "done" : "todo",
      );
  };

  deleteTarget = async (target: DailyTaskTarget) => {
    try {
      if (target.nodeId === target.taskId) await this.delete(target.taskId);
      else await this.deleteSubtask(target.taskId, target.nodeId);
    } catch {
      /* Mutation errors are already published through this.error. */
    }
  };

  watchForeground = (): (() => void) => {
    let disposed = false;
    let subscription: { remove(): void } | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    void this.load();
    void this.getForeground()
      .then((source) => {
        if (disposed) return;
        subscription = source.addEventListener("change", (state) => {
          if (state === "active") void this.load();
        });
        timer = setInterval(() => {
          if (
            source.currentState === "active" &&
            this.currentDate() !== this.today
          )
            void this.load();
        }, 30_000);
      })
      .catch((cause: unknown) => {
        if (!disposed)
          runInAction(() => {
            this.error =
              cause instanceof Error
                ? cause.message
                : "Не удалось отслеживать смену дня";
          });
      });
    return () => {
      disposed = true;
      subscription?.remove();
      if (timer !== undefined) clearInterval(timer);
    };
  };
}

export const dailyTasksStore = new DailyTasksStore();
