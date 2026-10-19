import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { TaskList } from "@/components/TaskList";
import { TaskFormState, TaskStatus } from "@/types/tasks";
import { AddTaskButton } from "@/components/AddTaskButton";
import { TaskSheet } from "@/components/TaskSheet";
import { tasksStore } from "@/stores/tasksStore";
import {
  RegularTaskFormSheet,
  RegularTaskFormValues,
} from "@/components/RegularTaskFormSheet";
import { observer } from "mobx-react-lite";

function TasksScreen() {
  useEffect(() => {
    tasksStore.loadTasks();
  }, []);

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TaskFormState>(null);

  const formTask = tasksStore.getFormTask(formState);

  const handleToggle = async (id: string) => {
    await tasksStore.toggle(id);
  };

  const handleUpdateStatus = async (status: TaskStatus) => {
    if (!openTaskId) return;
    await tasksStore.setTaskStatus(openTaskId, status);
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

  const handleDelete = async () => {
    // TODO: Добавить модалку предупреждения
    if (!openTaskId) return;
    const taskId = openTaskId;
    setOpenTaskId(null);
    await tasksStore.deleteTask(taskId);
  };

  const handleSubmit = async (values: RegularTaskFormValues) => {
    if (!formState) return;

    if (formState.type === "create") {
      await tasksStore.createTask(formState.parentId ?? null, {
        title: values.title,
        note: values.note,
      });
    } else {
      await tasksStore.updateTask(formState.taskId, {
        title: values.title,
        note: values.note,
      });
    }

    setFormState(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar title={"Цели и задачи"} />

      <View className="flex-1">
        <TaskList
          list={tasksStore.tasks}
          onToggle={handleToggle}
          onPress={(id) => setOpenTaskId(id)}
        />
      </View>

      <AddTaskButton onPress={handleAdd} context={"regular"} />

      <TaskSheet
        visible={openTaskId !== null}
        task={tasksStore.openTask(openTaskId)}
        context="regular"
        onStatusChange={handleUpdateStatus}
        onEdit={handleEdit}
        onAddSubtask={handleAddSubtask}
        onDelete={handleDelete}
        onClose={() => setOpenTaskId(null)}
      />

      <RegularTaskFormSheet
        visible={formState !== null}
        mode={formState?.type === "edit" ? "edit" : "create"}
        title={
          formState?.type === "edit"
            ? "Редактировать задачу"
            : formState?.type === "create" && formState.parentId
              ? "Новая подзадача"
              : "Новая задача"
        }
        initialValues={
          formTask
            ? { title: formTask.title, note: formTask.note ?? "" }
            : undefined
        }
        onSubmit={handleSubmit}
        onClose={() => setFormState(null)}
      />
    </SafeAreaView>
  );
}

export default observer(TasksScreen);
