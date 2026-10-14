import {
  AddIcon,
  CheckIcon,
  CrossIcon,
  DashIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
} from "@/assets/icons";
import { TaskItem, TaskStatus } from "@/types/tasks";
import { ActionSheet } from "@/ui/ActionSheet";
import { Button, ButtonIcon, ButtonText } from "@/ui/Button";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export type TaskActionContext = "regular" | "daily";

const STATUSES_BY_CONTEXT: Record<TaskActionContext, TaskStatus[]> = {
  regular: ["todo", "done", "failed", "paused"],
  daily: ["todo", "done", "failed", "excused"],
};

const LABEL: Record<TaskStatus, string> = {
  todo: "Не сделано",
  done: "Выполнено",
  failed: "Провалено",
  excused: "Пропущено",
  paused: "Отложено",
};

const STATUS_ICON: Record<TaskStatus, ReactNode> = {
  todo: <View className="w-6 h-6 rounded border-2 border-border" />,
  done: (
    <View className="w-6 h-6 rounded bg-success items-center justify-center">
      <CheckIcon size={14} />
    </View>
  ),
  failed: (
    <View className="w-6 h-6 rounded bg-failed items-center justify-center">
      <CrossIcon size={14} />
    </View>
  ),
  excused: (
    <View className="w-6 h-6 rounded bg-muted-foreground items-center justify-center">
      <DashIcon size={14} />
    </View>
  ),
  paused: (
    <View className="w-6 h-6 rounded bg-muted-foreground items-center justify-center">
      <PauseIcon size={14} />
    </View>
  ),
};

type TaskActionProps = {
  visible: boolean;
  task: TaskItem | null;
  context: TaskActionContext;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onAddSubtask: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export const TaskAction = ({
  visible,
  task,
  context,
  onStatusChange,
  onEdit,
  onAddSubtask,
  onDelete,
  onClose,
}: TaskActionProps) => {
  const statuses = STATUSES_BY_CONTEXT[context];

  return (
    <ActionSheet visible={visible} title={task?.title ?? ""} onClose={onClose}>
      {!!task?.note && task.note.trim().length > 0 && (
        <View>
          <View className="mx-6 mb-2 -my-2 px-3 py-2 rounded-lg bg-surface">
            <Text className="text-sm leading-5 text-muted-foreground">
              {task!.note}
            </Text>
          </View>

          <View className="h-px bg-border mx-6 mt-2 mb-4" />
        </View>
      )}

      {statuses.map((status) => {
        const active = status === task?.status;

        return (
          <Pressable
            key={status}
            onPress={() => onStatusChange(status)}
            className={`flex-row items-center gap-3 px-4 py-3 rounded-xl mx-2 active:opacity-60 ${
              active ? "bg-surface" : ""
            }`}
          >
            <View className="w-6 h-6 items-center justify-center">
              {STATUS_ICON[status]}
            </View>

            <Text
              className={`text-base ${
                active ? "text-foreground font-semibold" : "text-foreground"
              }`}
            >
              {LABEL[status]}
            </Text>
          </Pressable>
        );
      })}

      <View className="h-px bg-border mx-6 my-2" />

      <View className="flex-col">
        <Button
          variant="ghost"
          align="start"
          className="mx-2"
          onPress={onAddSubtask}
        >
          <ButtonIcon className="w-6 h-6">
            <AddIcon size={24} color="#9CA3AF" />
          </ButtonIcon>
          <ButtonText>Добавить подзадачу</ButtonText>
        </Button>

        <Button variant="ghost" align="start" className="mx-2" onPress={onEdit}>
          <ButtonIcon className="w-6 h-6">
            <PencilIcon size={16} color="#9CA3AF" />
          </ButtonIcon>
          <ButtonText>Редактировать</ButtonText>
        </Button>

        <Button
          variant="ghost"
          action="destructive"
          align="start"
          className="mx-2"
          onPress={onDelete}
        >
          <ButtonIcon className="w-6 h-6">
            <TrashIcon size={20} color="#FF5C5C" />
          </ButtonIcon>
          <ButtonText>Удалить</ButtonText>
        </Button>
      </View>
    </ActionSheet>
  );
};
