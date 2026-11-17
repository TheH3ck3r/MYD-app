import { ScrollView, View, type ScrollViewProps } from "react-native";
import type { ReactNode } from "react";
import { TaskItem } from "@/types/tasks";
import { Task } from "./Task";

type TaskListProps = {
  list: TaskItem[];
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
  toggleDisabled?: boolean;
  header?: ReactNode;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
};

export const TaskList = ({
  list,
  onToggle,
  onPress,
  toggleDisabled = false,
  header,
  contentContainerStyle,
}: TaskListProps) => {
  return (
    <ScrollView
      contentContainerStyle={[
        { paddingHorizontal: 16, paddingVertical: 8 },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {header}
      {list.map((item, index) => (
        <View key={item.id}>
          {index > 0 && <View className="h-px bg-border my-2" />}
          <Task
            item={item}
            onToggle={onToggle}
            onPress={onPress}
            toggleDisabled={toggleDisabled}
          />
        </View>
      ))}
    </ScrollView>
  );
};
