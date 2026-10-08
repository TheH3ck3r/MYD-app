import { BoltIcon } from "@/assets/icons/BoltIcon";
import { FireIcon } from "@/assets/icons/FireIcon";
import { Text, View } from "react-native";

type Props = {
  title: string;
  perfectStreak?: number;
  activeStreak?: number;
};

export const TopBar = ({ title, perfectStreak, activeStreak }: Props) => {
  const showStreaks = perfectStreak !== undefined && activeStreak !== undefined;

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
      <Text className="text-foreground text-lg font-semibold">{title}</Text>

      <View className="flex-row items-center gap-4 min-w-[90px]">
        {showStreaks && (
          <>
            <View className="flex-row items-center gap-1">
              <FireIcon size={20} />
              <Text className="text-foreground text-base font-medium">
                {perfectStreak}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <BoltIcon size={20} />
              <Text className="text-foreground text-base font-medium">
                {activeStreak}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};
