import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TopBarProps {
  title?: string;
  onMenuPress: () => void;
}

export const TopBar = ({ title = "MYD", onMenuPress }: TopBarProps) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 bg-background border-b border-border">
      <Text className="text-foreground text-lg font-semibold">{title}</Text>
      <Pressable onPress={onMenuPress} hitSlop={12} className="p-1">
        <Ionicons name="menu" size={26} className="!text-foreground" />
      </Pressable>
    </View>
  );
};
