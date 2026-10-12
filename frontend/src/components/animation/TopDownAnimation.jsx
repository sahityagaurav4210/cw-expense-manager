import React, { useRef } from "react";
import { Box } from "@mui/material";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * TopDownAnimation: Reusable plug-and-play component providing GSAP top-down entrance motion.
 * Re-triggers whenever the trigger dependency changes (e.g., metric value updates).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Target element to animate (e.g. Typography)
 * @param {*} [props.trigger] - Value or state triggering the animation on change
 * @param {number} [props.yOffset=-36] - Initial Y offset (negative for top-down)
 * @param {number} [props.duration=0.75] - Animation duration in seconds
 * @param {number} [props.delay=0] - Optional delay before animation starts
 * @param {string} [props.ease="back.out(1.2)"] - GSAP easing curve
 * @param {Object} [props.sx] - Sx styling for the outer clipping container
 * @param {Object} [props.innerSx] - Sx styling for the animated wrapper
 */
const TopDownAnimation = ({
  children,
  trigger,
  yOffset = -36,
  duration = 0.75,
  delay = 0,
  ease = "back.out(1.2)",
  sx = {},
  innerSx = {},
  ...boxProps
}) => {
  const contentRef = useRef(null);

  useGSAP(
    () => {
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          {
            y: yOffset,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration,
            delay,
            ease,
            clearProps: "transform",
          },
        );
      }
    },
    { dependencies: [trigger !== undefined ? trigger : children] },
  );

  return (
    <Box
      sx={{
        overflow: "hidden",
        display: "block",
        width: "100%",
        ...sx,
      }}
      {...boxProps}
    >
      <Box
        ref={contentRef}
        sx={{
          display: "block",
          width: "100%",
          willChange: "transform, opacity",
          ...innerSx,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default React.memo(TopDownAnimation);
