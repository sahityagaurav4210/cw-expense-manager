import React, { useRef } from "react";
import { Typography } from "@mui/material";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * CountDownAnimation: A versatile, high-performance counting animation component built with GSAP.
 * Supports count-down and count-up numeric animations, decimal precision, localized separators,
 * and currency/unit prefixes and suffixes.
 *
 * Direct DOM text updates via GSAP ticker ensure buttery-smooth 60/120fps motion with zero React re-render overhead.
 *
 * @param {Object} props
 * @param {number|string} props.value - Target end numeric value
 * @param {number|string} [props.from] - Explicit starting numeric value (defaults to 0 or previous value)
 * @param {number} [props.duration=1.2] - Animation duration in seconds
 * @param {number} [props.delay=0] - Delay before counting starts in seconds
 * @param {string} [props.ease="power2.out"] - GSAP easing curve
 * @param {string} [props.prefix=""] - String prefix prepended to the number (e.g. "₹", "+")
 * @param {string} [props.suffix=""] - String suffix appended to the number (e.g. "%", " sec")
 * @param {number} [props.decimals] - Number of decimal places (auto-detected if omitted)
 * @param {string} [props.locale="en-IN"] - Number formatting locale (e.g. "en-IN", "en-US")
 * @param {function(number): string} [props.formatter] - Custom formatting callback
 * @param {string} [props.variant] - MUI Typography variant (e.g. "h3", "h4", "body1")
 * @param {string} [props.component="span"] - Underlying HTML tag or MUI component
 * @param {Object} [props.sx] - MUI Sx styling object
 */
const CountDownAnimation = ({
  value = 0,
  from,
  duration = 1.2,
  delay = 0,
  ease = "power2.out",
  prefix = "",
  suffix = "",
  decimals,
  locale = "en-IN",
  formatter,
  variant,
  component = "span",
  sx = {},
  ...typographyProps
}) => {
  const numberRef = useRef(null);
  const prevValueRef = useRef(from !== undefined ? Number(from) : 0);

  const targetNumber = parseFloat(value || 0) || 0;

  // Format helper for localized digits, decimals, prefix & suffix
  const formatNumber = (num) => {
    if (formatter && typeof formatter === "function") {
      return formatter(num);
    }

    const fixedDecimals =
      decimals !== undefined
        ? decimals
        : Number.isInteger(targetNumber)
        ? 0
        : 2;

    const formatted = num.toLocaleString(locale, {
      minimumFractionDigits: fixedDecimals,
      maximumFractionDigits: fixedDecimals,
    });

    return `${prefix}${formatted}${suffix}`;
  };

  useGSAP(
    () => {
      if (!numberRef.current) return;

      const startVal =
        from !== undefined ? Number(from) : prevValueRef.current;
      const counterObj = { val: startVal };

      const tween = gsap.to(counterObj, {
        val: targetNumber,
        duration,
        delay,
        ease,
        onUpdate: () => {
          if (numberRef.current) {
            numberRef.current.textContent = formatNumber(counterObj.val);
          }
        },
        onComplete: () => {
          if (numberRef.current) {
            numberRef.current.textContent = formatNumber(targetNumber);
          }
          prevValueRef.current = targetNumber;
        },
      });

      return () => {
        tween.kill();
      };
    },
    {
      dependencies: [
        targetNumber,
        from,
        duration,
        delay,
        ease,
        prefix,
        suffix,
        decimals,
        locale,
      ],
    },
  );

  const initialRender = formatNumber(
    from !== undefined ? Number(from) : targetNumber,
  );

  return (
    <Typography
      ref={numberRef}
      component={component}
      variant={variant}
      sx={{
        display: "inline-block",
        willChange: "contents",
        ...sx,
      }}
      {...typographyProps}
    >
      {initialRender}
    </Typography>
  );
};

export default React.memo(CountDownAnimation);
