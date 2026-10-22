import { IconProps } from "@/src/types/icons";
import Svg, { Path } from "react-native-svg";

export const AlertIcon = ({ size = 24, color = "white" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13.3333 13.3333H10.6667V5.33333H13.3333M10.6667 16H13.3333V18.6667H10.6667M16.9733 0H7.02667L0 7.02667V16.9733L7.02667 24H16.9733L24 16.9733V7.02667L16.9733 0Z"
      fill={color}
    />
  </Svg>
);
