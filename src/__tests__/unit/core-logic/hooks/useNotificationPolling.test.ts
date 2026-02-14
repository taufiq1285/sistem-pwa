/**
 * White-Box Testing for useNotificationPolling Hook
 *
 * Coverage Target: 100% (Statement, Branch, Path, Condition)
 *
 * Test Structure:
 * - SECTION 1: Hook Initialization
 * - SECTION 2: Polling Control (enabled/disabled)
 * - SECTION 3: Authentication Checks
 * - SECTION 4: Interval Management
 * - SECTION 5: Tab Visibility Handling
 * - SECTION 6: Offline Detection
 * - SECTION 7: New Notification Detection
 * - SECTION 8: Callback Execution
 * - SECTION 9: Error Handling
 * - SECTION 10: Cleanup on Unmount
 * - SECTION 11: Return Value
 * - SECTION 12: Path Coverage - All Execution Paths
 * - SECTION 13: Integration with useAuth
 * - SECTION 14: Real-World Scenarios
 * - SECTION 15: Edge Cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useNotificationPolling,
  useAutoNotifications,
} from "@/lib/hooks/useNotificationPolling";
import type { Notification } from "@/types/notification.types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock useAuth hook
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  role: "mahasiswa" as const,
};

let mockIsAuthenticated = true;
let mockUserValue = mockUser;

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockUserValue,
  })),
}));

// Mock getNotifications API
const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    user_id: "user-123",
    title: "Test Notification 1",
    message: "Test message 1",
    type: "info",
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "notif-2",
    user_id: "user-123",
    title: "Test Notification 2",
    message: "Test message 2",
    type: "warning",
    is_read: true,
    created_at: new Date().toISOString(),
  },
];

let mockGetNotifications = vi.fn().mockResolvedValue(mockNotifications);

vi.mock("@/lib/api/notification.api", () => ({
  getNotifications: vi.fn((...args: any[]) => mockGetNotifications(...args)),
}));

// Mock timers
vi.useFakeTimers();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Trigger visibility change event
 */
const triggerVisibilityChange = (hidden: boolean) => {
  Object.defineProperty(document, "hidden", {
    writable: true,
    value: hidden,
  });

  const event = new Event("visibilitychange");
  document.dispatchEvent(event);
};

/**
 * Advance timers and flush promises
 */
