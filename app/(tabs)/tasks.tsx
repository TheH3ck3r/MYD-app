import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { TaskList } from "@/components/TaskList";
import { TaskItem, TaskStatus } from "@/types/tasks";
import { MOCK_TASKS } from "../../constants/testData";
import { ActionSheet } from "@/ui/ActionSheet";
import { EditButton } from "@/components/EditButton";
import { RegularActionStatusItem } from "@/components/RegularActionStatusItem";
import { tasksStore } from "@/stores/tasksStore";

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [taskIdForAction, setTaskIdForAction] = useState<string | null>(null);

  const STATUSES: TaskStatus[] = ["todo", "done", "failed", "paused"];

  const actionSheetTask = taskIdForAction
    ? tasksStore.findTask(tasks, taskIdForAction)
    : null;

  const handleToggle = (id: string) => {
    const { tree } = tasksStore.toggle(tasks, id);
    setTasks(tree);
  };

  const handleUpdateStatus = (status: TaskStatus) => {
    if (!taskIdForAction) return;
    const { tree } = tasksStore.setTaskStatus(tasks, taskIdForAction, status);
    setTasks(tree);
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
          <RegularActionStatusItem
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
