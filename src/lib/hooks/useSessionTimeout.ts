/**
 * useSessionTimeout Hook
 * Auto logout user setelah X menit inactivity
 * Perfect untuk shared device scenario
 */

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number; // Show warning N minutes before timeout
  enableWarningDialog?: boolean;
}

export function useSessionTimeout({
  timeoutMinutes = 15,
  warningMinutes = 2,
  enableWarningDialog = true,
}: UseSessionTimeoutOptions = {}) {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningShownRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningShownRef.current = false;

    if (!user) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // Set warning timeout
    if (enableWarningDialog) {
      warningTimeoutRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          toast.warning(
            `Session akan berakhir dalam ${warningMinutes} menit. Lakukan aktivitas untuk melanjutkan.`,
            {
              duration: warningMinutes * 60 * 1000,
              dismissible: true,
            },
          );
        }
      }, warningMs);
    }

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      console.log("Session timeout - auto logout");
      toast.error("Sesi Anda telah berakhir karena tidak ada aktivitas");
      logout();
      window.location.assign("/login");
    }, timeoutMs);
  }, [user, timeoutMinutes, warningMinutes, enableWarningDialog, logout]);

  useEffect(() => {
    if (!user) {
      // Clear all timeouts when user is not logged in
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      return;
    }

    // Reset timeout on initial mount
    resetTimeout();

    // Activity event handlers
    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "mousemove",
    ];

    const handleActivity = () => {
      // Throttle: hanya reset jika sudah 5 detik sejak aktivitas terakhir
      const now = Date.now();
      if (now - lastActivityRef.current < 5000) {
        return; // Skip jika masih dalam 5 detik
      }
      lastActivityRef.current = now;
      resetTimeout();
    };

    // Add listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [user, resetTimeout]);
}
