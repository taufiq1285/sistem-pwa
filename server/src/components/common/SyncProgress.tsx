/**
 * Sync Progress Component
 *
 * FASE 1 IMPLEMENTATION - ZERO RISK
 * Real-time sync progress indicator
 * - Show current sync progress
 * - Display processing status
 * - Auto-hide when idle
 *
 * TIDAK MENGUBAH LOGIC EXISTING:
 * - Hanya listen ke event yang sudah ada
 * - Pure UI component
 * - Tidak trigger sync operations
 */

import { useEffect, useState } from "react";
import { useSync } from "@/lib/hooks/useSync";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncProgressProps {
  /**
   * Show component even when not syncing
   * Default: false (auto-hide when idle)
   */
  alwaysShow?: boolean;
  /**
   * Position of the component
   * Default: "bottom-right"
   */
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "inline";
  /**
   * Custom className
   */
  className?: string;
}

export function SyncProgress({
  alwaysShow = false,
  position = "bottom-right",
  className,
}: SyncProgressProps) {
  // ============================================================================
  // HOOKS - Menggunakan hook yang SUDAH ADA
  // ============================================================================

  const { stats, isProcessing, isReady } = useSync();

  const [showSuccess, setShowSuccess] = useState(false);

  // ============================================================================
  // STATE
  // ============================================================================

  const hasPending = (stats?.pending || 0) > 0;
  const hasFailed = (stats?.failed || 0) > 0;
  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const pending = stats?.pending || 0;

  // Calculate progress percentage
  const progress = total > 0 ? (completed / total) * 100 : 0;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Show success message briefly after sync completes
   */
  useEffect(() => {
    if (!isProcessing && hasPending === false && completed > 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isProcessing, hasPending, completed]);

  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================

  // Don't show if not ready
  if (!isReady) {
    return null;
  }

  // Auto-hide when idle (if alwaysShow is false)
  if (!alwaysShow && !isProcessing && !hasPending && !showSuccess) {
    return null;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getPositionClasses = () => {
    if (position === "inline") {
      return "";
    }

    const baseClasses = "fixed z-50";
    switch (position) {
      case "top-left":
        return `${baseClasses} top-4 left-4`;
      case "top-right":
        return `${baseClasses} top-4 right-4`;
      case "bottom-left":
        return `${baseClasses} bottom-4 left-4`;
      case "bottom-right":
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (showSuccess) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (hasFailed) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (hasPending) {
      return <RefreshCw className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isProcessing) {
      return "Menyinkronkan...";
    }
    if (showSuccess) {
      return "Sinkronisasi berhasil!";
    }
    if (hasFailed) {
      return "Beberapa item gagal";
    }
    if (hasPending) {
      return "Menunggu sinkronisasi";
    }
    return "Semua tersinkronkan";
  };

  const getStatusBadgeVariant = () => {
    if (isProcessing) return "default";
    if (showSuccess) return "default";
    if (hasFailed) return "destructive";
    if (hasPending) return "secondary";
    return "default";
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card
      className={cn(
        getPositionClasses(),
        "p-4 shadow-lg min-w-[300px] max-w-[400px]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-sm">{getStatusText()}</span>
        </div>
        <Badge variant={getStatusBadgeVariant()} className="text-xs">
          {isProcessing && "Syncing"}
          {showSuccess && "Done"}
          {!isProcessing && !showSuccess && hasFailed && "Failed"}
          {!isProcessing &&
            !showSuccess &&
            !hasFailed &&
            hasPending &&
            "Pending"}
          {!isProcessing && !showSuccess && !hasFailed && !hasPending && "Idle"}
        </Badge>
      </div>

      {/* Progress Bar */}
      {(isProcessing || hasPending) && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completed} / {total} selesai
            </span>
            <span>{pending} pending</span>
          </div>
        </div>
      )}

      {/* Success State */}
      {showSuccess && !isProcessing && (
        <div className="flex items-center justify-center text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {completed} item berhasil disinkronkan
        </div>
      )}

      {/* Failed State */}
      {hasFailed && !isProcessing && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          <XCircle className="w-3 h-3 inline mr-1" />
          {stats?.failed} item gagal (bisa di-retry di admin panel)
        </div>
      )}

      {/* Processing Details */}
      {isProcessing && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Memproses queue...</span>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Compact version for header/footer
 */
export function SyncProgressCompact() {
  const { stats, isProcessing } = useSync();

  const hasPending = (stats?.pending || 0) > 0;

  if (!isProcessing && !hasPending) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isProcessing && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-muted-foreground">
            Syncing {stats?.pending || 0} items...
          </span>
        </>
      )}
      {!isProcessing && hasPending && (
        <>
          <RefreshCw className="w-4 h-4 text-yellow-500" />
          <span className="text-muted-foreground">
            {stats?.pending} pending
          </span>
        </>
      )}
    </div>
  );
}