const advanceTimersAndFlush = async (ms: number) => {
  vi.advanceTimersByTime(ms);
  await Promise.resolve();
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("useNotificationPolling", () => {
  // Setup and cleanup
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();

    vi.clearAllMocks();
    vi.clearAllTimers();

    mockIsAuthenticated = true;
    mockUserValue = mockUser;
    mockGetNotifications = vi.fn().mockResolvedValue(mockNotifications);

    // Mock navigator.onLine
    Object.defineProperty(window.navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Mock document.hidden
    Object.defineProperty(document, "hidden", {
      writable: true,
      value: false,
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;

    vi.useRealTimers();
    vi.useFakeTimers();
  });

  // ============================================================================
  // SECTION 1: Hook Initialization
  // ============================================================================

  describe("SECTION 1: Hook Initialization", () => {
    it("should initialize hook without errors", () => {
      const { result } = renderHook(() => useNotificationPolling());

      expect(result.current).toBeDefined();
      expect(result.current.isPolling).toBe(true);
      expect(result.current.interval).toBe(30000);
    });

    it("should perform initial fetch on mount", async () => {
      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    it("should set up polling interval on mount", async () => {
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Advance to first interval
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });

    it("should log polling start message", async () => {
      renderHook(() => useNotificationPolling({ interval: 30000 }));

      await advanceTimersAndFlush(0);

      expect(console.log).toHaveBeenCalledWith(
        "🔔 Notification polling started (30s interval)",
      );
    });
  });

  // ============================================================================
  // SECTION 2: Polling Control (enabled/disabled)
  // ============================================================================

  describe("SECTION 2: Polling Control", () => {
    it("should start polling when enabled = true", async () => {
      renderHook(() => useNotificationPolling({ enabled: true }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Notification polling started"),
      );
    });

    it("should not start polling when enabled = false", async () => {
      renderHook(() => useNotificationPolling({ enabled: false }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    it("should return isPolling = true when enabled and authenticated", () => {
      const { result } = renderHook(() =>
        useNotificationPolling({ enabled: true }),
      );

      expect(result.current.isPolling).toBe(true);
    });

    it("should return isPolling = false when disabled", () => {
      const { result } = renderHook(() =>
        useNotificationPolling({ enabled: false }),
      );

      expect(result.current.isPolling).toBe(false);
    });

    it("should restart polling when enabled changes from false to true", async () => {
      const { rerender } = renderHook(
        ({ enabled }) => useNotificationPolling({ enabled }),
        { initialProps: { enabled: false } },
      );

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();

      // Enable polling
      rerender({ enabled: true });

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Notification polling started"),
      );
    });
  });

  // ============================================================================
  // SECTION 3: Authentication Checks
  // ============================================================================

  describe("SECTION 3: Authentication Checks", () => {
    it("should not poll when not authenticated", async () => {
      mockIsAuthenticated = false;

      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();
    });

    it("should not poll when user is null", async () => {
      mockUserValue = null as any;

      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();
    });

    it("should return isPolling = false when not authenticated", () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => useNotificationPolling());

      expect(result.current.isPolling).toBe(false);
    });

    it("should return isPolling = false when user is null", () => {
      mockUserValue = null as any;

      const { result } = renderHook(() => useNotificationPolling());

      expect(result.current.isPolling).toBe(false);
    });

    it("should start polling when authentication is restored", async () => {
      mockIsAuthenticated = false;

      const { rerender } = renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();

      // Authenticate
      mockIsAuthenticated = true;
      rerender();

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // SECTION 4: Interval Management
  // ============================================================================

  describe("SECTION 4: Interval Management", () => {
    it("should use default interval of 30000ms when not specified", () => {
      const { result } = renderHook(() => useNotificationPolling());

      expect(result.current.interval).toBe(30000);
    });

    it("should use custom interval when specified", () => {
      const { result } = renderHook(() =>
        useNotificationPolling({ interval: 60000 }),
      );

      expect(result.current.interval).toBe(60000);
    });

    it("should poll at specified interval", async () => {
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Advance to first interval
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);

      // Advance to second interval
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(3);
    });

    it("should update interval when prop changes", async () => {
      const { rerender } = renderHook(
        ({ interval }) => useNotificationPolling({ interval }),
        { initialProps: { interval: 10000 } },
      );

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Change interval - effect re-runs with initial fetch
      rerender({ interval: 20000 });

      await advanceTimersAndFlush(0);

      // Initial fetch after re-render + previous fetch
      expect(mockGetNotifications).toHaveBeenCalledTimes(2);

      // Advance to new interval
      await advanceTimersAndFlush(20000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(3);
    });

    it("should clear interval on cleanup", async () => {
      const { unmount } = renderHook(() =>
        useNotificationPolling({ interval: 10000 }),
      );

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      unmount();

      // Advance timers - should not trigger more fetches
      await advanceTimersAndFlush(20000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // SECTION 5: Tab Visibility Handling
  // ============================================================================

  describe("SECTION 5: Tab Visibility Handling", () => {
    it("should attach visibilitychange event listener on mount", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      renderHook(() => useNotificationPolling());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });

    it("should remove visibilitychange event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useNotificationPolling());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });

    it("should skip polling when tab is hidden", async () => {
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Hide tab
      triggerVisibilityChange(true);

      // Advance to next interval - should skip polling
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    it("should fetch immediately when tab becomes visible", async () => {
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Hide tab
      triggerVisibilityChange(true);

      // Show tab again - should fetch immediately
      triggerVisibilityChange(false);

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith(
        "🔔 Tab visible - fetching notifications...",
      );
    });

    it("should log when tab becomes hidden", async () => {
      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      triggerVisibilityChange(true);

      expect(console.log).toHaveBeenCalledWith(
        "🔔 Tab hidden - pausing notification polling",
      );
    });

    it("should continue polling while tab is visible", async () => {
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Advance to next interval - tab is visible
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // SECTION 6: Offline Detection
  // ============================================================================

  describe("SECTION 6: Offline Detection", () => {
    it("should skip polling when offline", async () => {
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: false,
      });

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      // Initial fetch should be skipped
      expect(mockGetNotifications).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "⏸️ Offline - skipping notification poll",
      );
    });

    it("should resume polling when back online", async () => {
      // Start offline
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: false,
      });

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();

      // Go online
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: true,
      });

      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalled();
    });

    it("should log offline status", async () => {
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: false,
      });

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(10000);

      expect(console.log).toHaveBeenCalledWith(
        "⏸️ Offline - skipping notification poll",
      );
    });
  });

  // ============================================================================
  // SECTION 7: New Notification Detection
  // ============================================================================

  describe("SECTION 7: New Notification Detection", () => {
    it("should detect new notifications when unread count increases", async () => {
      const newNotifications: Notification[] = [
        ...mockNotifications,
        {
          id: "notif-3",
          user_id: "user-123",
          title: "New Notification",
          message: "New message",
          type: "info",
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ];

      mockGetNotifications
        .mockResolvedValueOnce(mockNotifications)
        .mockResolvedValueOnce(newNotifications);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Advance to next interval with new notification
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
      expect(onNewNotifications).toHaveBeenCalledWith(newNotifications);
      expect(console.log).toHaveBeenCalledWith(
        "🔔 New notifications detected: 1 new",
      );
    });

    it("should not trigger callback when unread count stays same", async () => {
      // Use all read notifications so initial fetch doesn't trigger callback
      const allRead = mockNotifications.map((n) => ({ ...n, is_read: true }));

      mockGetNotifications.mockResolvedValue(allRead);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Advance to next interval - no new notifications
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
      expect(onNewNotifications).not.toHaveBeenCalled();
    });

    it("should not trigger callback when unread count decreases", async () => {
      // Start with all read to avoid initial callback
      const allRead = mockNotifications.map((n) => ({ ...n, is_read: true }));

      const fewerNotifications = [mockNotifications[1]]; // Only read notification

      mockGetNotifications
        .mockResolvedValueOnce(allRead)
        .mockResolvedValueOnce(fewerNotifications);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(onNewNotifications).not.toHaveBeenCalled();

      await advanceTimersAndFlush(10000);

      expect(onNewNotifications).not.toHaveBeenCalled();
    });

    it("should track lastCount correctly across multiple polls", async () => {
      // Start with all read to avoid initial callback trigger
      const allRead = mockNotifications.map((n) => ({ ...n, is_read: true }));

      const moreNotifications: Notification[] = [
        ...mockNotifications,
        {
          id: "notif-3",
          user_id: "user-123",
          title: "New",
          message: "Message",
          type: "info",
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "notif-4",
          user_id: "user-123",
          title: "New 2",
          message: "Message 2",
          type: "info",
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ];

      mockGetNotifications
        .mockResolvedValueOnce(allRead) // 0 unread
        .mockResolvedValueOnce(moreNotifications) // 2 unread (2 new)
        .mockResolvedValueOnce(moreNotifications); // 2 unread (0 new)

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(onNewNotifications).not.toHaveBeenCalled();

      // Second poll - 2 new notifications
      await advanceTimersAndFlush(10000);

      expect(onNewNotifications).toHaveBeenCalledTimes(1);
      expect(onNewNotifications).toHaveBeenCalledWith(moreNotifications);

      // Third poll - no new notifications
      onNewNotifications.mockClear();
      await advanceTimersAndFlush(10000);

      expect(onNewNotifications).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SECTION 8: Callback Execution
  // ============================================================================

  describe("SECTION 8: Callback Execution", () => {
    it("should call onNewNotifications callback when provided", async () => {
      const newNotification: Notification = {
        id: "notif-3",
        user_id: "user-123",
        title: "New",
        message: "Message",
        type: "info",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const updatedNotifications = [...mockNotifications, newNotification];

      mockGetNotifications
        .mockResolvedValueOnce(mockNotifications)
        .mockResolvedValueOnce(updatedNotifications);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      await advanceTimersAndFlush(10000);

      expect(onNewNotifications).toHaveBeenCalledWith(updatedNotifications);
    });

    it("should not fail when onNewNotifications is not provided", async () => {
      const newNotification: Notification = {
        id: "notif-3",
        user_id: "user-123",
        title: "New",
        message: "Message",
        type: "info",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const updatedNotifications = [...mockNotifications, newNotification];

      mockGetNotifications
        .mockResolvedValueOnce(mockNotifications)
        .mockResolvedValueOnce(updatedNotifications);

      // No callback provided
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      // Should not throw
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });

    it("should call onError callback when error occurs", async () => {
      const error = new Error("Network error");
      mockGetNotifications.mockRejectedValue(error);

      const onError = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onError,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should not fail when onError is not provided", async () => {
      mockGetNotifications.mockRejectedValue(new Error("Network error"));

      // No error callback provided
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      // Should not throw
      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SECTION 9: Error Handling
  // ============================================================================

  describe("SECTION 9: Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      mockGetNotifications.mockRejectedValue(new Error("API Error"));

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      // Should not throw
      await advanceTimersAndFlush(0);

      expect(console.warn).toHaveBeenCalledWith(
        "⚠️ Notification polling error (non-critical):",
        expect.any(Error),
      );
    });

    it("should continue polling after error", async () => {
      mockGetNotifications
        .mockRejectedValueOnce(new Error("API Error"))
        .mockResolvedValueOnce(mockNotifications);

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Next interval should still poll
      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });

    it("should log offline message when error occurs while offline", async () => {
      // This test verifies the skip logic when offline
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: false,
      });

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(10000);

      // When offline, polling is skipped before API call
      expect(console.log).toHaveBeenCalledWith(
        "⏸️ Offline - skipping notification poll",
      );
    });

    it("should call error callback with error object", async () => {
      const error = new Error("Custom error");
      mockGetNotifications.mockRejectedValue(error);

      const onError = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onError,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should log warning for non-offline errors", async () => {
      mockGetNotifications.mockRejectedValue(new Error("Server error"));

      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(console.warn).toHaveBeenCalledWith(
        "⚠️ Notification polling error (non-critical):",
        expect.any(Error),
      );
    });
  });

  // ============================================================================
  // SECTION 10: Cleanup on Unmount
  // ============================================================================

  describe("SECTION 10: Cleanup on Unmount", () => {
    it("should stop polling on unmount", async () => {
      const { unmount } = renderHook(() =>
        useNotificationPolling({ interval: 10000 }),
      );

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      unmount();

      expect(console.log).toHaveBeenCalledWith(
        "🔔 Notification polling stopped",
      );

      // Advance timers - should not fetch anymore
      await advanceTimersAndFlush(20000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    it("should clear interval on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      const { unmount } = renderHook(() => useNotificationPolling());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it("should remove event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useNotificationPolling());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
    });

    it("should log cleanup message", () => {
      const { unmount } = renderHook(() => useNotificationPolling());

      unmount();

      expect(console.log).toHaveBeenCalledWith(
        "🔔 Notification polling stopped",
      );
    });
  });

  // ============================================================================
  // SECTION 11: Return Value
  // ============================================================================

  describe("SECTION 11: Return Value", () => {
    it("should return isPolling = true when enabled and authenticated", () => {
      const { result } = renderHook(() =>
        useNotificationPolling({ enabled: true }),
      );

      expect(result.current.isPolling).toBe(true);
    });

    it("should return isPolling = false when disabled", () => {
      const { result } = renderHook(() =>
        useNotificationPolling({ enabled: false }),
      );

      expect(result.current.isPolling).toBe(false);
    });

    it("should return isPolling = false when not authenticated", () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => useNotificationPolling());

      expect(result.current.isPolling).toBe(false);
    });

    it("should return correct interval value", () => {
      const { result } = renderHook(() =>
        useNotificationPolling({ interval: 45000 }),
      );

      expect(result.current.interval).toBe(45000);
    });

    it("should return default interval when not specified", () => {
      const { result } = renderHook(() => useNotificationPolling());

      expect(result.current.interval).toBe(30000);
    });
  });

  // ============================================================================
  // SECTION 12: Path Coverage - All Execution Paths
  // ============================================================================

  describe("SECTION 12: Path Coverage - All Execution Paths", () => {
    it("Path 1: Enabled + Authenticated + Visible + Online → Poll successfully", async () => {
      renderHook(() =>
        useNotificationPolling({ enabled: true, interval: 10000 }),
      );

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Notification polling started"),
      );
    });

    it("Path 2: Disabled → No polling", async () => {
      renderHook(() => useNotificationPolling({ enabled: false }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();
    });

    it("Path 3: Not Authenticated → No polling", async () => {
      mockIsAuthenticated = false;

      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();
    });

    it("Path 4: User is null → No polling", async () => {
      mockUserValue = null as any;

      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();
    });

    it("Path 5: Tab Hidden → Skip polling", async () => {
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      triggerVisibilityChange(true);

      await advanceTimersAndFlush(10000);

      // Only initial fetch, interval fetch skipped
      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    it("Path 6: Offline → Skip polling + log message", async () => {
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: false,
      });

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "⏸️ Offline - skipping notification poll",
      );
    });

    it("Path 7: New Notifications → Call callback", async () => {
      const newNotification: Notification = {
        id: "notif-3",
        user_id: "user-123",
        title: "New",
        message: "Message",
        type: "info",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const updatedNotifications = [...mockNotifications, newNotification];

      mockGetNotifications
        .mockResolvedValueOnce(mockNotifications)
        .mockResolvedValueOnce(updatedNotifications);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      await advanceTimersAndFlush(10000);

      expect(onNewNotifications).toHaveBeenCalled();
    });

    it("Path 8: Error → Call error callback + continue polling", async () => {
      const error = new Error("Network error");
      mockGetNotifications.mockRejectedValueOnce(error);

      const onError = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onError,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(onError).toHaveBeenCalledWith(error);

      // Should continue polling
      mockGetNotifications.mockResolvedValueOnce(mockNotifications);

      await advanceTimersAndFlush(10000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });

    it("Path 9: Unmount → Cleanup listeners + clear interval", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useNotificationPolling());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
      );
      expect(console.log).toHaveBeenCalledWith(
        "🔔 Notification polling stopped",
      );
    });
  });

  // ============================================================================
  // SECTION 13: Integration with useAuth
  // ============================================================================

  describe("SECTION 13: Integration with useAuth", () => {
    it("should stop polling when user logs out", async () => {
      const { rerender } = renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // User logs out
      mockIsAuthenticated = false;
      mockUserValue = null as any;

      rerender();

      await advanceTimersAndFlush(10000);

      // Should not poll after logout
      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    it("should start polling when user logs in", async () => {
      mockIsAuthenticated = false;
      mockUserValue = null as any;

      const { rerender } = renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).not.toHaveBeenCalled();

      // User logs in
      mockIsAuthenticated = true;
      mockUserValue = mockUser;

      rerender();

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    it("should use user.id for API calls", async () => {
      renderHook(() => useNotificationPolling());

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledWith({
        user_id: "user-123",
        limit: 10,
      });
    });
  });

  // ============================================================================
  // SECTION 14: Real-World Scenarios
  // ============================================================================

  describe("SECTION 14: Real-World Scenarios", () => {
    it("Scenario 1: User is working, receives new notification periodically", async () => {
      const notifications1 = mockNotifications; // 1 unread

      const notifications2: Notification[] = [
        ...mockNotifications,
        {
          id: "notif-3",
          user_id: "user-123",
          title: "Assignment Due",
          message: "Your assignment is due tomorrow",
          type: "warning",
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]; // 2 unread (1 new)

      mockGetNotifications
        .mockResolvedValueOnce(notifications1)
        .mockResolvedValueOnce(notifications2);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 30000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      expect(onNewNotifications).not.toHaveBeenCalled();

      // After 30 seconds
      await advanceTimersAndFlush(30000);

      expect(onNewNotifications).toHaveBeenCalledTimes(1);
      expect(onNewNotifications).toHaveBeenCalledWith(notifications2);
    });

    it("Scenario 2: User switches to another tab, polling pauses", async () => {
      renderHook(() => useNotificationPolling({ interval: 30000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // User switches tab
      triggerVisibilityChange(true);

      await advanceTimersAndFlush(60000); // 2 intervals

      // No polling while hidden
      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // User returns to tab
      triggerVisibilityChange(false);

      await advanceTimersAndFlush(0);

      // Immediate fetch on visibility change
      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });

    it("Scenario 3: Network goes offline, polling pauses gracefully", async () => {
      renderHook(() => useNotificationPolling({ interval: 30000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Network goes offline
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: false,
      });

      await advanceTimersAndFlush(60000); // 2 intervals

      // No polling while offline
      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        "⏸️ Offline - skipping notification poll",
      );

      // Network comes back
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: true,
      });

      await advanceTimersAndFlush(30000);

      // Resumes polling
      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });

    it("Scenario 4: Multiple rapid visibility changes", async () => {
      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      // Rapid visibility changes
      triggerVisibilityChange(true); // Hide
      triggerVisibilityChange(false); // Show

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2); // Initial + visibility fetch

      triggerVisibilityChange(true); // Hide
      triggerVisibilityChange(false); // Show

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // SECTION 15: Edge Cases
  // ============================================================================

  describe("SECTION 15: Edge Cases", () => {
    it("should handle interval of 0 (edge case)", async () => {
      renderHook(() => useNotificationPolling({ interval: 0 }));

      await advanceTimersAndFlush(0);

      // Initial fetch should still happen
      expect(mockGetNotifications).toHaveBeenCalledTimes(1);
    });

    it("should handle very short interval (1000ms)", async () => {
      renderHook(() => useNotificationPolling({ interval: 1000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      await advanceTimersAndFlush(1000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);

      await advanceTimersAndFlush(1000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(3);
    });

    it("should handle very long interval (300000ms = 5 minutes)", async () => {
      renderHook(() => useNotificationPolling({ interval: 300000 }));

      await advanceTimersAndFlush(0);

      expect(mockGetNotifications).toHaveBeenCalledTimes(1);

      await advanceTimersAndFlush(300000);

      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });

    it("should handle empty notifications array", async () => {
      mockGetNotifications.mockResolvedValue([]);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      await advanceTimersAndFlush(10000);

      // No new notifications callback should be called
      expect(onNewNotifications).not.toHaveBeenCalled();
    });

    it("should handle all notifications already read", async () => {
      const allRead = mockNotifications.map((n) => ({
        ...n,
        is_read: true,
      }));

      mockGetNotifications.mockResolvedValue(allRead);

      const onNewNotifications = vi.fn();

      renderHook(() =>
        useNotificationPolling({
          interval: 10000,
          onNewNotifications,
        }),
      );

      await advanceTimersAndFlush(0);

      await advanceTimersAndFlush(10000);

      expect(onNewNotifications).not.toHaveBeenCalled();
    });

    it("should handle rapid successive errors", async () => {
      mockGetNotifications.mockRejectedValue(new Error("Error"));

      renderHook(() => useNotificationPolling({ interval: 10000 }));

      await advanceTimersAndFlush(0);

      await advanceTimersAndFlush(10000);

      await advanceTimersAndFlush(10000);

      // Should continue attempting to poll despite errors
      expect(mockGetNotifications).toHaveBeenCalledTimes(3);
    });
  });
});

// ============================================================================
// useAutoNotifications Hook Tests
// ============================================================================

describe("useAutoNotifications", () => {
  it("should use default interval of 30000ms", () => {
    const { result } = renderHook(() => useAutoNotifications());

    expect(result.current.interval).toBe(30000);
  });

  it("should be enabled by default", async () => {
    renderHook(() => useAutoNotifications());

    await vi.advanceTimersByTimeAsync(0);

    expect(mockGetNotifications).toHaveBeenCalled();
  });

  it("should return isPolling = true when authenticated", () => {
    const { result } = renderHook(() => useAutoNotifications());

    expect(result.current.isPolling).toBe(true);
  });

  it("should be a wrapper around useNotificationPolling with defaults", () => {
    const { result: autoResult } = renderHook(() => useAutoNotifications());
    const { result: pollingResult } = renderHook(() =>
      useNotificationPolling(),
    );

    expect(autoResult.current.interval).toBe(pollingResult.current.interval);
    expect(autoResult.current.isPolling).toBe(pollingResult.current.isPolling);
  });
});
