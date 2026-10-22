import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { TaskActionContext } from "@/types/tasks";
import { AddIcon } from "@/assets/icons";

type AddTaskButtonProps = {
  context: TaskActionContext;
  onPress: (context: TaskActionContext) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AddTaskButton = ({ context, onPress }: AddTaskButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onPress(context)}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 50, stiffness: 1000 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 1000 });
      }}
      style={animatedStyle}
      className="absolute bottom-8 right-8 h-12 w-12 p-4 rounded-lg bg-foreground items-center justify-center active:opacity-80 active:scale-90 shadow-lg"
    >
      <AddIcon size={24} />
    </AnimatedPressable>
  );
};
