import { useCallback, useState } from "react";
import { AppState, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { observer } from "mobx-react-lite";
import dayjs from "dayjs";
import { TopBar } from "@/components/TopBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AddTaskButton } from "@/components/AddTaskButton";
import { WeekCalendar } from "@/components/daily/WeekCalendar";
import { StreakSheet } from "@/components/daily/StreakSheet";
import { DailyTaskFormSheet } from "@/components/daily/DailyTaskFormSheet";
import { DailyTaskList } from "@/components/daily/DailyTaskList";
import { TaskSheet } from "@/components/TaskSheet";
import { Task } from "@/components/Task";
import { Loader } from "@/ui/Loader";
import { dailyTasksStore as store } from "@/stores/dailyTasksStore";
import { createDailyId } from "@/services/dailyTaskRepository";
import { currentDailyDate, dailyAnchorWeek } from "@/utils/dailyRecurrence";
import { findDailyNode } from "@/utils/dailyStatus";
import { isDailyStatus, resolveDailyDay } from "@/utils/dailyHistory";
import type { TaskStatus } from "@/types/tasks";
import type {
  DailyTaskInput,
  DailyTaskNode,
  DailyNodeFields,
  DailySchedule,
} from "@/types/dailyTasks";

type Editor =
  | { mode: "create"; input: DailyTaskInput }
  | {
      mode: "edit";
      taskId: string;
      nodeId: string;
      fields: DailyNodeFields;
      schedule?: DailySchedule;
      parentTitle: string;
    }
  | { mode: "add"; taskId: string; parentId: string; parentTitle: string };

function DailyScreen() {
  const [streakOpen, setStreakOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [opened, setOpened] = useState<{
    taskId: string;
    nodeId: string;
    template?: boolean;
  } | null>(null);
  const [deleting, setDeleting] = useState<{
    taskId: string;
    nodeId: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      void store.load();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void store.load();
      });
      const timer = setInterval(() => {
        if (
          AppState.currentState === "active" &&
          currentDailyDate() !== store.today
        )
          void store.load();
      }, 30_000);
      return () => {
        subscription.remove();
        clearInterval(timer);
      };
    }, []),
  );

  const tasks = store.tasks;
  const readOnly = store.selectedDate !== store.today;
  const busy = store.busy || store.loading;
  const openedTemplate = store.snapshot.templates.find(
    (item) => item.id === opened?.taskId,
  );
  const openedRevision =
    openedTemplate?.revisions[openedTemplate.revisions.length - 1];
  const openedTree = opened?.template
    ? openedRevision?.tree
    : tasks.find((task) => task.taskId === opened?.taskId)?.tree;
  const openedNode =
    openedTree && opened ? findDailyNode(openedTree, opened.nodeId) : null;
  const futureNode =
    openedRevision && opened
      ? findDailyNode(openedRevision.tree, opened.nodeId)
      : null;
  const completed = tasks.filter((task) => task.tree.status === "done").length;

  const edit = (taskId: string, nodeId = taskId) => {
    const template = store.snapshot.templates.find(
      (item) => item.id === taskId,
    );
    const revision = template?.revisions[template.revisions.length - 1];
    if (!revision || template?.deletedFrom) return;
    const node = findDailyNode(revision.tree, nodeId);
    if (!node) return;
    setOpened(null);
    setEditor({
      mode: "edit",
      taskId,
      nodeId,
      fields: { title: node.title, note: node.note ?? "" },
      schedule: nodeId === taskId ? revision.schedule : undefined,
      parentTitle: revision.tree.title,
    });
  };

  const create = () => {
    const today = currentDailyDate();
    setEditor({
      mode: "create",
      input: {
        schedule: {
          frequency: "weekly",
          startDate: today,
          anchorWeekStart: dailyAnchorWeek(today),
          intervalWeeks: 1,
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        },
        tree: {
          id: createDailyId(),
          title: "",
          note: null,
          status: "todo",
          children: [],
        },
      },
    });
  };

  const status = (value: TaskStatus) => {
    if (!opened || !isDailyStatus(value)) return;
    void store
      .setStatus(opened.taskId, opened.nodeId, value)
      .then(() => setOpened(null))
      .catch(() => undefined);
  };

  const addSubtask = () => {
    if (
      !opened ||
      !openedRevision ||
      !futureNode ||
      openedTemplate?.deletedFrom
    )
      return;
    setEditor({
      mode: "add",
      taskId: opened.taskId,
      parentId: opened.nodeId,
      parentTitle: openedRevision.tree.title,
    });
    setOpened(null);
  };

  const saveEditor = async (
    fields: DailyNodeFields,
    schedule?: DailySchedule,
  ) => {
    if (!editor) return;
    if (editor.mode === "create") {
      if (!schedule) throw new Error("Укажите расписание задачи");
      await store.create({
        schedule,
        tree: {
          ...editor.input.tree,
          title: fields.title,
          note: fields.note || null,
        },
      });
    } else if (editor.mode === "add") {
      await store.addSubtask(editor.taskId, editor.parentId, fields);
    } else {
      await store.editNode(editor.taskId, editor.nodeId, fields, schedule);
    }
  };

  const toggle = (taskId: string, node: DailyTaskNode) => {
    void store
      .setStatus(taskId, node.id, node.status === "todo" ? "done" : "todo")
      .catch(() => undefined);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <TopBar
        title="Ежедневные задачи"
        perfectStreak={store.streaks.perfect}
        activeStreak={store.streaks.active}
        onStreakPress={() => setStreakOpen(true)}
      />
      <WeekCalendar
        selectedDate={store.selectedDate}
        today={store.today}
        onSelectDate={store.selectDate}
        dayState={(date) => {
          const items = resolveDailyDay(store.snapshot, date, store.today);
          if (!items.length) return "empty";
          if (items.every((item) => item.tree.status === "done")) return "done";
          if (items.some((item) => item.tree.status === "failed"))
            return "failed";
          if (items.every((item) => item.tree.status === "excused"))
            return "excused";
          return "todo";
        }}
      />
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => store.selectDate(store.today)}>
          <Text className="text-sm text-primary">Сегодня</Text>
        </Pressable>
        <Pressable
          accessibilityState={{ selected: managing }}
          onPress={() => setManaging(!managing)}
        >
          <Text className="text-sm text-primary">
            {managing ? "К задачам дня" : "Все повторения"}
          </Text>
        </Pressable>
      </View>
      {!!store.error && (
        <View className="mx-4 mb-3 gap-2 rounded-xl border border-error p-3">
          <Text accessibilityRole="alert" className="text-sm text-error">
            {store.error}
          </Text>
          <Pressable
            disabled={busy}
            onPress={() => {
              void store.load();
            }}
          >
            <Text className="text-sm text-foreground">Повторить загрузку</Text>
          </Pressable>
        </View>
      )}
      {!store.loaded && store.loading ? (
        <Loader />
      ) : (
        <View className="flex-1">
          {managing ? (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 110,
                gap: 16,
              }}
            >
              <Text className="text-lg font-semibold text-foreground">
                Все повторения
              </Text>
              <Text className="text-sm text-muted-foreground">
                Здесь доступны и задачи, которых нет в выбранный день. Нажмите,
                чтобы изменить расписание и подзадачи.
              </Text>
              {store.templates.length === 0 && (
                <Text className="py-8 text-center text-muted-foreground">
                  Повторений пока нет. Создайте первое.
                </Text>
              )}
              {store.templates.map((template) => {
                const revision =
                  template.revisions[template.revisions.length - 1];
                if (!revision) return null;
                return (
                  <View
                    key={template.id}
                    className="gap-2 rounded-2xl bg-surface p-4"
                  >
                    <Task
                      item={revision.tree}
                      onPress={(nodeId) =>
                        setOpened({
                          taskId: template.id,
                          nodeId,
                          template: true,
                        })
                      }
                      onToggle={() => undefined}
                      toggleDisabled
                    />
                    <Text className="mt-1 text-sm text-muted-foreground">
                      {revision.schedule.frequency === "weekly"
                        ? `Каждые ${revision.schedule.intervalWeeks} нед. · ${revision.schedule.daysOfWeek.map((day) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][day]).join(", ")}`
                        : `${revision.schedule.dayOfMonth}-го числа каждого месяца`}
                    </Text>
                    {revision.effectiveFrom > store.today && (
                      <Text className="mt-1 text-xs text-primary">
                        Новая версия с{" "}
                        {dayjs(revision.effectiveFrom).format("D MMMM")}
                      </Text>
                    )}
                    <Pressable
                      disabled={busy}
                      onPress={() =>
                        setDeleting({
                          taskId: template.id,
                          nodeId: template.id,
                        })
                      }
                      className="self-start py-2"
                    >
                      <Text className="text-sm text-error">
                        Удалить повторение
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <DailyTaskList
              tasks={tasks}
              onOpen={(taskId, nodeId) => setOpened({ taskId, nodeId })}
              onToggle={toggle}
              readOnly={readOnly}
              busy={busy}
              header={
                <View className="mb-4 gap-4">
                  <View className="gap-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {dayjs(store.selectedDate).format("D MMMM, dddd")}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {tasks.length
                        ? `Выполнено ${completed} из ${tasks.length}`
                        : "Нет запланированных задач"}
                      {readOnly
                        ? store.selectedDate < store.today
                          ? " · история"
                          : " · предварительный просмотр"
                        : ""}
                    </Text>
                  </View>
                  {readOnly && (
                    <Text className="text-xs text-muted-foreground">
                      Отметки доступны за сегодня. Содержимое повторения можно
                      изменить через «Все повторения».
                    </Text>
                  )}
                  {!tasks.length && (
                    <View className="gap-2 rounded-2xl bg-surface p-6">
                      <Text className="text-base font-semibold text-foreground">
                        Свободный день
                      </Text>
                      <Text className="text-sm leading-5 text-muted-foreground">
                        На эту дату ничего не запланировано. Дни без задач
                        сохраняют стрики.
                      </Text>
                    </View>
                  )}
                </View>
              }
            />
          )}
        </View>
      )}
      <AddTaskButton
        disabled={busy || !store.loaded}
        context="daily"
        onPress={create}
      />
      <StreakSheet visible={streakOpen} onClose={() => setStreakOpen(false)} />
      <TaskSheet
        visible={!!openedNode}
        task={openedNode ?? null}
        context="daily"
        readOnly={readOnly && !opened?.template}
        statusReadOnly={!!opened?.template}
        disabled={busy}
        actionsAvailable={!!futureNode && !openedTemplate?.deletedFrom}
        notice={
          opened?.template
            ? "Изменения повторения вступают в силу завтра. Отметки за сегодня доступны в списке задач дня."
            : readOnly
              ? "Только просмотр. Отметки доступны за сегодня."
              : openedTemplate?.deletedFrom
                ? "Повторение удалено с завтра. Сегодняшние отметки доступны."
                : !futureNode
                  ? "Подзадача удалена с завтра. Сегодняшние отметки доступны."
                  : undefined
        }
        error={store.error}
        onStatusChange={status}
        onEdit={() => {
          if (opened) edit(opened.taskId, opened.nodeId);
        }}
        onAddSubtask={addSubtask}
        onDelete={() => {
          if (opened) {
            setDeleting({ taskId: opened.taskId, nodeId: opened.nodeId });
            setOpened(null);
          }
        }}
        onClose={() => setOpened(null)}
      />
      {editor && (
        <DailyTaskFormSheet
          title={
            editor.mode === "create"
              ? "Новая задача"
              : editor.mode === "add"
                ? "Новая подзадача"
                : "Редактировать задачу"
          }
          initialValues={
            editor.mode === "edit" ? editor.fields : { title: "", note: "" }
          }
          schedule={
            editor.mode === "create"
              ? editor.input.schedule
              : editor.mode === "edit"
                ? editor.schedule
                : undefined
          }
          parentTitle={
            editor.mode === "create" ? undefined : editor.parentTitle
          }
          creating={editor.mode !== "edit"}
          effectiveTomorrow={editor.mode !== "create"}
          onSubmit={saveEditor}
          onClose={() => setEditor(null)}
        />
      )}
      <ConfirmModal
        visible={deleting !== null}
        title={
          deleting?.nodeId === deleting?.taskId
            ? "Удалить повторение?"
            : "Удалить подзадачу?"
        }
        message={
          deleting?.nodeId === deleting?.taskId
            ? "Задача перестанет появляться с завтра. Сегодняшняя задача, прошлые результаты и подзадачи останутся в истории."
            : "Подзадача и её вложенные подзадачи будут удалены с завтра. Сегодняшняя задача и история сохранятся. Расписание родителя не изменится."
        }
        onCancel={() => {
          if (!busy) setDeleting(null);
        }}
        onConfirm={() => {
          if (deleting && !busy)
            void (
              deleting.nodeId === deleting.taskId
                ? store.delete(deleting.taskId)
                : store.deleteSubtask(deleting.taskId, deleting.nodeId)
            )
              .then(() => setDeleting(null))
              .catch(() => setDeleting(null));
        }}
      />
    </SafeAreaView>
  );
}

export default observer(DailyScreen);
