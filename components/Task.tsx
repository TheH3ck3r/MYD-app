import { TaskStatus } from "@/types/task";
import { Checkbox } from "@/ui/Checkbox";
import { Pressable, View, Text } from "react-native";

type TaskProps = {
  title: string;
  status: TaskStatus;
  onToggle: () => void;
  onPress: () => void;
  onLongPress?: () => void;
};

export const Task = ({
  title,
  status,
  onToggle,
  onPress,
  onLongPress,
}: TaskProps) => {
  return (
    <View className="flex-row justify-between py-2 px-4 gap-4">
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        className="flex-shrink"
      >
        <Text className="text-foreground leading-6">{title}</Text>
      </Pressable>

      <View className="flex-1 self-start h-6 justify-center">
        <View className="h-px border-dotted border-t-2 border-border" />
      </View>

      <Checkbox status={status} onPress={onToggle} />
    </View>
  );
};
