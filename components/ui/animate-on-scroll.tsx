"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type AnimationType = "fade-up" | "fade-in" | "fade-left" | "fade-right" | "scale";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
}

const animationClasses: Record<AnimationType, { initial: string; animate: string }> = {
  "fade-up": {
    initial: "opacity-0 translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "fade-in": {
    initial: "opacity-0",
    animate: "opacity-100",
  },
  "fade-left": {
    initial: "opacity-0 -translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "fade-right": {
    initial: "opacity-0 translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "scale": {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
  },
};

export function AnimateOnScroll({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  duration = 600,
  threshold = 0.1,
}: AnimateOnScrollProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold, fallbackDelay: delay });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Only enable animations after mount and if user doesn't prefer reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldAnimate(!mediaQuery.matches);
  }, []);

  useEffect(() => {
    // Once in view, mark as animated (one-time trigger)
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  const { initial, animate } = animationClasses[animation];

  // Show content if:
  // 1. Animations are disabled (reduced motion or not mounted)
  // 2. Element has been animated (was in view)
  // 3. Element is currently in view
  const isVisible = !shouldAnimate || hasAnimated || isInView;

  return (
    <div
      ref={ref}
      className={cn(
        shouldAnimate && "transition-all ease-out",
        isVisible ? animate : initial,
        className
      )}
      style={shouldAnimate ? {
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      } : undefined}
    >
      {children}
    </div>
  );
}
