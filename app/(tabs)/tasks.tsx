import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { TaskList } from "@/components/TaskList";
import { TaskItem, TaskStatus } from "@/types/tasks";
import { MOCK_TASKS } from "../../constants/testData";
import { ActionSheet } from "@/ui/ActionSheet";
import { AddTaskButton } from "@/components/AddTaskButton";
import { TaskAction } from "@/components/TaskAction";
import { tasksStore } from "@/stores/tasksStore";

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const STATUSES: TaskStatus[] = ["todo", "done", "failed", "paused"];

  const openTask = openTaskId ? tasksStore.findTask(tasks, openTaskId) : null;

  const handleToggle = (id: string) => {
    const { tree } = tasksStore.toggle(tasks, id);
    setTasks(tree);
  };

  const handleUpdateStatus = (status: TaskStatus) => {
    if (!openTaskId) return;
    const { tree } = tasksStore.setTaskStatus(tasks, openTaskId, status);
    setTasks(tree);
    setOpenTaskId(null);
  };

  const handleAdd = () => {
    // TODO: открыть TaskFormSheet с parentId=null
    console.log("add root task");
  };

  const handleAddSubtask = () => {
    if (!openTaskId) return;
    const parentId = openTaskId;
    setOpenTaskId(null);
    // TODO: открыть TaskFormSheet с parentId
    console.log("add subtask to", parentId);
  };

  const handleEdit = () => {
    if (!openTaskId) return;
    const taskId = openTaskId;
    setOpenTaskId(null);
    // TODO: открыть TaskFormSheet в режиме edit
    console.log("edit", taskId);
  };

  const handleDelete = () => {
    if (!openTaskId) return;
    const taskId = openTaskId;
    setOpenTaskId(null);

    // Alert.alert("Удалить задачу?", "Это действие нельзя отменить.", [
    //   { text: "Отмена", style: "cancel" },
    //   {
    //     text: "Удалить",
    //     style: "destructive",
    //     onPress: () => {
    //       // TODO: tasksStore.deleteTask(tasks, taskId)
    //       console.log("delete", taskId);
    //     },
    //   },
    // ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar title={"Цели и задачи"} />

      <View className="flex-1">
        <TaskList
          list={tasks}
          onToggle={(id) => handleToggle(id)}
          onPress={(id) => setOpenTaskId(id)}
          onLongPress={() => {
            console.log("onLongPress");
          }}
        />
      </View>

      <AddTaskButton onPress={() => handleAdd} context={"regular"} />

      <TaskAction
        visible={openTaskId !== null}
        task={openTask}
        context="regular"
        onStatusChange={handleUpdateStatus}
        onEdit={handleEdit}
        onAddSubtask={handleAddSubtask}
        onDelete={handleDelete}
        onClose={() => setOpenTaskId(null)}
      />
    </SafeAreaView>
  );
}
