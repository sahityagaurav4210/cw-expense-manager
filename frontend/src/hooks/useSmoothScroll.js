import { useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";

// Register GSAP plugins
gsap.registerPlugin(ScrollToPlugin, useGSAP);

/**
 * Programmatically smooth-scroll to a target (selector, number, or element) using GSAP.
 * @param {string|number|Element} target - Y-position, element or query selector
 * @param {Object} options - Custom animation options (duration, ease, offsetY, onComplete)
 */
export const smoothScrollTo = (target, options = {}) => {
  const {
    duration = 0.8,
    ease = "power2.out",
    offsetY = 0,
    onComplete,
  } = options;

  gsap.to(window, {
    scrollTo: {
      y: target,
      offsetY,
      autoKill: true,
    },
    duration,
    ease,
    overwrite: "auto",
    onComplete,
  });
};

/**
 * Global smooth scrolling hook utilizing GSAP and @gsap/react.
 * Provides momentum-based wheel interpolation with intelligent bypass for inner scrollable containers.
 *
 * @param {Object} options Configuration parameters for smooth scrolling
 * @param {number} [options.speed=1.0] Scroll step distance factor
 * @param {number} [options.smoothness=0.3] Tween duration in seconds
 * @param {string} [options.ease="power2.out"] GSAP easing curve
 * @param {boolean} [options.enableWheel=false] Enable wheel momentum interpolation (false restores full native normal scroll speed)
 */
export const useSmoothScroll = (options = {}) => {
  const {
    speed = 1.0,
    smoothness = 0.3,
    ease = "power2.out",
    enableWheel = false,
  } = options;

  const targetYRef = useRef(0);
  const tweenRef = useRef(null);

  // Keep target in sync with window scroll position
  const syncTarget = useCallback(() => {
    targetYRef.current =
      window.pageYOffset || document.documentElement.scrollTop || 0;
  }, []);

  useEffect(() => {
    syncTarget();
    window.addEventListener("scroll", syncTarget, { passive: true });
    return () => window.removeEventListener("scroll", syncTarget);
  }, [syncTarget]);

  useGSAP(() => {
    if (!enableWheel || typeof window === "undefined") return;

    /**
     * Checks if the event target is inside an element with its own active scrollbar
     * (e.g. Material React Table body, Dialog, Popover, dropdowns)
     */
    const isInsideScrollable = (element, deltaY) => {
      let current = element;
      while (
        current &&
        current !== document.body &&
        current !== document.documentElement
      ) {
        // Never hijack scrolling inside dialogs, modals, popovers, or drawer lists
        if (
          current.getAttribute?.("role") === "dialog" ||
          current.classList?.contains("MuiDialog-root") ||
          current.classList?.contains("MuiModal-root") ||
          current.classList?.contains("MuiPopover-root") ||
          current.classList?.contains("MuiMenu-root")
        ) {
          return true;
        }

        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const isScrollable = overflowY === "auto" || overflowY === "scroll";

        if (isScrollable && current.scrollHeight > current.clientHeight) {
          const atTop = current.scrollTop <= 0 && deltaY < 0;
          const atBottom =
            Math.ceil(current.scrollTop + current.clientHeight) >=
              current.scrollHeight && deltaY > 0;

          // If the element still has room to scroll in the requested direction, keep native
          if (!atTop && !atBottom) {
            return true;
          }
        }
        current = current.parentElement;
      }
      return false;
    };

    const handleWheel = (e) => {
      // Ignore if body scroll is explicitly locked (e.g. open modal backdrop)
      if (document.body.style.overflow === "hidden") return;

      // Allow native scrolling for inner scrollable containers
      if (isInsideScrollable(e.target, e.deltaY)) {
        return;
      }

      // Intercept root wheel event for buttery GSAP glide
      e.preventDefault();

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop || 0;

      // Resync if position has drifted significantly
      if (Math.abs(targetYRef.current - currentScroll) > window.innerHeight) {
        targetYRef.current = currentScroll;
      }

      // Normalize delta across browsers/devices (Chrome/Edge pixel mode vs Firefox line mode)
      let rawDelta = e.deltaY;
      if (e.deltaMode === 1) {
        rawDelta *= 40; // Convert lines to standard pixels
      } else if (e.deltaMode === 2) {
        rawDelta *= window.innerHeight; // Convert page to pixels
      }

      // Calculate new target scroll position with natural travel speed
      const delta = rawDelta * speed;
      targetYRef.current = Math.min(
        maxScroll,
        Math.max(0, targetYRef.current + delta),
      );

      // Animate smoothly and responsively to target position using GSAP
      tweenRef.current = gsap.to(window, {
        scrollTo: {
          y: targetYRef.current,
          autoKill: true,
        },
        duration: smoothness,
        ease: "power2.out",
        overwrite: "auto",
        onAutoKill: () => {
          syncTarget();
        },
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, [enableWheel, speed, smoothness, ease, syncTarget]);

  return {
    scrollTo: smoothScrollTo,
  };
};

export default useSmoothScroll;
