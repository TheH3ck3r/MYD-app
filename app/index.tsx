import { useState } from "react";
import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopBar } from "@/components/TopBar";
import { SideMenu } from "@/components/SideMenu";
// import { SideMenu } from "@/components/SideMenu";

export default function HomeScreen() {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <TopBar onMenuPress={() => setMenuVisible(true)} />

      <View className="flex-1 items-center justify-center">
        <Text className="text-foreground text-base">Главный экран</Text>
      </View>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}
