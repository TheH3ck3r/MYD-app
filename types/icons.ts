import { SharedValue } from "react-native-reanimated";

export type IconProps = {
  size?: number;
  color?: string;
};

export type AnimatedIconProps = IconProps & {
  progress: SharedValue<number>;
};
