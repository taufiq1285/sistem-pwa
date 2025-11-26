/**
 * OfflineProvider
 *
 * Provides offline context to the application
 * - Initializes IndexedDB
 * - Provides offline helpers via context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { indexedDBManager } from '@/lib/offline/indexeddb';
import { useOffline } from '@/lib/hooks/useOffline';
import type { UseOfflineReturn } from '@/lib/hooks/useOffline';

// ============================================================================
// CONTEXT
// ============================================================================

const OfflineContext = createContext<UseOfflineReturn | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface OfflineProviderProps {
  children: React.ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const offline = useOffline();
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize IndexedDB
  useEffect(() => {
    let mounted = true;

    const initDb = async () => {
      try {
        await indexedDBManager.initialize();
        if (mounted) {
          setIsDbReady(true);
          console.log('✅ OfflineProvider: IndexedDB initialized');
        }
      } catch (error) {
        console.error('❌ OfflineProvider: Failed to initialize IndexedDB:', error);
      }
    };

    initDb();

    return () => {
      mounted = false;
    };
  }, []);

  // Don't render children until DB is ready
  if (!isDbReady) {
    return null; // or a loading spinner
  }

  return (
    <OfflineContext.Provider value={offline}>
      {children}
    </OfflineContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access offline context
 */
export function useOfflineContext(): UseOfflineReturn {
  const context = useContext(OfflineContext);

  if (!context) {
    throw new Error('useOfflineContext must be used within OfflineProvider');
  }

  return context;
}
