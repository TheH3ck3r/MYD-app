import { CrossIcon } from "../../assets/icons/CrossIcon";
import { notifyStore, NotifyAction } from "@/stores/notifyStore";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTION_STYLE: Record<NotifyAction, string> = {
  info: "bg-primary/10 border-primary/30",
  success: "bg-success/15 border-success/40",
  warning: "bg-secondary/15 border-secondary/40",
  error: "bg-error/15 border-error/40",
  muted: "bg-muted-foreground/10 border-muted-foreground/20",
};

export const Notify = observer(() => {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  const current = notifyStore.current;
  const isVisible = current !== null;
  const action = current?.action ?? "info";

  useEffect(() => {
    progress.value = withTiming(isVisible ? 1 : 0, {
      duration: isVisible ? 250 : 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 30 }],
  }));

  if (!current) return null;

  return (
    <Animated.View
      style={[animatedStyle, { bottom: insets.bottom + 100 }]}
      className="absolute left-4 right-4"
      pointerEvents="box-none"
    >
      <View
        className={`flex-row items-center gap-3 pl-4 pr-2 py-2 rounded-2xl border ${ACTION_STYLE[action]}`}
      >
        {current.icon && (
          <View className="w-5 h-5 items-center justify-center">
            {current.icon}
          </View>
        )}

        <Text className="flex-1 text-sm font-medium text-foreground">
          {current.message}
        </Text>

        <Pressable
          onPress={notifyStore.dismiss}
          hitSlop={12}
          className="w-8 h-8 items-center justify-center rounded-full active:bg-white/10"
        >
          <CrossIcon size={14} color="#9CA3AF" />
        </Pressable>
      </View>
    </Animated.View>
  );
});
