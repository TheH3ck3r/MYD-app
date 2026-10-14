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

  // ============================================================
  // Статусы — публичное API
  // ============================================================

  setTaskStatus(
    tree: TaskItem[],
    id: string,
    status: TaskStatus,
  ): TaskStatusChangeResult {
    const changes: TaskStatusChange[] = [];

    const newTree = this.transformTree(
      tree,
      id,
      (node) => this.applyDown(node, status, changes, true),
      (parent, newChildren) => this.aggregate(parent, newChildren, changes),
    );

    return { tree: newTree, changes };
  }

  toggle(tree: TaskItem[], id: string): TaskStatusChangeResult {
    const task = this.findTask(tree, id);
    if (!task) return { tree, changes: [] };

    const next: TaskStatus = task.status === "todo" ? "done" : "todo";
    return this.setTaskStatus(tree, id, next);
  }

  // ============================================================
  // CRUD — публичное API
  // ============================================================

  addTask(
    tree: TaskItem[],
    parentId: string | null,
    input: { title: string; note?: string },
  ): TaskItem[] {
    const newTask: TaskItem = {
      id: this.generateId(),
      title: input.title.trim(),
      status: "todo",
      note: input.note?.trim() || null,
      children: [],
    };

    if (parentId === null) {
      return [...tree, newTask];
    }

    return this.transformTree(tree, parentId, (parent) => ({
      ...parent,
      children: [...parent.children, newTask],
    }));
  }

  updateTask(
    tree: TaskItem[],
    id: string,
    input: { title?: string; note?: string },
  ): TaskItem[] {
    return this.transformTree(tree, id, (node) => {
      const next = { ...node };

      if (input.title !== undefined) {
        next.title = input.title.trim();
      }

      if (input.note !== undefined) {
        const trimmed = input.note.trim();
        next.note = trimmed.length > 0 ? trimmed : null;
      }

      return next;
    });
  }

  deleteTask(tree: TaskItem[], id: string): TaskItem[] {
    return this.transformTree(
      tree,
      id,
      () => null,
      (parent, newChildren) => this.aggregate(parent, newChildren),
    );
  }

  // ============================================================
  // Поиск — публичное API
  // ============================================================

  findTask(items: TaskItem[], id: string): TaskItem | null {
    for (const item of items) {
      if (item.id === id) return item;
      const found = this.findTask(item.children, id);
      if (found) return found;
    }
    return null;
  }

  // ============================================================
  // Обход дерева — внутреннее
  // ============================================================

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
        if (transformed === null) continue;
        result.push(transformed);
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

  // ============================================================
  // Логика статусов — внутреннее
  // ============================================================

  private applyDown(
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

  private aggregate(
    item: TaskItem,
    newChildren: TaskItem[],
    changes?: TaskStatusChange[],
  ): TaskItem {
    if (newChildren.length === 0) {
      return { ...item, children: newChildren };
    }

    const first = newChildren[0].status;
    const allSame = newChildren.every((c) => c.status === first);
    const newStatus: TaskStatus = allSame ? first : "todo";

    if (newStatus !== item.status) {
      changes?.push({
        id: item.id,
        title: item.title,
        status: newStatus,
        auto: true,
      });
    }

    return { ...item, status: newStatus, children: newChildren };
  }

  // ============================================================
  // Утилиты — внутреннее
  // ============================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const tasksStore = new TasksStore();
