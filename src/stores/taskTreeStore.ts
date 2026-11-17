import { TaskItem, TaskStatus, TaskStatusChange } from "@/types/tasks";
import { makeAutoObservable } from "mobx";

class TaskTreeStore {
  constructor() {
    makeAutoObservable(this);
  }

  findTask = (tasks: TaskItem[], id: string): TaskItem | null => {
    for (const item of tasks) {
      if (item.id === id) return item;
      const found = this.findTask(item.children, id);
      if (found) return found;
    }
    return null;
  };

  addTaskToTree(
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

  transformTree = (
    items: TaskItem[],
    id: string,
    transformer: (node: TaskItem) => TaskItem | null,
    onParentUpdate?: (parent: TaskItem, newChildren: TaskItem[]) => TaskItem,
  ): TaskItem[] => {
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
  };

  applyDown = (
    item: TaskItem,
    status: TaskStatus,
    changes: TaskStatusChange[],
    isTarget: boolean,
  ): TaskItem => {
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
  };

  aggregate = (
    item: TaskItem,
    newChildren: TaskItem[],
    changes?: TaskStatusChange[],
  ): TaskItem => {
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
  };
}

export const taskTreeStore = new TaskTreeStore();
