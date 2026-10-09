import { CheckIcon } from "@/assets/icons/CheckIcon";
import { CrossIcon } from "@/assets/icons/CrossIcon";
import { PauseIcon } from "@/assets/icons/PasuseIcon";
import { TaskStatus } from "@/types/tasks";
import { Pressable, Text, View } from "react-native";

const LABEL: Record<TaskStatus, string> = {
  todo: "Не сделано",
  done: "Выполнено",
  failed: "Провалено",
  excused: "Пропущено",
  paused: "Отложено",
};

type RegularActionStatusItemProps = {
  status: TaskStatus;
  active: boolean;
  onPress: () => void;
};

export const RegularActionStatusItem = ({
  status,
  active,
  onPress,
}: RegularActionStatusItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl mx-2 active:opacity-60 ${
        active ? "bg-surface" : ""
      }`}
    >
      <View className="w-6 h-6 items-center justify-center">
        {status === "todo" && (
          <View className="w-6 h-6 rounded border-2 border-border" />
        )}
        {status === "done" && (
          <View className="w-6 h-6 rounded bg-success items-center justify-center">
            <CheckIcon size={14} />
          </View>
        )}
        {status === "failed" && (
          <View className="w-6 h-6 rounded bg-failed items-center justify-center">
            <CrossIcon size={14} />
          </View>
        )}
        {status === "paused" && (
          <View className="w-6 h-6 rounded bg-muted-foreground items-center justify-center">
            <PauseIcon size={14} />
          </View>
        )}
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
};
