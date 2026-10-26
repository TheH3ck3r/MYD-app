import { IconProps } from "@/types/icons";
import Svg, { Path } from "react-native-svg";

const VIEWBOX_WIDTH = 12;
const VIEWBOX_HEIGHT = 7;

export const ChevronIcon = ({ size = 12, color = "white" }: IconProps) => {
  const height = size * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH);

  return (
    <Svg
      width={size}
      height={height}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      fill="none"
    >
      <Path
        d="M6 4.74608L10.4242 0.273317C10.5974 0.0982277 10.8322 -8.74995e-05 11.0771 5.84356e-08C11.3219 8.76164e-05 11.5567 0.0985705 11.7298 0.273784C11.9029 0.448997 12.0001 0.686588 12 0.93429C11.9999 1.18199 11.9026 1.41951 11.7294 1.5946L6.6526 6.7266C6.4795 6.90166 6.24476 7 6 7C5.75524 7 5.5205 6.90166 5.34741 6.7266L0.27064 1.5946C0.0974388 1.41951 8.66085e-05 1.18199 5.77598e-08 0.93429C-8.6493e-05 0.686588 0.0970997 0.448997 0.270179 0.273784C0.443258 0.0985705 0.678052 8.76182e-05 0.922909 5.84356e-08C1.16777 -8.75014e-05 1.40263 0.0982277 1.57583 0.273317L6 4.74608Z"
        fill={color}
      />
    </Svg>
  );
};
