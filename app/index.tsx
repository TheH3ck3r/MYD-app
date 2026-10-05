import { useState } from "react";
import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { EditButton } from "@/ui/EditButton";
import { Checkbox } from "@/ui/Checkbox";
import { TaskStatus } from "@/types/task";

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);

  const [status1, setStatus1] = useState<TaskStatus>("todo");
  const [status2, setStatus2] = useState<TaskStatus>("todo");
  const [status3, setStatus3] = useState<TaskStatus>("todo");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar onMenuPress={() => setMenuVisible(true)} />

      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-foreground text-base">Главный экран</Text>

        <View className="flex-row gap-4">
          <Checkbox status={status1} onPress={() => setStatus1("done")} />
          <Checkbox status={status2} onPress={() => setStatus2("failed")} />
          <Checkbox status={status3} onPress={() => setStatus3("excused")} />
        </View>

        <Button
          title="очистка"
          onPress={() => {
            setStatus1("todo");
            setStatus2("todo");
            setStatus3("todo");
          }}
        ></Button>
      </View>

      <EditButton
        onPress={() => {
          console.log("test");
        }}
      />
    </SafeAreaView>
  );
}
