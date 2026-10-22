import { IconProps } from "@/src/types/icons";
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const LEFT_PATH = "M9 6L9 18";
const RIGHT_PATH = "M15 6L15 18";
const LINE_LENGTH = 12;
const LINE_STROKE = 3;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const PauseIcon = ({
  progress: progressProp,
  size = 16,
  color = "white",
}: IconProps) => {
  const fallback = useSharedValue(1);
  const progress = progressProp ?? fallback;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: LINE_LENGTH * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedPath
        d={LEFT_PATH}
        stroke={color}
        strokeWidth={LINE_STROKE}
        strokeLinecap="round"
        strokeDasharray={LINE_LENGTH}
        animatedProps={animatedProps}
      />
      <AnimatedPath
        d={RIGHT_PATH}
        stroke={color}
        strokeWidth={LINE_STROKE}
        strokeLinecap="round"
        strokeDasharray={LINE_LENGTH}
        animatedProps={animatedProps}
      />
    </Svg>
  );
};
