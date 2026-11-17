import type { DailyStatus, DailyTaskNode } from "../types/dailyTasks";
import { isDailyStatus } from "./dailyHistory";

// Daily owns these rules independently, even where they match Regular behavior.
const applyDailyDown = (
  node: DailyTaskNode,
  status: DailyStatus,
  isTarget: boolean,
): DailyTaskNode => ({
  ...node,
  status: isTarget || node.status === "todo" ? status : node.status,
  children: node.children.map((child) => applyDailyDown(child, status, false)),
});

const aggregateDailyParent = (
  parent: DailyTaskNode,
  children: DailyTaskNode[],
): DailyTaskNode => {
  if (children.length === 0) return { ...parent, children };
  const first = children[0].status;
  return {
    ...parent,
    children,
    status: children.every((child) => child.status === first) ? first : "todo",
  };
};

export const changeDailyStatus = (
  tree: DailyTaskNode,
  nodeId: string,
  status: DailyStatus,
): DailyTaskNode => {
  if (!isDailyStatus(status)) throw new Error("Unsupported Daily status");
  const visit = (node: DailyTaskNode): DailyTaskNode => {
    if (node.id === nodeId) return applyDailyDown(node, status, true);
    const children = node.children.map(visit);
    return children.some((child, index) => child !== node.children[index])
      ? aggregateDailyParent(node, children)
      : node;
  };
  const result = visit(tree);
  if (result === tree) throw new Error("Daily subtask was not found");
  return result;
};

export const findDailyNode = (
  tree: DailyTaskNode,
  nodeId: string,
): DailyTaskNode | null => {
  if (tree.id === nodeId) return tree;
  for (const child of tree.children) {
    const found = findDailyNode(child, nodeId);
    if (found) return found;
  }
  return null;
};
