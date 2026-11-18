import { makeAutoObservable, runInAction } from "mobx";
import { dailyTasksStore } from "./dailyTasksStore";
import { regularTasksStore } from "./regularTasksStore";
import { notifyStore } from "./notifyStore";

type CleanupDomain = "regular" | "daily";

class SettingsStore {
  cleanupDomain: CleanupDomain | null = null;
  clearing = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get isBusy() {
    return this.clearing || regularTasksStore.loading || dailyTasksStore.isBusy;
  }

  get confirmationTitle() {
    return this.cleanupDomain === "daily"
      ? "Удалить все ежедневные задачи?"
      : "Удалить все обычные задачи?";
  }

  get confirmationMessage() {
    const message =
      this.cleanupDomain === "daily"
        ? "Все ежедневные задачи и подзадачи будут удалены за сегодня и на будущее. История прошедших дней и её результаты сохранятся. Отменить действие нельзя."
        : "Все обычные задачи и подзадачи будут удалены без возможности восстановления. Ежедневные задачи и их история сохранятся.";
    return this.error ? `${message}\n\n${this.error}` : message;
  }

  requestCleanup = (domain: CleanupDomain) => {
    if (this.isBusy) return;
    this.error = null;
    this.cleanupDomain = domain;
  };

  cancelCleanup = () => {
    if (this.clearing) return;
    this.cleanupDomain = null;
    this.error = null;
  };

  confirmCleanup = async () => {
    const domain = this.cleanupDomain;
    if (!domain || this.isBusy) return;
    this.clearing = true;
    this.error = null;
    try {
      if (domain === "daily") await dailyTasksStore.deleteAll();
      else await regularTasksStore.deleteAllTasks();
      runInAction(() => {
        this.cleanupDomain = null;
      });
      notifyStore.show({ message: "Задачи удалены", action: "success" });
    } catch (cause) {
      runInAction(() => {
        this.error =
          cause instanceof Error ? cause.message : "Не удалось удалить задачи";
      });
    } finally {
      runInAction(() => {
        this.clearing = false;
      });
    }
  };
}

export const settingsStore = new SettingsStore();
