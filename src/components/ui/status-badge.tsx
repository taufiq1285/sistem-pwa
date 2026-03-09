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
  {
    dot: string;
    text: string;
    label: string;
    pulseColor: string;
    background: string;
    border: string;
  }
> = {
  online: {
    dot: "bg-success",
    text: "text-success",
    label: "Online",
    pulseColor: "bg-success/70",
    background: "bg-success/10",
    border: "border-success/20",
  },
  offline: {
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    label: "Offline",
    pulseColor: "bg-muted-foreground/60",
    background: "bg-muted/50",
    border: "border-border/70",
  },
  busy: {
    dot: "bg-destructive",
    text: "text-destructive",
    label: "Busy",
    pulseColor: "bg-destructive/70",
    background: "bg-destructive/10",
    border: "border-destructive/20",
  },
  away: {
    dot: "bg-warning",
    text: "text-warning",
    label: "Away",
    pulseColor: "bg-warning/70",
    background: "bg-warning/15",
    border: "border-warning/25",
  },
  success: {
    dot: "bg-success",
    text: "text-success",
    label: "Success",
    pulseColor: "bg-success/70",
    background: "bg-success/10",
    border: "border-success/20",
  },
  warning: {
    dot: "bg-warning",
    text: "text-warning",
    label: "Warning",
    pulseColor: "bg-warning/70",
    background: "bg-warning/15",
    border: "border-warning/25",
  },
  error: {
    dot: "bg-destructive",
    text: "text-destructive",
    label: "Error",
    pulseColor: "bg-destructive/70",
    background: "bg-destructive/10",
    border: "border-destructive/20",
  },
  info: {
    dot: "bg-info",
    text: "text-info",
    label: "Info",
    pulseColor: "bg-info/70",
    background: "bg-info/10",
    border: "border-info/20",
  },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    { status, pulse = true, dot = true, className, children, ...props },
    ref,
  ) => {
    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(
          "relative gap-1.5 pr-3 font-medium backdrop-blur-sm",
          dot ? "pl-6" : "pl-3",
          config.text,
          config.background,
          config.border,
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
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                config.dot,
              )}
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
