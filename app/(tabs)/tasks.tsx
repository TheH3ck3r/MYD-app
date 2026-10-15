import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { TaskList } from "@/components/TaskList";
import { TaskItem, TaskStatus } from "@/types/tasks";
import { MOCK_TASKS } from "../../constants/testData";
import { AddTaskButton } from "@/components/AddTaskButton";
import { TaskSheet } from "@/components/TaskSheet";
import { tasksStore } from "@/stores/tasksStore";
import { TaskFormSheet, TaskFormValues } from "@/components/TaskFormSheet";

type FormState =
  | { type: "create"; parentId: string | null }
  | { type: "edit"; taskId: string }
  | null;

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(null);

  const openTask = openTaskId ? tasksStore.findTask(tasks, openTaskId) : null;

  const formTask =
    formState?.type === "edit"
      ? tasksStore.findTask(tasks, formState.taskId)
      : null;

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
    setFormState({ type: "create", parentId: null });
  };

  const handleAddSubtask = () => {
    if (!openTaskId) return;
    const parentId = openTaskId;
    setOpenTaskId(null);
    setFormState({ type: "create", parentId });
  };

  const handleEdit = () => {
    if (!openTaskId) return;
    const taskId = openTaskId;
    setOpenTaskId(null);
    setFormState({ type: "edit", taskId });
  };

  const handleDelete = () => {
    // TODO: Добавить модалку предупреждения
    if (!openTaskId) return;
    const taskId = openTaskId;
    setOpenTaskId(null);

    tasksStore.deleteTask(tasks, taskId);
  };

  const handleSubmit = (values: TaskFormValues) => {
    if (!formState) return;

    if (formState.type === "create") {
      tasksStore.addTask(tasks, formState.parentId, values);
    } else {
      tasksStore.updateTask(tasks, formState.taskId, values);
    }

    setFormState(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar title={"Цели и задачи"} />

      <View className="flex-1">
        <TaskList
          list={tasks}
          onToggle={(id) => handleToggle(id)}
          onPress={(id) => setOpenTaskId(id)}
        />
      </View>

      <AddTaskButton onPress={() => handleAdd()} context={"regular"} />

      <TaskSheet
        visible={openTaskId !== null}
        task={openTask}
        context="regular"
        onStatusChange={handleUpdateStatus}
        onEdit={handleEdit}
        onAddSubtask={handleAddSubtask}
        onDelete={handleDelete}
        onClose={() => setOpenTaskId(null)}
      />

      <TaskFormSheet
        visible={formState !== null}
        mode={formState?.type === "edit" ? "edit" : "create"}
        title={
          formState?.type === "edit"
            ? "Редактировать задачу"
            : formState?.parentId
              ? "Новая подзадача"
              : "Новая задача"
        }
        initialValues={
          formTask
            ? { title: formTask.title, note: "" /* TODO: task.note */ }
            : undefined
        }
        onSubmit={() => handleSubmit}
        onClose={() => setFormState(null)}
      />
    </SafeAreaView>
  );
}
