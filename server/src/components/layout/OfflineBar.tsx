/**
 * OfflineBar Component
 *
 * Purpose: Banner alert for offline status
 * Usage: Top of page or layout to notify users of offline mode
 */

import { useState, useEffect } from "react";
import { WifiOff, X, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { useSyncContext } from "@/providers/SyncProvider";
import { cn } from "@/lib/utils";

export interface OfflineBarProps {
  /** Custom className */
  className?: string;
  /** Allow user to dismiss */
  dismissible?: boolean;
  /** Show sync status */
  showSyncStatus?: boolean;
}

/**
 * OfflineBar Component
 *
 * Displays a prominent banner when offline:
 * - Alert user about offline status
 * - Show number of pending changes
 * - Provide sync button when back online
 */
export function OfflineBar({
  className,
  dismissible = true,
  showSyncStatus = true,
}: OfflineBarProps) {
  const { isOnline, isOffline } = useNetworkStatus();
  const { stats, processQueue, isProcessing } = useSyncContext();
  const [isDismissed, setIsDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track offline → online transition
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setIsDismissed(false); // Reset dismiss when going offline
    }
  }, [isOffline]);

  // Don't show if:
  // - Currently online AND was never offline
  // - User dismissed it
  if ((isOnline && !wasOffline) || isDismissed) {
    return null;
  }

  const hasPending = stats && stats.pending > 0;

  const handleSync = async () => {
    try {
      await processQueue();
    } catch (error) {
      console.error("Manual sync failed:", error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (isOnline) {
      setWasOffline(false);
    }
  };

  // Offline state
  if (isOffline) {
    return (
      <Alert
        variant="destructive"
        className={cn("border-l-4 border-l-red-600 rounded-none", className)}
      >
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-semibold">You are offline.</span>{" "}
            {showSyncStatus && hasPending && (
              <span>
                You have {stats.pending} unsaved change
                {stats.pending !== 1 ? "s" : ""}. They will be synced when you
                reconnect.
              </span>
            )}
            {showSyncStatus && !hasPending && (
              <span>All changes are saved locally.</span>
            )}
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-4"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Back online with pending changes
  if (wasOffline && hasPending) {
    return (
      <Alert
        variant="default"
        className={cn(
          "border-l-4 border-l-green-600 rounded-none bg-green-50 dark:bg-green-950",
          className,
        )}
      >
        <RefreshCw className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-semibold text-green-900 dark:text-green-100">
              You are back online!
            </span>{" "}
            <span className="text-green-800 dark:text-green-200">
              You have {stats.pending} pending change
              {stats.pending !== 1 ? "s" : ""} to sync.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleSync}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Sync Now
                </>
              )}
            </Button>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
