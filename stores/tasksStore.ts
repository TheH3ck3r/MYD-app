import {
  TaskItem,
  TaskStatus,
  TaskStatusChange,
  TaskStatusChangeResult,
} from "@/types/tasks";
import { makeAutoObservable } from "mobx";

class TasksStore {
  constructor() {
    makeAutoObservable(this);
  }

  // Публичное API, ака обёртка над updateNode
  setTaskStatus(
    tree: TaskItem[],
    id: string,
    status: TaskStatus,
  ): TaskStatusChangeResult {
    const changes: TaskStatusChange[] = [];
    const newTree = this.updateNode(tree, id, status, changes);
    return { tree: newTree, changes };
  }

  // Быстрый toggle: todo <-> done. Из failed/excused -> todo.
  toggle(tree: TaskItem[], id: string): TaskStatusChangeResult {
    const task = this.findTask(tree, id);
    if (!task) return { tree, changes: [] };

    const next: TaskStatus = task.status === "todo" ? "done" : "todo";
    return this.setTaskStatus(tree, id, next);
  }

  // Рекурсивный обход дерева
  updateNode(
    items: TaskItem[],
    id: string,
    status: TaskStatus,
    changes: TaskStatusChange[],
  ): TaskItem[] {
    let anyChanged = false;

    const result = items.map((item) => {
      if (item.id === id) {
        const updated = this.applyDown(item, status, changes, true); // ← true
        if (updated !== item) anyChanged = true;
        return updated;
      }

      if (item.children.length > 0) {
        const newChildren = this.updateNode(item.children, id, status, changes);
        if (newChildren !== item.children) {
          anyChanged = true;
          return this.aggregate(item, newChildren, changes);
        }
      }

      return item;
    });

    return anyChanged ? result : items;
  }

  // Рекурсивная установка статуса todo потомкам при статусе родителя
  applyDown(
    item: TaskItem,
    status: TaskStatus,
    changes: TaskStatusChange[],
    isTarget: boolean,
  ): TaskItem {
    const shouldChange = isTarget ? true : item.status === "todo";

    let changed = shouldChange && item.status !== status;

    if (changed) {
      changes.push({ id: item.id, title: item.title, status, auto: false });
    }

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

  // Установка статуса роидтелю при одинаковых статусах всех потомков
  aggregate(
    item: TaskItem,
    newChildren: TaskItem[],
    changes: TaskStatusChange[],
  ): TaskItem {
    const first = newChildren[0].status;
    const allSame = newChildren.every((c) => c.status === first);
    const newStatus: TaskStatus = allSame ? first : "todo";

    if (newStatus !== item.status) {
      changes.push({
        id: item.id,
        title: item.title,
        status: newStatus,
        auto: true,
      });
    }

    return { ...item, status: newStatus, children: newChildren };
  }

  // Рекурсивный поиск узла
  findTask(items: TaskItem[], id: string): TaskItem | null {
    for (const item of items) {
      if (item.id === id) return item;
      const found = this.findTask(item.children, id);
      if (found) return found;
    }
    return null;
  }
}

export const tasksStore = new TasksStore();
