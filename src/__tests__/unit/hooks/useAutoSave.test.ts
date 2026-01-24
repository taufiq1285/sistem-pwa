import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import * as useNetworkStatusModule from "@/lib/hooks/useNetworkStatus";

// Mock useNetworkStatus - factory function to avoid hoisting issues
vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    isUnstable: false,
    status: "online" as const,
    quality: undefined,
    lastChanged: Date.now(),
    isReady: true,
  })),
}));

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset network status to online by default
    vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
      isOnline: true,
      isOffline: false,
      isUnstable: false,
      status: "online" as const,
      quality: undefined,
      lastChanged: Date.now(),
      isReady: true,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("Basic functionality", () => {
    it("should initialize with provided data", () => {
      const initialData = { name: "Test", value: 100 };
      const { result } = renderHook(() => useAutoSave(initialData));

      expect(result.current.data).toEqual(initialData);
      expect(result.current.status).toBe("idle");
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it("should update data when updateData is called", () => {
      const initialData = { name: "Test", value: 100 };
      const { result } = renderHook(() => useAutoSave(initialData));

      act(() => {
        result.current.updateData({ name: "Updated", value: 200 });
      });

      expect(result.current.data).toEqual({ name: "Updated", value: 200 });
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it("should update data with functional update", () => {
      const initialData = { count: 0 };
      const { result } = renderHook(() => useAutoSave(initialData));

      act(() => {
        result.current.updateData((prev) => ({ count: prev.count + 1 }));
      });

      expect(result.current.data).toEqual({ count: 1 });
      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe("Auto-save with debouncing", () => {
    it("should auto-save after debounce delay", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { text: "Hello" };
      const delay = 1000;

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          delay,
          onSave,
        }),
      );

      // Update data
      act(() => {
        result.current.updateData({ text: "World" });
      });

      // Should not save immediately
      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.status).toBe("idle");

      // Fast-forward past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(delay);
      });

      // Should have saved
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe("saved");
      expect(result.current.lastSaved).toBeTruthy();
    });

    it("should debounce rapid changes", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { count: 0 };
      const delay = 500;

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          delay,
          onSave,
        }),
      );

      // Make multiple rapid changes
      act(() => {
        result.current.updateData({ count: 1 });
        result.current.updateData({ count: 2 });
        result.current.updateData({ count: 3 });
      });

      // Fast-forward to just before debounce
      act(() => {
        vi.advanceTimersByTime(delay - 10);
      });

      // Should not have saved yet
      expect(onSave).not.toHaveBeenCalled();

      // Fast-forward past debounce
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      // Should save only once with latest data
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ count: 3 });
    });

    it("should reset debounce timer on new changes", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };
      const delay = 1000;

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          delay,
          onSave,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      // Advance halfway through debounce
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Make another change
      act(() => {
        result.current.updateData({ value: 2 });
      });

      // Advance to when first save would have happened
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should not have saved yet (timer was reset)
      expect(onSave).not.toHaveBeenCalled();

      // Advance the remaining time
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Now it should save
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ value: 2 });
    });
  });

  describe("Manual save", () => {
    it("should trigger manual save immediately", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { text: "Test" };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          delay: 5000,
        }),
      );

      act(() => {
        result.current.updateData({ text: "Changed" });
      });

      // Manually trigger save
      await act(async () => {
        await result.current.save();
      });

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ text: "Changed" });
      expect(result.current.status).toBe("saved");
    });

    it("should clear pending auto-save when manual save is triggered", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };
      const delay = 1000;

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          delay,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      // Manually save before debounce completes
      await act(async () => {
        await result.current.save();
      });

      expect(onSave).toHaveBeenCalledTimes(1);

      // Advance past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(delay);
      });

      // Should not trigger another save
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe("Save status tracking", () => {
    it("should update status to saving during save", async () => {
      let resolveSave: (value: void) => void;
      const onSave = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve;
          }),
      );
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          delay: 100,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      // Trigger save - this will call onSave which returns a pending promise
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Use fake timers to wait a bit and check status
      act(() => {
        vi.advanceTimersByTime(10);
      });

      // Check that we're in saving state
      expect(result.current.status).toBe("saving");
      expect(result.current.isSaving).toBe(true);

      // Resolve the save and complete the pending promises
      await act(async () => {
        resolveSave!();
        // Advance timers to allow any pending effects to run
        vi.advanceTimersByTime(10);
      });

      expect(result.current.status).toBe("saved");
      expect(result.current.isSaving).toBe(false);
    }, 10000);

    it("should handle save errors", async () => {
      const error = new Error("Save failed");
      const onSave = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          onError,
          delay: 100,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onError).toHaveBeenCalledWith(error, { value: 1 });
      expect(result.current.status).toBe("error");
      expect(result.current.error).toEqual(error);
    });

    it("should call onSuccess callback after successful save", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onSuccess = vi.fn();
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          onSuccess,
          delay: 100,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onSuccess).toHaveBeenCalledWith({ value: 1 });
    });
  });

  describe("Reset functionality", () => {
    it("should reset to saved state", () => {
      const initialData = { value: 0 };
      const { result } = renderHook(() => useAutoSave(initialData));

      act(() => {
        result.current.updateData({ value: 1 });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toEqual(initialData);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.status).toBe("idle");
    });

    it("should clear pending save when reset", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          delay: 1000,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      act(() => {
        result.current.reset();
      });

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should not save after reset
      expect(onSave).not.toHaveBeenCalled();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe("markAsSaved functionality", () => {
    it("should mark current data as saved without calling onSave", () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      act(() => {
        result.current.markAsSaved();
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.status).toBe("saved");
      expect(result.current.lastSaved).toBeTruthy();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Enabled option", () => {
    it("should not auto-save when disabled", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          enabled: false,
          delay: 100,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it("should allow manual save even when disabled", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          enabled: false,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      await act(async () => {
        await result.current.save();
      });

      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe("Online/Offline handling", () => {
    it("should skip save when offline and onlineOnly is true", async () => {
      // Mock useNetworkStatus to return offline
      vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
        isUnstable: false,
        status: "offline" as const,
        quality: undefined,
        lastChanged: Date.now(),
        isReady: true,
      });

      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          onlineOnly: true,
          delay: 100,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Equality check", () => {
    it("should use custom isEqual function", () => {
      const isEqual = vi.fn((a, b) => a.id === b.id);
      const initialData = { id: 1, name: "Test" };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          isEqual,
        }),
      );

      act(() => {
        result.current.updateData({ id: 1, name: "Updated" });
      });

      // Should use custom isEqual (returns true because id matches)
      expect(isEqual).toHaveBeenCalled();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup timers on unmount", () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData = { value: 0 };

      const { result, unmount } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          delay: 1000,
        }),
      );

      act(() => {
        result.current.updateData({ value: 1 });
      });

      // Unmount before debounce completes
      unmount();

      // Advance past debounce
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not save after unmount
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Concurrent save prevention", () => {
    it("should prevent concurrent saves", async () => {
      // Use real timers for this test since we're testing async promise behavior
      vi.useRealTimers();

      let resolveFirstSave: () => void;
      const onSave = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveFirstSave = resolve;
          }),
      );
      const initialData = { value: 0 };

      const { result } = renderHook(() =>
        useAutoSave(initialData, {
          onSave,
          delay: 50,
        }),
      );

      // Start first save
      act(() => {
        result.current.updateData({ value: 1 });
      });

      // Wait for debounce + a bit more for save to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Status should be saving
      expect(result.current.status).toBe("saving");

      // Try to save again while first is in progress
      await act(async () => {
        await result.current.save();
      });

      // Should only call onSave once (second call is prevented)
      expect(onSave).toHaveBeenCalledTimes(1);

      // Resolve first save
      await act(async () => {
        resolveFirstSave!();
      });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.status).toBe("saved");
      });

      // Restore fake timers
      vi.useFakeTimers();
    }, 10000);
  });
});
