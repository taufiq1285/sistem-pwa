/**
 * Status Badge Component
 * Badge with animated pulse indicator for status
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

type StatusType =
  | "online"
  | "offline"
  | "busy"
  | "away"
  | "success"
  | "warning"
  | "error"
  | "info";

interface StatusBadgeProps extends React.ComponentProps<typeof Badge> {
  status: StatusType;
  pulse?: boolean;
  dot?: boolean;
}

const statusConfig: Record<
  StatusType,
  { dot: string; text: string; label: string; pulseColor: string }
> = {
  online: {
    dot: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
    label: "Online",
    pulseColor: "bg-green-400",
  },
  offline: {
    dot: "bg-slate-400",
    text: "text-slate-700 dark:text-slate-300",
    label: "Offline",
    pulseColor: "bg-slate-300",
  },
  busy: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    label: "Busy",
    pulseColor: "bg-red-400",
  },
  away: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    label: "Away",
    pulseColor: "bg-amber-400",
  },
  success: {
    dot: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
    label: "Success",
    pulseColor: "bg-green-400",
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    label: "Warning",
    pulseColor: "bg-amber-400",
  },
  error: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    label: "Error",
    pulseColor: "bg-red-400",
  },
  info: {
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    label: "Info",
    pulseColor: "bg-blue-400",
  },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, pulse = true, dot = true, className, children, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(
          "relative gap-1.5 pr-3 font-medium border-current/15 bg-background/70 backdrop-blur-sm",
          dot ? "pl-6" : "pl-3",
          config.text,
          className,
        )}
        {...props}
      >
        {dot && (
          <span className="absolute left-2 flex h-2 w-2">
            {pulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  config.pulseColor,
                )}
              />
            )}
            <span
              className={cn("relative inline-flex h-2 w-2 rounded-full", config.dot)}
            />
          </span>
        )}
        {children || config.label}
      </Badge>
    );
  },
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, type StatusType };
