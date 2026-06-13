/**
 * Small state helper for submit button feedback.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type SubmitState = "idle" | "loading" | "success" | "error";

export function useSubmitState(): {
  state: SubmitState;
  setLoading: () => void;
  setSuccess: () => void;
  setError: () => void;
  setIdle: () => void;
} {
  const [state, setState] = useState<SubmitState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearExistingTimeout, [clearExistingTimeout]);

  const setIdle = useCallback(() => {
    clearExistingTimeout();
    setState("idle");
  }, [clearExistingTimeout]);

  const setLoading = useCallback(() => {
    clearExistingTimeout();
    setState("loading");
  }, [clearExistingTimeout]);

  const setSuccess = useCallback(() => {
    clearExistingTimeout();
    setState("success");
    timeoutRef.current = setTimeout(() => {
      setState("idle");
      timeoutRef.current = null;
    }, 2000);
  }, [clearExistingTimeout]);

  const setError = useCallback(() => {
    clearExistingTimeout();
    setState("error");
  }, [clearExistingTimeout]);

  return { state, setLoading, setSuccess, setError, setIdle };
}

export default useSubmitState;
