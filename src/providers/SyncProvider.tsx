import React, { createContext, useContext, useEffect } from 'react';
import { useSync } from '@/lib/hooks/useSync';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import type { UseSyncReturn } from '@/lib/hooks/useSync';

const SyncContext = createContext<UseSyncReturn | null>(null);

export interface SyncProviderProps {
  children: React.ReactNode;
  autoSync?: boolean;
}

export function SyncProvider({ children, autoSync = true }: SyncProviderProps) {
  const sync = useSync();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!autoSync || !isOnline || !sync.isReady) return;

    if (sync.stats && sync.stats.pending > 0) {
      console.log(`Auto-syncing ${sync.stats.pending} pending items...`);
      sync.processQueue().catch((error) => {
        console.error('Auto-sync failed:', error);
      });
    }
  }, [isOnline, autoSync, sync]);

  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSyncContext(): UseSyncReturn {
  const context = useContext(SyncContext);

  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }

  return context;
}
