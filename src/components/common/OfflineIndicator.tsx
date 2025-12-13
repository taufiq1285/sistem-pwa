/**
 * OfflineIndicator Component
 *
 * Purpose: Badge showing online/offline status
 * Usage: Place in header/navigation for quick status check
 */

import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

export interface OfflineIndicatorProps {
  /** Show text label alongside icon */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
  /** Compact mode (icon only) */
  compact?: boolean;
}

/**
 * OfflineIndicator Component
 *
 * Displays current network status as a badge
 * - Green: Online
 * - Yellow: Unstable
 * - Red: Offline
 */
export function OfflineIndicator({
  showLabel = true,
  className,
  compact = false,
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, isUnstable } = useNetworkStatus();

  const getBadgeVariant = () => {
    if (isOffline) return "destructive";
    if (isUnstable) return "warning";
    return "success";
  };

  const getIcon = () => {
    if (isOffline) return WifiOff;
    if (isUnstable) return AlertTriangle;
    return Wifi;
  };

  const getLabel = () => {
    if (isOffline) return "Offline";
    if (isUnstable) return "Unstable";
    return "Online";
  };

  const Icon = getIcon();
  const variant = getBadgeVariant();
  const label = getLabel();

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full",
          isOffline && "bg-destructive/10",
          isUnstable && "bg-yellow-500/10",
          isOnline && !isUnstable && "bg-green-500/10",
          className,
        )}
        title={label}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            isOffline && "text-destructive",
            isUnstable && "text-yellow-600",
            isOnline && !isUnstable && "text-green-600",
          )}
        />
      </div>
    );
  }

  return (
    <Badge
      variant={variant}
      className={cn("flex items-center gap-1.5", className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </Badge>
  );
}

/**
 * Variant with pulse animation for offline state
 */
export function OfflineIndicatorPulse({
  className,
  ...props
}: OfflineIndicatorProps) {
  const { isOffline } = useNetworkStatus();

  return (
    <div className={cn("relative", className)}>
      {isOffline && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}
      <OfflineIndicator {...props} />
    </div>
  );
}
