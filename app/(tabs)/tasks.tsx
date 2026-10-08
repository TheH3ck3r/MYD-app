import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { TaskList } from "@/components/TaskList";
import { TaskItem, TaskStatus } from "@/types/task";
import { MOCK_TASKS } from "../../constants/testData";
import { updateTaskStatus } from "@/lib/tasks";
import { ActionSheet } from "@/ui/ActionSheet";
import { EditButton } from "@/components/EditButton";
import { ActionItemStatus } from "@/components/ActionStatusItem";

export default function HomeScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [taskIdForAction, setTaskIdForAction] = useState<string | null>(null);

  const STATUSES: TaskStatus[] = ["todo", "done", "failed", "excused"];

  const findTask = (items: TaskItem[], id: string): TaskItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      const found = findTask(item.children, id);
      if (found) return found;
    }
    return null;
  };

  const actionSheetTask = taskIdForAction
    ? findTask(tasks, taskIdForAction)
    : null;

  const handleToggle = (id: string) => {
    setTasks((prev) => {
      const task = findTask(prev, id);
      if (!task) return prev;

      const next: TaskStatus = task.status === "todo" ? "done" : "todo";
      return updateTaskStatus(prev, id, next);
    });
  };

  const handleUpdateStatus = (status: TaskStatus) => {
    if (!taskIdForAction) return;
    setTasks((prev) => updateTaskStatus(prev, taskIdForAction, status));
    setTaskIdForAction(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar title={"Цели и задачи"} />

      <View className="flex-1">
        <TaskList
          list={tasks}
          onToggle={(id) => handleToggle(id)}
          onPress={(id) => setTaskIdForAction(id)}
          onLongPress={() => {
            console.log("onLongPress");
          }}
        />
      </View>

      <EditButton
        onPress={() => {
          console.log("test");
        }}
      />

      <ActionSheet
        visible={taskIdForAction !== null}
        title="Статус задачи"
        onClose={() => setTaskIdForAction(null)}
      >
        {STATUSES.map((status) => (
          <ActionItemStatus
            key={status}
            status={status}
            active={status === actionSheetTask?.status}
            onPress={() => handleUpdateStatus(status)}
          />
        ))}
      </ActionSheet>
    </SafeAreaView>
  );
}
