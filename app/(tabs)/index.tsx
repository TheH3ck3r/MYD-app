import { TopBar } from "@/components/TopBar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DailyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <TopBar title="Ежедневные задачи" perfectStreak={12} activeStreak={47} />
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Скоро</Text>
      </View>
    </SafeAreaView>
  );
}
