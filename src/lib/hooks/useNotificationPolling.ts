/**
 * useNotificationPolling Hook
 *
 * Purpose: Auto-refresh notifications periodically (without WebSocket)
 * Safe: Non-blocking, resource-friendly, won't affect other features
 *
 * Features:
 * - Periodic fetch every 30-60 seconds
 * - Auto-pause when tab inactive
 * - Auto-cleanup on unmount
 * - Error handling (silent fail)
 * - Only runs when authenticated
 */

import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { getNotifications } from "@/lib/api/notification.api";
import type { Notification } from "@/types/notification.types";

interface UseNotificationPollingOptions {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  interval?: number;
  /** Enable/disable polling (default: true) */
  enabled?: boolean;
  /** Callback when new notifications found */
  onNewNotifications?: (notifications: Notification[]) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * Hook for auto-polling notifications
 *
 * @example
 * ```tsx
 * useNotificationPolling({
 *   interval: 30000, // 30 seconds
 *   onNewNotifications: (notifications) => {
 *     console.log('New notifications:', notifications.length);
 *   }
 * });
 * ```
 */
export function useNotificationPolling(
  options: UseNotificationPollingOptions = {},
) {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onNewNotifications,
    onError,
  } = options;

  const { isAuthenticated, user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountRef = useRef<number>(0);
  const isTabVisibleRef = useRef<boolean>(true);
  const isInitialRef = useRef<boolean>(true);

  useEffect(() => {
    // Don't start if not enabled or not authenticated
    if (!enabled || !isAuthenticated || !user) {
      return;
    }

    console.log(
      `🔔 Notification polling started (${interval / 1000}s interval)`,
    );

    // Fetch function with error handling
    const fetchNotifications = async () => {
      try {
        // ✅ Skip if tab is not visible (save resources)
        if (!isTabVisibleRef.current) {
          return;
        }

        // ✅ Skip if offline - prevent unnecessary network errors
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          console.log("⏸️ Offline - skipping notification poll");
          return;
        }

        const notifications = await getNotifications({
          user_id: user.id,
          limit: 10, // Only fetch latest 10
        });

        // Check if new notifications arrived
        const unreadCount = (notifications ?? []).filter(
          (n) => !n.is_read,
        ).length;

        if (unreadCount > lastCountRef.current && !isInitialRef.current) {
          console.log(
            `🔔 New notifications detected: ${unreadCount - lastCountRef.current} new`,
          );

          // Call callback if provided
          if (onNewNotifications) {
            onNewNotifications(notifications);
          }
        }

        lastCountRef.current = unreadCount;
        isInitialRef.current = false;
      } catch (error) {
        // ✅ Silent error - don't break the app, especially in offline mode
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        if (isOffline) {
          console.log(
            "⏸️ Offline - notification polling paused (will retry when online)",
          );
        } else {
          console.warn("⚠️ Notification polling error (non-critical):", error);
        }

        // Call error callback if provided
        if (onError) {
          onError(error as Error);
        }
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up interval
    intervalRef.current = setInterval(fetchNotifications, interval);

    // Handle visibility change (pause when tab inactive)
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;

      if (isTabVisibleRef.current) {
        // Tab became visible, fetch immediately
        console.log("🔔 Tab visible - fetching notifications...");
        fetchNotifications();
      } else {
        console.log("🔔 Tab hidden - pausing notification polling");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      console.log("🔔 Notification polling stopped");

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, isAuthenticated, user, interval, onNewNotifications, onError]);

  return {
    isPolling: enabled && isAuthenticated && !!user,
    interval,
  };
}

/**
 * Simpler version - just enable polling with defaults
 *
 * @example
 * ```tsx
 * useNotificationPolling(); // Use all defaults
 * ```
 */
export function useAutoNotifications() {
  return useNotificationPolling({
    interval: 30000, // 30 seconds
    enabled: true,
  });
}
