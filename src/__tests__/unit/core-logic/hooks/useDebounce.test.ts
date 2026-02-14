/**
 * useDebounce Hook Unit Tests
 * Comprehensive tests for debounce functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/lib/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));

    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      },
    );

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "updated", delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Fast-forward time by 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should be updated
    expect(result.current).toBe("updated");
  });

  it("should reset timer on rapid value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      },
    );

    // First change
    rerender({ value: "change1", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Second change before debounce completes
    rerender({ value: "change2", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Third change before debounce completes
    rerender({ value: "change3", delay: 500 });

    // Value should still be initial
    expect(result.current).toBe("initial");

    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("change3");
  });

  it("should use default delay of 500ms when not specified", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "initial" },
    });

    rerender({ value: "updated" });

    // Before 500ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe("initial");

    // After 500ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("updated");
  });

  it("should work with different data types", () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } },
    );

    numberRerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(numberResult.current).toBe(42);

    // Test with boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: false } },
    );

    boolRerender({ value: true });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(boolResult.current).toBe(true);

    // Test with object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { name: "John" } } },
    );

    const newObj = { name: "Jane" };
    objRerender({ value: newObj });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(objResult.current).toEqual(newObj);

    // Test with array
    const { result: arrResult, rerender: arrRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: [1, 2, 3] } },
    );

    const newArr = [4, 5, 6];
    arrRerender({ value: newArr });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(arrResult.current).toEqual(newArr);
  });

  it("should handle delay changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      },
    );

    // Change value with new delay
    rerender({ value: "updated", delay: 1000 });

    // After 500ms (old delay), value should not update
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("initial");

    // After 1000ms (new delay), value should update
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated");
  });

  it("should cleanup timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const { unmount } = renderHook(() => useDebounce("test", 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("should handle zero delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });

    // Even with 0 delay, it should use setTimeout
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe("updated");
  });

  it("should handle null and undefined values", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: "initial" as string | null | undefined } },
    );

    rerender({ value: null });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(null);

    rerender({ value: undefined });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(undefined);
  });

  it("should debounce search input scenario", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "" } },
    );

    // Simulate user typing "hello"
    const letters = ["h", "he", "hel", "hell", "hello"];

    letters.forEach((letter, index) => {
      rerender({ value: letter });
      if (index < letters.length - 1) {
        act(() => {
          vi.advanceTimersByTime(50); // User types quickly
        });
      }
    });

    // Value should still be empty (initial)
    expect(result.current).toBe("");

    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("hello");
  });

  it("should work with very short delays", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("updated");
  });

  it("should work with very long delays", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 10000),
      { initialProps: { value: "initial" } },
    );

    rerender({ value: "updated" });

    // Before delay completes
    act(() => {
      vi.advanceTimersByTime(9999);
    });
    expect(result.current).toBe("initial");

    // After delay completes
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("updated");
  });
});
