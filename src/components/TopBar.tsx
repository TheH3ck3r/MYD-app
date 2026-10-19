import { BoltIcon, FireIcon } from "@/assets/icons";
import { Pressable, Text, View } from "react-native";

type TopBarProps = {
  title: string;
  perfectStreak?: number;
  activeStreak?: number;
  onStreakPress?: () => void;
};

export const TopBar = ({
  title,
  perfectStreak,
  activeStreak,
  onStreakPress,
}: TopBarProps) => {
  const showStreaks = perfectStreak !== undefined && activeStreak !== undefined;

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
      <Text className="text-foreground text-lg font-semibold">{title}</Text>

      {showStreaks && (
        <Pressable
          onPress={onStreakPress}
          className="flex-row items-center gap-4 min-w-[90px]"
        >
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
        </Pressable>
      )}
    </View>
  );
};
