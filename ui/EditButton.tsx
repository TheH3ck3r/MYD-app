import { FC } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { EditSquareIcon } from "@/assets/icons/EditSquareIcon";

type EditButtonProps = {
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const EditButton: FC<EditButtonProps> = ({ onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 50, stiffness: 1000 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 1000 });
      }}
      style={animatedStyle}
      className="absolute bottom-8 right-8 h-16 w-16 p-4 rounded-lg bg-foreground items-center justify-center active:opacity-80 active:scale-90 shadow-lg"
    >
      <EditSquareIcon />
    </AnimatedPressable>
  );
};
