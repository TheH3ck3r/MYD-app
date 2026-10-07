import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { EditButton } from "@/ui/EditButton";
import { TaskList } from "@/components/TaskList";
import { TaskItem } from "@/types/task";
import { MOCK_TASKS } from "./testData";
import { FireIcon } from "@/assets/icons/FireIcon";
import { BoltIcon } from "@/assets/icons/BoltIcon";
import { SettingsIcon } from "@/assets/icons/Settingsicon";
import { CalendarIcon } from "@/assets/icons/CalendarIcon";
import { ListIcon } from "@/assets/icons/Listicon";

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

      <View className="flex-1 items-center gap-4">
        <FireIcon></FireIcon>
        <BoltIcon></BoltIcon>
        <SettingsIcon></SettingsIcon>
        <CalendarIcon></CalendarIcon>
        <ListIcon></ListIcon>
      </View>

      <EditButton
        onPress={() => {
          console.log("test");
        }}
      />
    </SafeAreaView>
  );
}
