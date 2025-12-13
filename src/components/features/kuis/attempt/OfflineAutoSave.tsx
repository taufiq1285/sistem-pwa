/**
 * OfflineAutoSave Component
 *
 * Purpose: Auto-save quiz answers with offline support
 * Used by: QuizAttempt
 * Features:
 * - Auto-save every 3 seconds
 * - Save to IndexedDB when offline
 * - Save to API when online
 * - Visual save status indicator
 * - Optimistic updates with rollback on error
 */

import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { useSyncContext } from "@/providers/SyncProvider";

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineAutoSaveProps {
  /**
   * Unique key for this save operation
   */
  saveKey: string;

  /**
   * Data to save
   */
  data: any;

  /**
   * Save function (online)
   */
  onSave: (data: any) => Promise<void>;

  /**
   * Delay before auto-save in ms
   * @default 3000
   */
  delay?: number;

  /**
   * Whether auto-save is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Show save status indicator
   * @default true
   */
  showStatus?: boolean;

  /**
   * Callback when save succeeds
   */
  onSaveSuccess?: () => void;

  /**
   * Callback when save fails
   */
  onSaveError?: (error: Error) => void;

  /**
   * Custom className
   */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OfflineAutoSave({
  saveKey,
  data,
  onSave,
  delay = 3000,
  enabled = true,
  showStatus = true,
  onSaveSuccess,
  onSaveError,
  className,
}: OfflineAutoSaveProps) {
  const { isOnline, isOffline } = useNetworkStatus();
  const { addToQueue } = useSyncContext();

  // Use useAutoSave hook for auto-saving logic
  const { save, status, error, lastSaved } = useAutoSave(data, {
    onSave: async (saveData) => {
      if (isOnline) {
        // Online: Save directly to API
        await onSave(saveData);
      } else {
        // Offline: Add to sync queue
        await addToQueue(
          "kuis_jawaban", // entity
          "create", // operation
          {
            ...saveData,
            _metadata: {
              key: saveKey,
              timestamp: new Date().toISOString(),
            },
          },
        );
      }
    },
    delay,
    enabled,
    onSuccess: onSaveSuccess,
    onError: onSaveError,
  });

  // Track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-trigger save when data changes
  useEffect(() => {
    if (enabled && data && isMountedRef.current) {
      save();
    }
  }, [data, enabled, save]);

  // Don't show anything if status display is disabled
  if (!showStatus) {
    return null;
  }

  // ============================================================================
  // RENDER - SAVING
  // ============================================================================

  if (status === "saving") {
    return (
      <Alert className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription className="flex items-center gap-2">
          {isOffline ? (
            <>
              <CloudOff className="h-4 w-4" />
              <span>Menyimpan secara lokal...</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              <span>Menyimpan jawaban...</span>
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER - ERROR
  // ============================================================================

  if (status === "error" && error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Gagal menyimpan: {error.message}</AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER - SAVED
  // ============================================================================

  if (status === "saved" && lastSaved) {
    const timeAgo = getTimeAgo(new Date(lastSaved));

    return (
      <Alert
        className={`${className} bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100`}
      >
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center gap-2">
          {isOffline ? (
            <>
              <CloudOff className="h-4 w-4" />
              <span>Tersimpan lokal {timeAgo}</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              <span>Tersimpan otomatis {timeAgo}</span>
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // No indicator needed for idle state
  return null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable time ago string
 */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 10) return "baru saja";
  if (seconds < 60) return `${seconds} detik yang lalu`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;

  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}
