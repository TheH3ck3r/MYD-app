import { CheckIcon } from "@/assets/icons/CheckIcon";
import { CrossIcon } from "@/assets/icons/CrossIcon";
import { DashIcon } from "@/assets/icons/DashIcon";
import { PauseIcon } from "@/assets/icons/PasuseIcon";
import { TaskStatus } from "@/types/tasks";
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
  paused: { bg: "bg-muted-foreground", border: "border-muted-foreground" },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Checkbox = ({ status, onPress }: CheckboxProps) => {
  const checkProgress = useSharedValue(status === "done" ? 1 : 0);
  const crossProgress = useSharedValue(status === "failed" ? 1 : 0);
  const dashProgress = useSharedValue(status === "excused" ? 1 : 0);
  const pausedProgress = useSharedValue(status === "paused" ? 1 : 0);
  const isFirst = useRef(true);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const checkTarget = status === "done" ? 1 : 0;
    const crossTarget = status === "failed" ? 1 : 0;
    const dashTarget = status === "excused" ? 1 : 0;
    const pausedTarget = status === "paused" ? 1 : 0;

    if (isFirst.current) {
      checkProgress.value = checkTarget;
      crossProgress.value = crossTarget;
      dashProgress.value = dashTarget;
      pausedProgress.value = pausedTarget;
      isFirst.current = false;
      return;
    }

    checkProgress.value = withTiming(checkTarget, { duration: 200 });
    crossProgress.value = withTiming(crossTarget, { duration: 200 });
    dashProgress.value = withTiming(dashTarget, { duration: 200 });
    pausedProgress.value = withTiming(pausedTarget, { duration: 200 });
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
        <View className="absolute">
          <CrossIcon progress={crossProgress} />
        </View>
        <View className="absolute">
          <DashIcon progress={dashProgress} />
        </View>
        <View className="absolute">
          <PauseIcon progress={pausedProgress} size={16} color="white" />
        </View>
      </View>
    </AnimatedPressable>
  );
};
