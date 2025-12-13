/**
 * useMultiTabSync Hook
 * Sync logout across multiple tabs/windows
 * Detects login dari akun berbeda dan auto-logout current tab
 */

import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const STORAGE_KEY = "_multiTabSync";
const LOGOUT_EVENT = "_logout_event";

interface TabSyncMessage {
  type: "login" | "logout" | "userIdChange";
  userId?: string;
  email?: string;
  timestamp: number;
}

export function useMultiTabSync() {
  const { user, logout } = useAuth();
  const currentUserIdRef = useRef<string | null>(null);

  // Broadcast logout to other tabs
  const broadcastLogout = () => {
    const message: TabSyncMessage = {
      type: "logout",
      timestamp: Date.now(),
    };
    localStorage.setItem(LOGOUT_EVENT, JSON.stringify(message));
  };

  // Broadcast new login to other tabs
  const broadcastLogin = (userId: string, email: string) => {
    const message: TabSyncMessage = {
      type: "login",
      userId,
      email,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
  };

  // Handle storage events (other tabs/windows actions)
  useEffect(() => {
    if (!user) return;

    currentUserIdRef.current = user.id;

    const handleStorageChange = async (e: StorageEvent) => {
      if (!e.newValue) return;

      try {
        // Handle logout event from other tab
        if (e.key === LOGOUT_EVENT) {
          const message: TabSyncMessage = JSON.parse(e.newValue);
          console.log(
            "Detected logout from another tab, current tab logging out",
          );
          toast.info("Terdeteksi logout dari tab lain");
          await logout();
          window.location.href = "/login";
          return;
        }

        // Handle login event from other tab
        if (e.key === STORAGE_KEY) {
          const message: TabSyncMessage = JSON.parse(e.newValue);

          if (message.type === "login" && message.userId) {
            // Jika user_id berbeda = user lain login di tab lain
            if (
              currentUserIdRef.current &&
              currentUserIdRef.current !== message.userId
            ) {
              console.log(
                `Different user detected in another tab. Current: ${currentUserIdRef.current}, Other: ${message.userId}`,
              );
              toast.warning(
                `${message.email} login di tab lain - current session logout`,
              );
              await logout();
              window.location.href = "/login";
              return;
            }
          }
        }
      } catch (error) {
        console.warn("Error handling multi-tab sync:", error);
      }
    };

    // Listen to storage events
    window.addEventListener("storage", handleStorageChange);

    // Broadcast current login
    broadcastLogin(user.id, user.email || "");

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user, logout]);

  // Return broadcast functions for use in auth provider
  return {
    broadcastLogin,
    broadcastLogout,
  };
}
