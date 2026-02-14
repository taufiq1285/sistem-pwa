/**
 * useSupabase Hook Unit Tests
 * Testing Supabase client hook for memoization
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock dependencies
vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Import after mocking
import { useSupabase } from "../../../../lib/hooks/useSupabase";
import { supabase } from "../../../../lib/supabase/client";

describe("useSupabase Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic functionality", () => {
    it("should return supabase client instance", () => {
      const { result } = renderHook(() => useSupabase());

      expect(result.current).toBe(supabase);
    });

    it("should return the same instance on multiple calls", () => {
      const { result: result1 } = renderHook(() => useSupabase());
      const { result: result2 } = renderHook(() => useSupabase());
      const { result: result3 } = renderHook(() => useSupabase());

      expect(result1.current).toBe(supabase);
      expect(result2.current).toBe(supabase);
      expect(result3.current).toBe(supabase);

      // All should reference the same object
      expect(result1.current).toBe(result2.current);
      expect(result2.current).toBe(result3.current);
    });
  });

  describe("Memoization", () => {
    it("should memoize supabase instance", () => {
      const { result, rerender } = renderHook(() => useSupabase());

      const firstInstance = result.current;

      // Rerender should return same instance
      rerender();

      expect(result.current).toBe(firstInstance);
      expect(result.current).toBe(supabase);
    });

    it("should not create new instance on rerender", () => {
      let callCount = 0;

      const { result, rerender } = renderHook(() => {
        callCount++;
        return useSupabase();
      });

      // First render
      expect(callCount).toBe(1);
      const firstResult = result.current;

      // Rerender multiple times
      rerender();
      rerender();
      rerender();

      // Should still be called 5 times total (initial + 4 rerenders)
      expect(callCount).toBe(5);

      // But result.current should still be the same reference
      expect(result.current).toBe(firstResult);
    });
  });

  describe("Stability", () => {
    it("should return stable reference across hook lifecycle", () => {
      const { result } = renderHook(() => useSupabase());

      const instance1 = result.current;

      // Force a re-render by changing something
      const { rerender: rerender1 } = renderHook(() => useSupabase());
      rerender1();

      const instance2 = result.current;

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(supabase);
    });

    it("should work with multiple hooks in same component", () => {
      const { result } = renderHook(() => {
        const supabase1 = useSupabase();
        const supabase2 = useSupabase();
        const supabase3 = useSupabase();

        return {
          supabase1,
          supabase2,
          supabase3,
          allSame:
            supabase1 === supabase2 &&
            supabase2 === supabase3 &&
            supabase3 === supabase,
        };
      });

      expect(result.current.allSame).toBe(true);
      expect(result.current.supabase1).toBe(supabase);
      expect(result.current.supabase2).toBe(supabase);
      expect(result.current.supabase3).toBe(supabase);
    });
  });

  describe("Properties", () => {
    it("should expose all supabase properties", () => {
      const { result } = renderHook(() => useSupabase());

      expect(result.current).toHaveProperty("auth");
      expect(result.current).toHaveProperty("storage");
      expect(result.current).toHaveProperty("from");
      expect(result.current.auth).toBe(supabase.auth);
      expect(result.current.storage).toBe(supabase.storage);
      expect(result.current.from).toBe(supabase.from);
    });

    it("should allow access to auth methods", () => {
      const { result } = renderHook(() => useSupabase());

      expect(result.current.auth.signInWithPassword).toBeDefined();
      expect(result.current.auth.signUp).toBeDefined();
      expect(result.current.auth.signOut).toBeDefined();
      expect(result.current.auth.getUser).toBeDefined();
      expect(result.current.auth.getSession).toBeDefined();
    });

    it("should allow access to storage methods", () => {
      const { result } = renderHook(() => useSupabase());

      expect(result.current.storage.from).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle unmount and remount", () => {
      const { result, unmount } = renderHook(() => useSupabase());

      const firstInstance = result.current;

      unmount();

      const { result: newResult } = renderHook(() => useSupabase());

      // After remount, should still return supabase
      expect(newResult.current).toBe(supabase);
      // But it should be the same reference as before unmount
      expect(newResult.current).toBe(firstInstance);
    });

    it("should not cause infinite loop with useState/useEffect", () => {
      // This test ensures the hook doesn't trigger re-renders
      const renderCount = vi.fn();

      const { result } = renderHook(() => {
        renderCount();
        return useSupabase();
      });

      // Should only render once initially
      expect(renderCount).toHaveBeenCalledTimes(1);
      expect(result.current).toBe(supabase);
    });
  });
});
