/**
 * useNotification Hook
 *
 * Wrapper around Sonner toast library
 * Provides consistent API for showing toast notifications
 */

import { useCallback, useMemo } from "react";
import { toast } from "sonner";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATION = 5000; // 5 seconds

// ============================================================================
// HOOK
// ============================================================================

export function useNotification() {
  const success = useCallback(
    (message: string, title?: string, duration: number = DEFAULT_DURATION) => {
      toast.success(title || message, {
        description: title ? message : undefined,
        duration,
      });
    },
    [],
  );

  const error = useCallback(
    (message: string, title?: string, duration: number = DEFAULT_DURATION) => {
      toast.error(title || message, {
        description: title ? message : undefined,
        duration,
      });
    },
    [],
  );

  const warning = useCallback(
    (message: string, title?: string, duration: number = DEFAULT_DURATION) => {
      toast.warning(title || message, {
        description: title ? message : undefined,
        duration,
      });
    },
    [],
  );

  const info = useCallback(
    (message: string, title?: string, duration: number = DEFAULT_DURATION) => {
      toast.info(title || message, {
        description: title ? message : undefined,
        duration,
      });
    },
    [],
  );

  const dismiss = useCallback((id?: string | number) => {
    if (id !== undefined) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  }, []);

  const clear = useCallback(() => {
    toast.dismiss();
  }, []);

  return useMemo(
    () => ({
      success,
      error,
      warning,
      info,
      dismiss,
      clear,
    }),
    [success, error, warning, info, dismiss, clear],
  );
}
