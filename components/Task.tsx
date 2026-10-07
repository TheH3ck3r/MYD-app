import { TaskItem, TaskStatus } from "@/types/task";
import { Checkbox } from "@/ui/Checkbox";
import { memo } from "react";
import { Pressable, View, Text } from "react-native";

type TaskProps = {
  item: TaskItem;
  depth?: number;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
};

const INDENT = 24;

export const Task = memo(
  ({ item, depth = 0, onToggle, onPress, onLongPress }: TaskProps) => {
    return (
      <View className="flex-col">
        <View
          className="flex-row justify-between py-2 px-4 gap-4"
          style={{ paddingLeft: depth * INDENT }}
        >
          <Pressable
            onPress={() => onPress(item.id)}
            onLongPress={onLongPress ? () => onLongPress(item.id) : undefined}
            delayLongPress={400}
            className="flex-1"
          >
            <Text className="text-foreground text-base leading-6 ">
              {item.title}
            </Text>
          </Pressable>

          <Checkbox status={item.status} onPress={() => onToggle(item.id)} />
        </View>

        {item.children.map((child) => (
          <Task
            key={child.id}
            item={child}
            depth={depth + 1}
            onToggle={onToggle}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        ))}
      </View>
    );
  },
);
