import { IconProps } from "@/src/types/icons";
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const CHECK_PATH = "M4 12L10 18L20 6";
const CHECK_LENGTH = 25;
const CHECK_STROKE = 3;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const CheckIcon = ({
  progress: progressProp,
  size = 16,
  color = "white",
}: IconProps) => {
  const fallback = useSharedValue(1);
  const progress = progressProp ?? fallback;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedPath
        d={CHECK_PATH}
        stroke={color}
        strokeWidth={CHECK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={CHECK_LENGTH}
        animatedProps={animatedProps}
      />
    </Svg>
  );
};
