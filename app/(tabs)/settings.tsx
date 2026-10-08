import { TopBar } from "@/components/TopBar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <TopBar title="Настройки" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Скоро</Text>
      </View>
    </SafeAreaView>
  );
}
