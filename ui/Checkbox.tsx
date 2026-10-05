import { CheckIcon } from "@/assets/icons/CheckIcon";
import { TaskStatus } from "@/types/task";
import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type CheckboxProps = {
  status: TaskStatus;
  onPress: () => void;
};

const STATUS_STYLE: Record<TaskStatus, { bg: string; border: string }> = {
  todo: { bg: "bg-transparent", border: "border-border" },
  done: { bg: "bg-success", border: "border-success" },
  failed: { bg: "bg-failed", border: "border-failed" },
  excused: { bg: "bg-muted-foreground", border: "border-muted-foreground" },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Checkbox = ({ status, onPress }: CheckboxProps) => {
  const checkProgress = useSharedValue(status === "done" ? 1 : 0);
  const isFirst = useRef(true);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    checkProgress.value = isFirst.current
      ? status === "done"
        ? 1
        : 0
      : withTiming(status === "done" ? 1 : 0, { duration: 200 });
    isFirst.current = false;
  }, [status]);

  const styles = STATUS_STYLE[status];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 50, stiffness: 500 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 50, stiffness: 500 });
      }}
      style={animatedStyle}
      hitSlop={8}
    >
      <View
        className={`h-6 w-6 rounded border-2 items-center justify-center ${styles.bg} ${styles.border}`}
      >
        <View className="absolute">
          <CheckIcon progress={checkProgress} />
        </View>
      </View>
    </AnimatedPressable>
  );
};
