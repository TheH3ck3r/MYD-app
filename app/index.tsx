import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { EditButton } from "@/ui/EditButton";
import { TaskList } from "@/components/TaskList";
import { TaskItem } from "@/types/task";
import { MOCK_TASKS } from "./testData";

export default function HomeScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar />

      <View className="flex-1">
        <TaskList
          list={tasks}
          onToggle={() => {
            console.log("onToggle");
          }}
          onPress={() => {
            console.log("onPress");
          }}
          onLongPress={() => {
            console.log("onLongPress");
          }}
        />
      </View>

      <EditButton
        onPress={() => {
          console.log("test");
        }}
      />
    </SafeAreaView>
  );
}
