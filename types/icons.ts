import { SharedValue } from "react-native-reanimated";

export type IconProps = {
  progress: SharedValue<number>;
  size?: number;
  color?: string;
};
