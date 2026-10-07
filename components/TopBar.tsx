import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TopBarProps {
  title?: string;
}

export const TopBar = ({ title = "MYD" }: TopBarProps) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 bg-background border-b border-border">
      <Text className="text-foreground text-lg font-semibold">{title}</Text>
    </View>
  );
};
