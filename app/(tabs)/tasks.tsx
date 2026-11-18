import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "mobx-react-lite";
import { regularTasksStore } from "@/stores/regularTasksStore";
import {
  TopBar,
  TaskList,
  AddTaskButton,
  TaskSheet,
  RegularTaskFormSheet,
  RegularTaskFormValues,
  ConfirmModal,
} from "@/components";
import { TaskFormState, TaskStatus } from "@/types/tasks";
import { NoTasks } from "@/components/NoTasks";
import { Loader } from "@/ui/Loader";

function TasksScreen() {
  useEffect(() => {
    regularTasksStore.loadTasks();
  }, []);

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TaskFormState>(null);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const formTask = regularTasksStore.getFormTask(formState);
  const completed = regularTasksStore.tasks.filter(
    (task) => task.status === "done",
  ).length;

  const handleToggle = async (id: string) => {
    await regularTasksStore.toggle(id);
  };

  const handleUpdateStatus = async (status: TaskStatus) => {
    if (!openTaskId) return;
    await regularTasksStore.setTaskStatus(openTaskId, status);
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
    if (!openTaskId) return;
    setTaskToDeleteId(openTaskId);
    setOpenTaskId(null);
  };

  const confirmDelete = async () => {
    if (!taskToDeleteId) return;
    await regularTasksStore.deleteTask(taskToDeleteId);
    setTaskToDeleteId(null);
  };

  const handleSubmit = async (values: RegularTaskFormValues) => {
    if (!formState) return;

    if (formState.type === "create") {
      await regularTasksStore.createTask(formState.parentId ?? null, {
        title: values.title,
        note: values.note,
      });
    } else {
      await regularTasksStore.updateTask(formState.taskId, {
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
        {!regularTasksStore.loading && (
          <Text className="px-4 py-3 text-sm text-muted-foreground">
            Выполнено {completed} из {regularTasksStore.tasks.length}
          </Text>
        )}
        {regularTasksStore.loading ? (
          <Loader />
        ) : regularTasksStore.tasks.length === 0 ? (
          <NoTasks context="regular" />
        ) : (
          <TaskList
            list={regularTasksStore.tasks}
            onToggle={handleToggle}
            onPress={(id) => setOpenTaskId(id)}
          />
        )}
      </View>

      <TaskSheet
        visible={openTaskId !== null}
        task={regularTasksStore.openTask(openTaskId)}
        context="regular"
        onStatusChange={handleUpdateStatus}
        onEdit={handleEdit}
        onAddSubtask={handleAddSubtask}
        onDelete={handleDelete}
        onClose={() => setOpenTaskId(null)}
      />

      <AddTaskButton onPress={handleAdd} context={"regular"} />

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

      <ConfirmModal
        visible={taskToDeleteId !== null}
        title="Удалить задачу?"
        message={
          regularTasksStore.findTask(taskToDeleteId || "")?.children.length
            ? "У этой задачи есть подзадачи. Они тоже будут удалены."
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDeleteId(null)}
      />
    </SafeAreaView>
  );
}

export default observer(TasksScreen);
