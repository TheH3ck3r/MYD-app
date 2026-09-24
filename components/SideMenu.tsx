import { useEffect } from "react";
import { Modal, View, Text, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateX = useSharedValue(PANEL_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : PANEL_WIDTH, { duration: 250 });
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <Animated.View
          style={[panelStyle, { width: PANEL_WIDTH }]}
          className="absolute right-0 top-0 bottom-0 bg-surface px-5 pt-16"
        >
          <Pressable>
            <Text className="text-foreground text-lg font-semibold mb-6">
              Меню
            </Text>

            <View className="flex-row items-center justify-between py-3 border-b border-border">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={20}
                  className="!text-foreground"
                />
                <Text className="text-foreground text-base">Тёмная тема</Text>
              </View>

              <Pressable
                onPress={toggleColorScheme}
                className={`w-12 h-7 rounded-full px-0.5 justify-center ${
                  isDark ? "bg-primary items-end" : "bg-border items-start"
                }`}
              >
                <View className="w-6 h-6 rounded-full bg-white" />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
