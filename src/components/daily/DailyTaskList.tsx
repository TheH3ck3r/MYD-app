import type { ReactNode } from "react";
import { TaskList } from "@/components/TaskList";
import type { TaskItem } from "@/types/tasks";
import type { DailyDayTask, DailyTaskNode } from "@/types/dailyTasks";

export const DailyTaskList = ({
  tasks,
  onOpen,
  onToggle,
  readOnly,
  busy,
  header,
}: {
  tasks: DailyDayTask[];
  onOpen: (taskId: string, nodeId: string) => void;
  onToggle: (taskId: string, node: DailyTaskNode) => void;
  readOnly: boolean;
  busy: boolean;
  header?: ReactNode;
}) => {
  const nodes = new Map<string, { taskId: string; node: DailyTaskNode }>();
  const present = (taskId: string, node: DailyTaskNode): TaskItem => {
    // Scope presentation IDs to their occurrence without changing domain IDs.
    const id = JSON.stringify([taskId, node.id]);
    nodes.set(id, { taskId, node });
    return {
      ...node,
      id,
      children: node.children.map((child) => present(taskId, child)),
    };
  };
  const list = tasks.map((task) => present(task.taskId, task.tree));

  return (
    <TaskList
      list={list}
      header={header}
      contentContainerStyle={{ paddingBottom: 110 }}
      toggleDisabled={readOnly || busy}
      onPress={(id) => {
        const item = nodes.get(id);
        if (item) onOpen(item.taskId, item.node.id);
      }}
      onToggle={(id) => {
        const item = nodes.get(id);
        if (item && !readOnly && !busy) onToggle(item.taskId, item.node);
      }}
    />
  );
};
