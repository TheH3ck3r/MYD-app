import { Task, TaskItem, TaskStatus } from "@/types/task";

export function buildTree(
  tasks: Task[],
  getStatus: (id: string) => TaskStatus,
): TaskItem[] {
  const map = new Map<string, TaskItem>();
  const roots: TaskItem[] = [];

  for (const t of tasks) {
    if (t.archivedAt) continue;
    map.set(t.id, {
      id: t.id,
      title: t.title,
      status: getStatus(t.id),
      children: [],
    });
  }

  for (const t of tasks) {
    if (t.archivedAt) continue;
    const node = map.get(t.id)!;
    if (t.parentId && map.has(t.parentId)) {
      map.get(t.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Сортировка siblings по position
  const sortRecursive = (nodes: TaskItem[]) => {
    nodes.sort((a, b) => {
      const ta = tasks.find((t) => t.id === a.id)!;
      const tb = tasks.find((t) => t.id === b.id)!;
      return ta.position - tb.position;
    });
    nodes.forEach((n) => sortRecursive(n.children));
  };
  sortRecursive(roots);

  return roots;
}

/**
 * Рекурсивно обновляет статус задачи по id.
 * Возвращает новое дерево (иммутабельно).
 * Если задача не найдена — возвращает тот же массив.
 */
export const updateTaskStatus = (
  items: TaskItem[],
  id: string,
  status: TaskStatus,
): TaskItem[] => {
  let changed = false;

  const next = items.map((item) => {
    if (item.id === id) {
      changed = true;
      return { ...item, status };
    }

    if (item.children.length > 0) {
      const updatedChildren = updateTaskStatus(item.children, id, status);
      if (updatedChildren !== item.children) {
        changed = true;
        return { ...item, children: updatedChildren };
      }
    }

    return item;
  });

  return changed ? next : items;
};
