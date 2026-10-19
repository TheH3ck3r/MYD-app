import { makeAutoObservable, runInAction } from "mobx";
import {
  TaskFormState,
  TaskItem,
  TaskStatus,
  TaskStatusChange,
  TaskStatusChangeResult,
} from "@/types/tasks";
import * as tasksService from "@/services/tasks";

class TasksStore {
  tasks: TaskItem[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  // Публичные методы для работы с деревом

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
      this.tasks = this.addTaskToTree(this.tasks, parentId, {
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
      this.tasks = this.transformTree(this.tasks, id, (node) => ({
        ...node,
        title,
        note,
      }));
    });
  };

  deleteTask = async (id: string) => {
    await tasksService.deleteTask(id);

    runInAction(() => {
      this.tasks = this.transformTree(
        this.tasks,
        id,
        () => null,
        (parent, newChildren) => this.aggregate(parent, newChildren),
      );
    });
  };

  setTaskStatus = async (
    id: string,
    status: TaskStatus,
  ): Promise<TaskStatusChangeResult> => {
    const changes: TaskStatusChange[] = [];
    const newTree = this.transformTree(
      this.tasks,
      id,
      (node) => this.applyDown(node, status, changes, true),
      (parent, newChildren) => this.aggregate(parent, newChildren, changes),
    );

    runInAction(() => {
      this.tasks = newTree;
    });

    for (const change of changes) {
      await tasksService.updateTaskStatus(change.id, change.status);
    }

    return { tree: newTree, changes };
  };

  toggle = async (id: string): Promise<TaskStatusChangeResult> => {
    const task = this.findTask(id);
    if (!task) return { tree: this.tasks, changes: [] };
    const next: TaskStatus = task.status === "todo" ? "done" : "todo";
    return this.setTaskStatus(id, next);
  };

  // Внутренние методы для работы с деревом
  private addTaskToTree(
    tree: TaskItem[],
    parentId: string | null,
    input: { id: string; title: string; note: string | null },
  ): TaskItem[] {
    const newTask: TaskItem = { ...input, status: "todo", children: [] };
    if (parentId === null) return [...tree, newTask];
    return this.transformTree(tree, parentId, (parent) => ({
      ...parent,
      children: [...parent.children, newTask],
    }));
  }

  private transformTree(
    items: TaskItem[],
    id: string,
    transformer: (node: TaskItem) => TaskItem | null,
    onParentUpdate?: (parent: TaskItem, newChildren: TaskItem[]) => TaskItem,
  ): TaskItem[] {
    let anyChanged = false;
    const result: TaskItem[] = [];
    for (const item of items) {
      if (item.id === id) {
        const transformed = transformer(item);
        anyChanged = true;
        if (transformed !== null) result.push(transformed);
        continue;
      }
      if (item.children.length > 0) {
        const newChildren = this.transformTree(
          item.children,
          id,
          transformer,
          onParentUpdate,
        );
        if (newChildren !== item.children) {
          anyChanged = true;
          result.push(
            onParentUpdate
              ? onParentUpdate(item, newChildren)
              : { ...item, children: newChildren },
          );
          continue;
        }
      }
      result.push(item);
    }
    return anyChanged ? result : items;
  }

  private applyDown(
    item: TaskItem,
    status: TaskStatus,
    changes: TaskStatusChange[],
    isTarget: boolean,
  ): TaskItem {
    const shouldChange = isTarget ? true : item.status === "todo";
    let changed = shouldChange && item.status !== status;
    if (changed)
      changes.push({ id: item.id, title: item.title, status, auto: false });
    const newChildren = item.children.map((child) => {
      const updated = this.applyDown(child, status, changes, false);
      if (updated !== child) changed = true;
      return updated;
    });
    if (!changed) return item;
    return {
      ...item,
      status: shouldChange ? status : item.status,
      children: newChildren,
    };
  }

  private aggregate(
    item: TaskItem,
    newChildren: TaskItem[],
    changes?: TaskStatusChange[],
  ): TaskItem {
    if (newChildren.length === 0) return { ...item, children: newChildren };
    const first = newChildren[0].status;
    const allSame = newChildren.every((c) => c.status === first);
    const newStatus: TaskStatus = allSame ? first : "todo";
    if (newStatus !== item.status)
      changes?.push({
        id: item.id,
        title: item.title,
        status: newStatus,
        auto: true,
      });
    return { ...item, status: newStatus, children: newChildren };
  }

  private generateId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const tasksStore = new TasksStore();
