import { makeAutoObservable, runInAction } from "mobx";
import type {
  DailySnapshot,
  DailyStatus,
  DailyTaskInput,
  DailyNodeFields,
  DailySchedule,
} from "../types/dailyTasks";
import { DailyTaskService } from "../services/dailyTaskService";
import { withDailyRepository } from "../services/dailyTasks";
import { currentDailyDate } from "../utils/dailyRecurrence";
import { resolveDailyDay } from "../utils/dailyHistory";
import { calculateDailyStreaks } from "../utils/dailyStreaks";

const service = new DailyTaskService(withDailyRepository, currentDailyDate);

class DailyTasksStore {
  snapshot: DailySnapshot = { templates: [], occurrences: [] };
  today = currentDailyDate();
  selectedDate = this.today;
  loading = false;
  busy = false;
  loaded = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
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

  selectDate = (date: string) => {
    this.selectedDate = date;
  };

  refreshClock = () => {
    const today = currentDailyDate();
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
      const snapshot = await service.load();
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

  create = (input: DailyTaskInput) => this.mutate(() => service.create(input));
  update = (id: string, input: DailyTaskInput) =>
    this.mutate(() => service.update(id, input));
  delete = (id: string) => this.mutate(() => service.delete(id));
  editNode = (
    taskId: string,
    nodeId: string,
    fields: DailyNodeFields,
    schedule?: DailySchedule,
  ) => this.mutate(() => service.editNode(taskId, nodeId, fields, schedule));
  addSubtask = (taskId: string, parentId: string, fields: DailyNodeFields) =>
    this.mutate(() => service.addSubtask(taskId, parentId, fields));
  deleteSubtask = (taskId: string, nodeId: string) =>
    this.mutate(() => service.deleteSubtask(taskId, nodeId));
  setStatus = (taskId: string, nodeId: string, status: DailyStatus) => {
    const date = this.selectedDate;
    return this.mutate(() => service.setStatus(taskId, nodeId, date, status));
  };
}

export const dailyTasksStore = new DailyTasksStore();
