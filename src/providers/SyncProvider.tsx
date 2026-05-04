import React, { createContext, useContext, useEffect, useRef } from "react";
import { useSync } from "@/lib/hooks/useSync";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import type { UseSyncReturn } from "@/lib/hooks/useSync";
import { syncPendingOfflineQuizSubmissions } from "@/lib/api/kuis.api";

const SyncContext = createContext<UseSyncReturn | null>(null);

export interface SyncProviderProps {
  children: React.ReactNode;
  autoSync?: boolean;
}

export function SyncProvider({ children, autoSync = true }: SyncProviderProps) {
  const sync = useSync();
  const { isOnline } = useNetworkStatus();
  const globalSyncRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!autoSync || !isOnline || !sync.isReady) return;

    if (globalSyncRef.current) {
      return;
    }

    globalSyncRef.current = (async () => {
      try {
        if (sync.stats && sync.stats.pending > 0) {
          console.log(`Auto-syncing ${sync.stats.pending} pending items...`);
          await sync.processQueue();
        }

        const syncedSubmissions = await syncPendingOfflineQuizSubmissions();
        if (syncedSubmissions > 0) {
          window.dispatchEvent(
            new CustomEvent("kuis:offline-sync-completed", {
              detail: { syncedSubmissions },
            }),
          );
        }
      } catch (error) {
        console.error("Auto-sync failed:", error);
      } finally {
        globalSyncRef.current = null;
      }
    })();
  }, [isOnline, autoSync, sync.isReady, sync.stats, sync.processQueue]);

  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>;
}

export function useSyncContext(): UseSyncReturn {
  const context = useContext(SyncContext);

  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider");
  }

  return context;
}
