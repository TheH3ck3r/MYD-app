import { ListIcon } from "@/assets/icons";
import { TaskActionContext } from "@/types/tasks";
import { View, Text } from "react-native";

type NoTasksProps = {
  context: TaskActionContext;
};

export const NoTasks = ({ context }: NoTasksProps) =>
  context === "regular" ? (
    <View className="flex-1 items-center justify-center px-6 gap-4">
      <View className="w-16 h-16 rounded-2xl bg-foreground items-center justify-center ">
        <ListIcon size={32} color="#121417" />
      </View>
      <Text className="text-foreground text-lg font-medium text-center">
        Пока нет задач
      </Text>
      <Text className="text-muted-foreground text-sm text-center">
        Нажмите на кнопку «+» в правом нижнем углу, чтобы добавить первую!
      </Text>
    </View>
  ) : (
    <View className="flex-1 items-center justify-center px-6 gap-4">
      <View className="w-16 h-16 rounded-2xl bg-foreground items-center justify-center ">
        <ListIcon size={32} color="#121417" />
      </View>
      <Text className="text-foreground text-lg font-medium text-center">
        На сегодня нет задач
      </Text>
      <Text className="text-muted-foreground text-sm text-center">
        Нажмите на кнопку «+» в правом нижнем углу, чтобы добавить ежедневные
        задачи на разные дни недели!
      </Text>
    </View>
  );
