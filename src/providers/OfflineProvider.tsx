/**
 * OfflineProvider
 *
 * Provides offline context to the application
 * - Initializes IndexedDB
 * - Provides offline helpers via context
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { indexedDBManager } from "@/lib/offline/indexeddb";
import { useOffline } from "@/lib/hooks/useOffline";
import type { UseOfflineReturn } from "@/lib/hooks/useOffline";

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
          console.log("✅ OfflineProvider: IndexedDB initialized");
        }
      } catch (error) {
        console.error(
          "❌ OfflineProvider: Failed to initialize IndexedDB:",
          error,
        );
        // Tetap set ready agar app tidak stuck di loading screen
        // Fitur offline tidak akan berfungsi, tapi app masih bisa dipakai online
        if (mounted) {
          setIsDbReady(true);
        }
      }
    };

    initDb();

    return () => {
      mounted = false;
    };
  }, []);

  // Render children with a conditional overlay for DB initialization
  // This prevents blocking the entire app render while IndexedDB initializes
  return (
    <OfflineContext.Provider value={offline}>
      {children}
      {!isDbReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 bg-opacity-80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto" />
            <p className="mt-3 text-sm text-slate-500">
              Memuat sistem offline...
            </p>
          </div>
        </div>
      )}
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
    throw new Error("useOfflineContext must be used within OfflineProvider");
  }

  return context;
}
