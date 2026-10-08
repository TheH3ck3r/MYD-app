import { CheckIcon } from "@/assets/icons/CheckIcon";
import { CrossIcon } from "@/assets/icons/CrossIcon";
import { DashIcon } from "@/assets/icons/DashIcon";
import { TaskStatus } from "@/types/task";
import { Pressable, Text, View } from "react-native";

const LABEL: Record<TaskStatus, string> = {
  todo: "Не сделано",
  done: "Выполнено",
  failed: "Провалено",
  excused: "Пропущено",
};

type Props = {
  status: TaskStatus;
  active: boolean;
  onPress: () => void;
};

export const ActionItemStatus = ({ status, active, onPress }: Props) => {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl mx-2 active:opacity-60 ${
        active ? "bg-surface" : ""
      }`}
    >
      <View className="w-6 h-6 items-center justify-center">
        {status === "todo" && (
          <View className="w-5 h-5 rounded border-2 border-border" />
        )}
        {status === "done" && (
          <View className="w-6 h-6 rounded bg-success items-center justify-center">
            <CheckIcon size={14} color="white" />
          </View>
        )}
        {status === "failed" && (
          <View className="w-6 h-6 rounded bg-failed items-center justify-center">
            <CrossIcon size={14} color="white" />
          </View>
        )}
        {status === "excused" && (
          <View className="w-6 h-6 rounded bg-muted-foreground items-center justify-center">
            <DashIcon size={14} color="white" />
          </View>
        )}
      </View>

      <Text
        className={`text-base ${
          active ? "text-primary font-semibold" : "text-foreground"
        }`}
      >
        {LABEL[status]}
      </Text>
    </Pressable>
  );
};
