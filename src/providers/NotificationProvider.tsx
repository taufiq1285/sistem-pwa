/**
 * Notification Provider
 * Provides notification/toast functionality using Sonner
 */

import { useContext } from "react";
import { NotificationContext } from "@/context/NotificationContext";
import { useNotification } from "@/lib/hooks/useNotification";
import { Toaster } from "@/components/ui/sonner";
import type { NotificationContextValue } from "@/context/NotificationContext";

// ============================================================================
// PROVIDER
// ============================================================================

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notification = useNotification();

  return (
    <NotificationContext.Provider value={notification}>
      {children}
      <Toaster />
    </NotificationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access notification context
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }

  return context;
}
