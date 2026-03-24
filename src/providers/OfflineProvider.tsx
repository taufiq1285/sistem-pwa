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

const OFFLINE_BOOT_OVERLAY_DELAY_MS = 1200;

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
  const [isDbReady, setIsDbReady] = useState(indexedDBManager.isReady());
  const [showBootOverlay, setShowBootOverlay] = useState(false);

  // Initialize IndexedDB
  useEffect(() => {
    let mounted = true;
    let overlayTimer: ReturnType<typeof setTimeout> | null = null;

    if (!indexedDBManager.isReady()) {
      overlayTimer = setTimeout(() => {
        if (mounted && !indexedDBManager.isReady()) {
          setShowBootOverlay(true);
        }
      }, OFFLINE_BOOT_OVERLAY_DELAY_MS);
    }

    const initDb = async () => {
      try {
        await indexedDBManager.initialize();
        if (mounted) {
          setIsDbReady(true);
          setShowBootOverlay(false);
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
          setShowBootOverlay(false);
        }
      } finally {
        if (overlayTimer) {
          clearTimeout(overlayTimer);
        }
      }
    };

    void initDb();

    return () => {
      mounted = false;
      if (overlayTimer) {
        clearTimeout(overlayTimer);
      }
    };
  }, []);

  // Render children first, only show overlay if IndexedDB startup is unusually slow.
  return (
    <OfflineContext.Provider value={offline}>
      {children}
      {!isDbReady && showBootOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/75 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-5 text-center shadow-xl">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              Menyiapkan data offline...
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Aplikasi tetap dimuat, penyimpanan lokal sedang disiapkan.
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
