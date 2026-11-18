import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import { TopBar } from "@/components/TopBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AddTaskButton } from "@/components/AddTaskButton";
import { WeekCalendar } from "@/components/daily/WeekCalendar";
import { StreakSheet } from "@/components/daily/StreakSheet";
import { DailyTaskFormSheet } from "@/components/daily/DailyTaskFormSheet";
import { DailyTaskList } from "@/components/daily/DailyTaskList";
import { DailyTemplatesList } from "@/components/daily/DailyTemplatesList";
import { DailyDayHeader } from "@/components/daily/DailyDayHeader";
import { DailyTaskSheet } from "@/components/daily/DailyTaskSheet";
import { Loader } from "@/ui/Loader";
import { dailyTasksStore } from "@/stores/dailyTasksStore";
import type { TaskStatus } from "@/types/tasks";
import type {
  DailyTaskNode,
  DailyNodeFields,
  DailySchedule,
  DailyOpenedTask,
  DailyTaskTarget,
  DailyTaskFormState,
} from "@/types/dailyTasks";

function DailyScreen() {
  const [isStreakSheetOpen, setIsStreakSheetOpen] = useState(false);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [formState, setFormState] = useState<DailyTaskFormState | null>(null);
  const [openedTask, setOpenedTask] = useState<DailyOpenedTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<DailyTaskTarget | null>(
    null,
  );

  const handleFocus = useCallback(() => dailyTasksStore.watchForeground(), []);
  useFocusEffect(handleFocus);

  const taskDetails = dailyTasksStore.getTaskDetails(openedTask);
  const deleteConfirmation =
    dailyTasksStore.getDeleteConfirmation(taskToDelete);

  const handleSelectDate = (date: string) => {
    dailyTasksStore.selectDate(date);
  };

  const handleSelectToday = () => {
    dailyTasksStore.selectDate(dailyTasksStore.today);
  };

  const handleToggleTemplates = () => {
    setIsManagingTemplates(!isManagingTemplates);
  };

  const handleOpenStreaks = () => {
    setIsStreakSheetOpen(true);
  };

  const handleCloseStreaks = () => {
    setIsStreakSheetOpen(false);
  };

  const handleRetry = async () => {
    await dailyTasksStore.load();
  };

  const handleOpenTask = (taskId: string, nodeId: string) => {
    setOpenedTask({ taskId, nodeId });
  };

  const handleOpenTemplate = (target: DailyOpenedTask) => {
    setOpenedTask(target);
  };

  const handleCloseTask = () => {
    setOpenedTask(null);
  };

  const handleAdd = () => {
    setFormState(dailyTasksStore.getCreateForm());
  };

  const handleEdit = () => {
    const form = dailyTasksStore.getEditForm(openedTask);
    if (!form) return;
    setOpenedTask(null);
    setFormState(form);
  };

  const handleAddSubtask = () => {
    const form = dailyTasksStore.getSubtaskForm(openedTask);
    if (!form) return;
    setOpenedTask(null);
    setFormState(form);
  };

  const handleSubmit = async (
    fields: DailyNodeFields,
    schedule?: DailySchedule,
  ) => {
    if (!formState) return;
    await dailyTasksStore.submitForm(formState, fields, schedule);
  };

  const handleCloseForm = () => {
    setFormState(null);
  };

  const handleToggle = async (taskId: string, node: DailyTaskNode) => {
    await dailyTasksStore.toggleTask(taskId, node.id);
  };

  const handleUpdateStatus = async (status: TaskStatus) => {
    if (await dailyTasksStore.updateTaskStatus(openedTask, status))
      setOpenedTask(null);
  };

  const handleDelete = () => {
    if (!openedTask) return;
    setTaskToDelete(openedTask);
    setOpenedTask(null);
  };

  const handleDeleteTemplate = (target: DailyTaskTarget) => {
    setTaskToDelete(target);
  };

  const handleCancelDelete = () => {
    if (!dailyTasksStore.isBusy) setTaskToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete || dailyTasksStore.isBusy) return;
    await dailyTasksStore.deleteTarget(taskToDelete);
    setTaskToDelete(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <TopBar
        title="Ежедневные задачи"
        perfectStreak={dailyTasksStore.streaks.perfect}
        activeStreak={dailyTasksStore.streaks.active}
        onStreakPress={handleOpenStreaks}
      />

      <WeekCalendar
        selectedDate={dailyTasksStore.selectedDate}
        today={dailyTasksStore.today}
        onSelectDate={handleSelectDate}
        dayState={dailyTasksStore.getDayState}
      />

      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={handleSelectToday}>
          <Text className="text-sm text-primary">Сегодня</Text>
        </Pressable>
        <Pressable
          accessibilityState={{ selected: isManagingTemplates }}
          onPress={handleToggleTemplates}
        >
          <Text className="text-sm text-primary">
            {isManagingTemplates ? "К задачам дня" : "Все повторения"}
          </Text>
        </Pressable>
      </View>

      {!!dailyTasksStore.error && (
        <View className="mx-4 mb-3 gap-2 rounded-xl border border-error p-3">
          <Text accessibilityRole="alert" className="text-sm text-error">
            {dailyTasksStore.error}
          </Text>
          <Pressable disabled={dailyTasksStore.isBusy} onPress={handleRetry}>
            <Text className="text-sm text-foreground">Повторить загрузку</Text>
          </Pressable>
        </View>
      )}

      {!dailyTasksStore.loaded && dailyTasksStore.loading ? (
        <Loader />
      ) : (
        <View className="flex-1">
          {isManagingTemplates ? (
            <DailyTemplatesList
              items={dailyTasksStore.templateItems}
              today={dailyTasksStore.today}
              busy={dailyTasksStore.isBusy}
              onOpen={handleOpenTemplate}
              onDelete={handleDeleteTemplate}
            />
          ) : (
            <DailyTaskList
              tasks={dailyTasksStore.tasks}
              onOpen={handleOpenTask}
              onToggle={handleToggle}
              readOnly={dailyTasksStore.readOnly}
              busy={dailyTasksStore.isBusy}
              header={
                <DailyDayHeader
                  selectedDate={dailyTasksStore.selectedDate}
                  completedCount={dailyTasksStore.completedCount}
                  taskCount={dailyTasksStore.tasks.length}
                  dateMode={dailyTasksStore.dateMode}
                />
              }
            />
          )}
        </View>
      )}

      <AddTaskButton
        disabled={dailyTasksStore.isBusy || !dailyTasksStore.loaded}
        context="daily"
        onPress={handleAdd}
      />

      <StreakSheet visible={isStreakSheetOpen} onClose={handleCloseStreaks} />

      <DailyTaskSheet
        details={taskDetails}
        busy={dailyTasksStore.isBusy}
        error={dailyTasksStore.error}
        onStatusChange={handleUpdateStatus}
        onEdit={handleEdit}
        onAddSubtask={handleAddSubtask}
        onDelete={handleDelete}
        onClose={handleCloseTask}
      />

      {formState && (
        <DailyTaskFormSheet
          form={dailyTasksStore.getFormData(formState)}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}

      <ConfirmModal
        visible={taskToDelete !== null}
        title={deleteConfirmation.title}
        message={deleteConfirmation.message}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

export default observer(DailyScreen);
