import { makeAutoObservable, runInAction } from "mobx";
import {
  TaskFormState,
  TaskItem,
  TaskStatus,
  TaskStatusChange,
  TaskStatusChangeResult,
} from "@/types/tasks";
import * as tasksService from "@/services/tasks";
import { notifyStore } from "./notifyStore";
import { taskTreeStore } from "./taskTreeStore";

class RegularTasksStore {
  tasks: TaskItem[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  loadTasks = async () => {
    this.loading = true;
    try {
      const data = await tasksService.getAllRegularTasks();
      runInAction(() => {
        this.tasks = data;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  findTask = (id: string): TaskItem | null => {
    const find = (items: TaskItem[]): TaskItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        const found = find(item.children);
        if (found) return found;
      }
      return null;
    };
    return find(this.tasks);
  };

  openTask = (openTaskId: string | null): TaskItem | null => {
    return openTaskId ? this.findTask(openTaskId) : null;
  };

  getFormTask = (formState: TaskFormState): TaskItem | null => {
    if (formState?.type !== "edit") return null;
    return this.findTask(formState.taskId);
  };

  createTask = async (
    parentId: string | null,
    input: { title: string; note?: string },
  ) => {
    const id = this.generateId();
    const title = input.title.trim();
    const note = input.note?.trim() || null;

    await tasksService.insertTask({ id, parentId, title, note });

    runInAction(() => {
      this.tasks = taskTreeStore.addTaskToTree(this.tasks, parentId, {
        id,
        title,
        note,
      });
    });
  };

  updateTask = async (id: string, input: { title: string; note?: string }) => {
    const title = input.title.trim();
    const note = input.note?.trim() || null;

    await tasksService.updateTaskFields(id, { title, note });

    runInAction(() => {
      this.tasks = taskTreeStore.transformTree(this.tasks, id, (node) => ({
        ...node,
        title,
        note,
      }));
    });
  };

  deleteTask = async (id: string) => {
    await tasksService.deleteTask(id);

    runInAction(() => {
      this.tasks = taskTreeStore.transformTree(
        this.tasks,
        id,
        () => null,
        (parent, newChildren) => taskTreeStore.aggregate(parent, newChildren),
      );
    });
  };

  setTaskStatus = async (
    id: string,
    status: TaskStatus,
  ): Promise<TaskStatusChangeResult> => {
    const changes: TaskStatusChange[] = [];
    const newTree = taskTreeStore.transformTree(
      this.tasks,
      id,
      (node) => taskTreeStore.applyDown(node, status, changes, true),
      (parent, newChildren) =>
        taskTreeStore.aggregate(parent, newChildren, changes),
    );

    runInAction(() => {
      this.tasks = newTree;
    });

    for (const change of changes) {
      await tasksService.updateTaskStatus(change.id, change.status);
    }

    this.notifyAutoChanges(changes);

    return { tree: newTree, changes };
  };

  toggle = async (id: string): Promise<TaskStatusChangeResult> => {
    const task = this.findTask(id);
    if (!task) return { tree: this.tasks, changes: [] };
    const next: TaskStatus = task.status === "todo" ? "done" : "todo";
    return this.setTaskStatus(id, next);
  };

  // Внутренние вспомогательные методы и уведомления

  private generateId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  private notifyAutoChanges = (changes: TaskStatusChange[]) => {
    const autoChanges = changes.filter((change) => change.auto);

    const textMap: Record<TaskStatus, string> = {
      done: "выполнена",
      failed: "провалена :(",
      excused: "пропущена",
      paused: "отложена",
      todo: "возвращена в работу",
    };

    const actionMap: Record<TaskStatus, any> = {
      done: "success",
      failed: "error",
      excused: "muted",
      paused: "muted",
      todo: "info",
    };

    autoChanges.forEach((change) => {
      notifyStore.show({
        message: `Задача "${change.title}" ${textMap[change.status]}`,
        action: actionMap[change.status],
      });
    });
  };
}

export const regularTasksStore = new RegularTasksStore();
