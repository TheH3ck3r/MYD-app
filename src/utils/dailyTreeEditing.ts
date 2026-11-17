import type { DailyNodeFields, DailyTaskNode } from "../types/dailyTasks";
import { findDailyNode } from "./dailyStatus";

const changeNode = (
  tree: DailyTaskNode,
  nodeId: string,
  edit: (node: DailyTaskNode) => DailyTaskNode,
): DailyTaskNode => {
  if (tree.id === nodeId) return edit(tree);
  return {
    ...tree,
    children: tree.children.map((child) => changeNode(child, nodeId, edit)),
  };
};

const requireNode = (tree: DailyTaskNode, nodeId: string): void => {
  if (!findDailyNode(tree, nodeId)) {
    throw new Error("Подзадача уже удалена из будущего расписания");
  }
};

const normalizeFields = (fields: DailyNodeFields) => {
  const title = fields.title.trim();
  if (!title) throw new Error("Введите название задачи");
  return { title, note: fields.note.trim() || null };
};

export const editDailyNode = (
  tree: DailyTaskNode,
  nodeId: string,
  fields: DailyNodeFields,
): DailyTaskNode => {
  requireNode(tree, nodeId);
  const normalized = normalizeFields(fields);
  return changeNode(tree, nodeId, (node) => ({ ...node, ...normalized }));
};

export const addDailySubtask = (
  tree: DailyTaskNode,
  parentId: string,
  id: string,
  fields: DailyNodeFields,
): DailyTaskNode => {
  requireNode(tree, parentId);
  if (findDailyNode(tree, id))
    throw new Error("Подзадача с таким идентификатором уже существует");
  const normalized = normalizeFields(fields);
  return changeNode(tree, parentId, (parent) => ({
    ...parent,
    children: [
      ...parent.children,
      { ...normalized, id, status: "todo", children: [] },
    ],
  }));
};

export const removeDailySubtask = (
  tree: DailyTaskNode,
  nodeId: string,
): DailyTaskNode => {
  if (tree.id === nodeId)
    throw new Error("Используйте удаление повторения для корневой задачи");
  requireNode(tree, nodeId);
  const remove = (node: DailyTaskNode): DailyTaskNode => ({
    ...node,
    children: node.children.filter((child) => child.id !== nodeId).map(remove),
  });
  return remove(tree);
};
