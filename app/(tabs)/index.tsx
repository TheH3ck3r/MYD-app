import { CheckIcon } from "@/assets/icons";
import { StreakSheet } from "@/components/StreakSheet";
import { TopBar } from "@/components/TopBar";
import { notifyStore } from "@/stores/notifyStore";
import { Button, ButtonText } from "@/ui/Button";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DailyScreen() {
  const [isStreakSheetOpen, setIsStreakSheetOpen] = useState<boolean>(false);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <TopBar
        title="Ежедневные задачи"
        perfectStreak={12}
        activeStreak={47}
        onStreakPress={() => setIsStreakSheetOpen(true)}
      />

      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Скоро</Text>
        <Button
          variant="ghost"
          align="start"
          className="mx-2"
          onPress={() => {
            notifyStore.show({
              icon: <CheckIcon size={16} color="#84DCC6" />,
              message: 'Задача "..." выполнена',
              action: "success",
            });
          }}
        >
          <ButtonText>test</ButtonText>
        </Button>
      </View>

      <StreakSheet
        visible={isStreakSheetOpen}
        onClose={() => setIsStreakSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
