import { IconProps } from "@/types/icons";
import Animated, {
  interpolate,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const TOP_PATH = "M6 6L18 18";
const BOTTOM_PATH = "M6 18L18 6";

const LINE_LENGTH = 18;
const LINE_STROKE = 3;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const CrossIcon = ({
  progress: progressProp,
  size = 16,
  color = "white",
}: IconProps) => {
  const fallback = useSharedValue(1);
  const progress = progressProp ?? fallback;

  const topProps = useAnimatedProps(() => ({
    strokeDashoffset: LINE_LENGTH * (1 - progress.value),
  }));

  const bottomProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      progress.value,
      [0, 0.2, 1],
      [LINE_LENGTH, LINE_LENGTH, 0],
    ),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedPath
        d={TOP_PATH}
        stroke={color}
        strokeWidth={LINE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={LINE_LENGTH}
        animatedProps={topProps}
      />
      <AnimatedPath
        d={BOTTOM_PATH}
        stroke={color}
        strokeWidth={LINE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={LINE_LENGTH}
        animatedProps={bottomProps}
      />
    </Svg>
  );
};
