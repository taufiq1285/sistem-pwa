/**
 * Glass Card Component
 * Modern glassmorphism card with backdrop blur effect
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.ComponentProps<"div"> {
  intensity?: "low" | "medium" | "high";
  hover?: boolean;
  border?: boolean;
  glow?: boolean;
}

const intensityStyles: Record<NonNullable<GlassCardProps["intensity"]>, string> = {
  low: "bg-white/40 dark:bg-white/10 backdrop-blur-sm",
  medium: "bg-white/60 dark:bg-white/20 backdrop-blur-md",
  high: "bg-white/80 dark:bg-white/30 backdrop-blur-xl",
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      intensity = "medium",
      hover = true,
      border = true,
      glow = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl shadow-lg shadow-black/5 supports-backdrop-filter:bg-white/60 dark:shadow-black/20",
          "relative glass-panel",
          intensityStyles[intensity],
          border && "border border-(--glass-border)",
          glow &&
            "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent before:content-[''] dark:before:via-white/20",
          hover &&
            "transition-all duration-300 will-change-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
export type { GlassCardProps };
