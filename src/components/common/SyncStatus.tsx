/**
 * SyncStatus Component
 *
 * Purpose: Shows sync queue status and progress
 * Usage: Display in header or as floating indicator
 */

import {
  Cloud,
  CloudOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSyncContext } from "@/providers/SyncProvider";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

export interface SyncStatusProps {
  /** Show detailed status text */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

/**
 * SyncStatus Component
 *
 * Displays current sync status:
 * - Idle: No pending items
 * - Syncing: Processing queue
 * - Pending: Items waiting for sync
 * - Error: Sync failed
 */
export function SyncStatus({
  showDetails = true,
  className,
  compact = false,
}: SyncStatusProps) {
  const { stats, isProcessing } = useSyncContext();
  const { isOnline } = useNetworkStatus();

  const hasPending = stats && stats.pending > 0;
  const hasFailed = stats && stats.failed > 0;

  const getStatus = () => {
    if (hasFailed)
      return {
        icon: AlertCircle,
        label: "Sync Failed",
        variant: "destructive" as const,
      };
    if (isProcessing)
      return {
        icon: Loader2,
        label: "Syncing...",
        variant: "default" as const,
      };
    if (hasPending && !isOnline)
      return {
        icon: CloudOff,
        label: `${stats.pending} Pending`,
        variant: "warning" as const,
      };
    if (hasPending)
      return {
        icon: Cloud,
        label: `${stats.pending} Pending`,
        variant: "secondary" as const,
      };
    return {
      icon: CheckCircle2,
      label: "All Synced",
      variant: "success" as const,
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-semibold">{status.label}</div>
      {stats && (
        <>
          <div>Pending: {stats.pending}</div>
          <div>Completed: {stats.completed}</div>
          <div>Failed: {stats.failed}</div>
        </>
      )}
      {!isOnline && (
        <div className="text-yellow-400">Offline - Will sync when online</div>
      )}
    </div>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full cursor-help",
                hasFailed && "bg-destructive/10",
                isProcessing && "bg-primary/10",
                hasPending && !isOnline && "bg-yellow-500/10",
                !hasPending && !hasFailed && "bg-green-500/10",
                className,
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  hasFailed && "text-destructive",
                  isProcessing && "text-primary animate-spin",
                  hasPending && !isOnline && "text-yellow-600",
                  !hasPending && !hasFailed && "text-green-600",
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={status.variant}
            className={cn("flex items-center gap-1.5 cursor-help", className)}
          >
            <Icon
              className={cn("h-3.5 w-3.5", isProcessing && "animate-spin")}
            />
            {showDetails && (
              <span className="text-xs font-medium">{status.label}</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
