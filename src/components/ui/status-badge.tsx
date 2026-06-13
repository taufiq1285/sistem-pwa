/**
 * Status Badge Component
 * Badge with status colors and optional animated pulse indicator
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
  | "info"
  | "muted"
  // Role statuses
  | "mahasiswa"
  | "dosen"
  | "laboran"
  | "admin";

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
    className: string;
  }
> = {
  success: {
    dot: "bg-[#0f5c42]",
    text: "text-[#0f5c42]",
    label: "Success",
    pulseColor: "bg-[#0f5c42]/70",
    className: "status-pill status-pill-success",
  },
  online: {
    dot: "bg-[#0f5c42]",
    text: "text-[#0f5c42]",
    label: "Online",
    pulseColor: "bg-[#0f5c42]/70",
    className: "status-pill status-pill-success",
  },
  warning: {
    dot: "bg-[#92400e]",
    text: "text-[#92400e]",
    label: "Warning",
    pulseColor: "bg-[#92400e]/70",
    className: "status-pill status-pill-warning",
  },
  away: {
    dot: "bg-[#92400e]",
    text: "text-[#92400e]",
    label: "Away",
    pulseColor: "bg-[#92400e]/70",
    className: "status-pill status-pill-warning",
  },
  info: {
    dot: "bg-[#1d4ed8]",
    text: "text-[#1d4ed8]",
    label: "Info",
    pulseColor: "bg-[#1d4ed8]/70",
    className: "status-pill status-pill-info",
  },
  error: {
    dot: "bg-[#991b1b]",
    text: "text-[#991b1b]",
    label: "Error",
    pulseColor: "bg-[#991b1b]/70",
    className: "status-pill status-pill-danger",
  },
  busy: {
    dot: "bg-[#991b1b]",
    text: "text-[#991b1b]",
    label: "Busy",
    pulseColor: "bg-[#991b1b]/70",
    className: "status-pill status-pill-danger",
  },
  offline: {
    dot: "bg-[#5f5e5a]",
    text: "text-[#5f5e5a]",
    label: "Offline",
    pulseColor: "bg-[#5f5e5a]/60",
    className: "status-pill status-pill-muted",
  },
  muted: {
    dot: "bg-[#5f5e5a]",
    text: "text-[#5f5e5a]",
    label: "Muted",
    pulseColor: "bg-[#5f5e5a]/60",
    className: "status-pill status-pill-muted",
  },
  mahasiswa: {
    dot: "bg-[#4338ca]",
    text: "text-[#4338ca]",
    label: "Mahasiswa",
    pulseColor: "bg-[#4338ca]/70",
    className: "status-pill status-pill-mahasiswa",
  },
  dosen: {
    dot: "bg-[#0f5c42]",
    text: "text-[#0f5c42]",
    label: "Dosen",
    pulseColor: "bg-[#0f5c42]/70",
    className: "status-pill status-pill-dosen",
  },
  laboran: {
    dot: "bg-[#0f766e]",
    text: "text-[#0f766e]",
    label: "Laboran",
    pulseColor: "bg-[#0f766e]/70",
    className: "status-pill status-pill-laboran",
  },
  admin: {
    dot: "bg-[#991b1b]",
    text: "text-[#991b1b]",
    label: "Admin",
    pulseColor: "bg-[#991b1b]/70",
    className: "status-pill status-pill-admin",
  },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    { status, pulse = true, dot = true, className, children, ...props },
    ref,
  ) => {
    const config = statusConfig[status] || statusConfig.info;

    return (
      <Badge
        ref={ref}
        variant="outline"
        className={cn(
          "relative border-0 shadow-none font-semibold",
          dot ? "pl-5 pr-2.5" : "px-2.5",
          config.className,
          className,
        )}
        {...props}
      >
        {dot && (
          <span className="absolute left-1.5 flex h-1.5 w-1.5">
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
                "relative inline-flex h-1.5 w-1.5 rounded-full",
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
