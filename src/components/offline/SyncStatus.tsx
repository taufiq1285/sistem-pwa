/**
 * SyncStatus Component
 *
 * Displays sync queue status and controls
 * - Shows pending/syncing/completed/failed counts
 * - Sync now button
 * - Retry failed button
 * - Clear completed button
 */

import { RefreshCw, Check, X, Clock, Loader2 } from "lucide-react";
import { useSync } from "@/lib/hooks/useSync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface SyncStatusProps {
  /** Show detailed stats (default: true) */
  showDetails?: boolean;
  /** Show action buttons (default: true) */
  showActions?: boolean;
  /** Custom className */
  className?: string;
  /** Compact mode (default: false) */
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SyncStatus({
  showDetails = true,
  showActions = true,
  className,
  compact = false,
}: SyncStatusProps) {
  const { stats, isProcessing, processQueue, retryFailed, clearCompleted } =
    useSync();

  if (!stats) {
    return null;
  }

  const { pending, syncing, completed, failed } = stats;
  const hasPending = pending > 0;
  const hasFailed = failed > 0;

  // Compact mode - just show icon with count
  if (compact) {
    return (
      <button
        onClick={() => processQueue()}
        disabled={isProcessing || !hasPending}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          hasPending
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-600",
          className,
        )}
        aria-label="Sync status"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {hasPending && (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-blue-600">
            {pending}
          </span>
        )}
      </button>
    );
  }

  // Full mode
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Sync Status</h3>
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Syncing...</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {showDetails && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div>
              <div className="text-xs text-gray-600">Pending</div>
              <div className="text-lg font-semibold text-yellow-700">
                {pending}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2">
            <Loader2 className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Syncing</div>
              <div className="text-lg font-semibold text-blue-700">
                {syncing}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-xs text-gray-600">Done</div>
              <div className="text-lg font-semibold text-green-700">
                {completed}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2">
            <X className="h-4 w-4 text-red-600" />
            <div>
              <div className="text-xs text-gray-600">Failed</div>
              <div className="text-lg font-semibold text-red-700">{failed}</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => processQueue()}
            disabled={isProcessing || !hasPending}
            size="sm"
            variant="default"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now ({pending})
              </>
            )}
          </Button>

          {hasFailed && (
            <Button
              onClick={() => retryFailed()}
              disabled={isProcessing}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Failed ({failed})
            </Button>
          )}

          {completed > 0 && (
            <Button
              onClick={() => clearCompleted()}
              disabled={isProcessing}
              size="sm"
              variant="ghost"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Completed
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
