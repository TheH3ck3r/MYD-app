import { IconProps } from "@/types/icons";
import Svg, { Path } from "react-native-svg";

export const AddIcon = ({ size = 24, color = "black" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 12L18 12"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
    />
    <Path
      d="M12 6L12 18"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
    />
  </Svg>
);
