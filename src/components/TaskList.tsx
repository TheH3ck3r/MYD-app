import { ScrollView, View } from "react-native";
import { TaskItem } from "@/types/tasks";
import { Task } from "./Task";

type TaskListProps = {
  list: TaskItem[];
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
};

export const TaskList = ({ list, onToggle, onPress }: TaskListProps) => {
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {list.map((item, index) => (
        <View key={item.id}>
          {index > 0 && <View className="h-px bg-border my-2" />}
          <Task item={item} onToggle={onToggle} onPress={onPress} />
        </View>
      ))}
    </ScrollView>
  );
};
