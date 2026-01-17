/**
 * ConnectionLostAlert Component
 *
 * Purpose: Show network connection status and sync warnings
 * Used by: QuizAttempt
 * Features:
 * - Real-time network status monitoring
 * - Offline warning alert
 * - Online restoration notification
 * - Sync status indicator
 */

import { useEffect, useState } from "react";
import {
  WifiOff,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { useSyncContext } from "@/providers/SyncProvider";

// ============================================================================
// TYPES
// ============================================================================

export interface ConnectionLostAlertProps {
  /**
   * Whether to show sync status
   * @default true
   */
  showSyncStatus?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConnectionLostAlert({
  showSyncStatus = true,
  className,
}: ConnectionLostAlertProps) {
  const { isOnline, isOffline, isUnstable } = useNetworkStatus();
  const { stats, isProcessing } = useSyncContext();

  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  // Track offline -> online transition
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline && isOnline) {
      // Just reconnected
      setShowReconnected(true);
      setWasOffline(false);

      // Hide reconnected message after 5 seconds
      const timeout = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isOffline, isOnline, wasOffline]);

  // ============================================================================
  // RENDER - OFFLINE ALERT
  // ============================================================================

  if (isOffline) {
    return (
      <Alert variant="destructive" className={className}>
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Tidak Ada Koneksi Internet</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Anda sedang bekerja dalam mode offline. Jawaban akan disimpan secara
            lokal dan akan disinkronkan saat koneksi kembali tersedia.
          </p>

          {showSyncStatus && stats && stats.pending > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-background">
                {stats.pending} jawaban menunggu sinkronisasi
              </Badge>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER - UNSTABLE CONNECTION
  // ============================================================================

  if (isUnstable) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Koneksi Tidak Stabil</AlertTitle>
        <AlertDescription>
          Koneksi internet Anda tidak stabil. Jawaban akan disimpan secara lokal
          untuk mencegah kehilangan data.
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER - RECONNECTED
  // ============================================================================

  if (showReconnected) {
    return (
      <Alert
        className={`${className} bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800`}
      >
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Koneksi Kembali Tersedia
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200 space-y-2">
          <p>Koneksi internet telah dipulihkan.</p>

          {showSyncStatus && stats && stats.pending > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyinkronkan {stats.pending} jawaban...</span>
                </>
              ) : (
                <Badge variant="outline" className="bg-background">
                  {stats.pending} jawaban akan segera disinkronkan
                </Badge>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER - SYNCING STATUS
  // ============================================================================

  if (showSyncStatus && isProcessing && stats && stats.pending > 0) {
    return (
      <Alert className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription className="flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          <span>Menyinkronkan {stats.pending} jawaban ke server...</span>
        </AlertDescription>
      </Alert>
    );
  }

  // No alert needed
  return null;
}
