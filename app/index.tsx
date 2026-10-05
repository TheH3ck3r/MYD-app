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

  const [status, setStatus] = useState<TaskStatus>("todo");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar onMenuPress={() => setMenuVisible(true)} />

      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-foreground text-base">Главный экран</Text>

        <Checkbox status={status} onPress={() => setStatus("done")} />

        <Button title="очистка" onPress={() => setStatus("todo")}></Button>
      </View>

      <EditButton
        onPress={() => {
          console.log("test");
        }}
      />
    </SafeAreaView>
  );
}
