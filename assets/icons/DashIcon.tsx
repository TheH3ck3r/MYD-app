import { IconProps } from "@/types/icons";
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const DASH_PATH = "M6 12L18 12";
const DASH_LENGTH = 12;
const DASH_STROKE = 3;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const DashIcon = ({
  progress: progressProp,
  size = 16,
  color = "white",
}: IconProps) => {
  const fallback = useSharedValue(1);
  const progress = progressProp ?? fallback;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: DASH_LENGTH * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <AnimatedPath
        d={DASH_PATH}
        stroke={color}
        strokeWidth={DASH_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={DASH_LENGTH}
        animatedProps={animatedProps}
      />
    </Svg>
  );
};
