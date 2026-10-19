import { BoltIcon } from "@/assets/icons/BoltIcon";
import { FireIcon } from "@/assets/icons/FireIcon";
import { ActionSheet } from "@/ui/ActionSheet";
import { Text, View } from "react-native";

type StreakSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export const StreakSheet = ({ visible, onClose }: StreakSheetProps) => {
  return (
    <ActionSheet visible={visible} title="Стрики" onClose={onClose}>
      <View className="mx-6 mb-4 -mt-2 px-3 py-3 rounded-lg bg-surface">
        <Text className="text-foreground text-sm leading-5">
          Стрики — это счётчик дней подряд, в которые вы выполняете
          запланированное. Сегодняшний день не учитывается - он ещё не завершён.
        </Text>
      </View>

      <View className="h-px bg-border mx-6 mb-4" />

      <View className="px-6 gap-5 pb-2">
        <View className="flex-row gap-3">
          <View className="w-6 h-6 items-center justify-center">
            <FireIcon size={22} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-foreground text-base font-semibold">
              Perfect
            </Text>
            <Text className="text-muted-foreground text-sm leading-5">
              Все запланированные задачи выполнены. Если хотя бы одну провалили
              или не отметили — стрик сбрасывается.
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="w-6 h-6 items-center justify-center">
            <BoltIcon size={22} />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-foreground text-base font-semibold">
              Active
            </Text>
            <Text className="text-muted-foreground text-sm leading-5">
              Ни одной проваленной задачи. Пропуск по уважительной причине
              (болезнь, отпуск) не сбрасывает (статус задачи "пропущено").
              Провал или забытая отметка — сбрасывает.
            </Text>
          </View>
        </View>
      </View>
    </ActionSheet>
  );
};
