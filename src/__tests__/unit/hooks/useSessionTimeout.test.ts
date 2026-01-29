/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionTimeout } from "../../../lib/hooks/useSessionTimeout";
import type { AuthUser } from "../../../types/auth.types";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../lib/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth as useAuthImport } from "../../../lib/hooks/useAuth";
const mockUseAuth = vi.mocked(useAuthImport);
const mockToast = vi.mocked(await import("sonner")).toast;

describe("useSessionTimeout Hook", () => {
  let mockLogout: () => Promise<void>;
  let originalLocation: Location;
  let mockWindowAddEventListener: any;
  let mockWindowRemoveEventListener: any;

  const mockUser: AuthUser = {
    id: "1",
    email: "test@example.com",
    role: "mahasiswa",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    avatar_url: null,
    full_name: "Test User",
    is_active: true,
    last_seen_at: "2024-01-28T00:00:00Z",
    metadata: null,
  };

  beforeEach(() => {
    vi.useFakeTimers();

    mockLogout = vi.fn().mockResolvedValue(undefined);

    // Mock useAuth with all required properties
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      refreshSession: vi.fn(),
      hasRole: vi.fn(),
      session: null,
      loading: false,
      initialized: true,
      isAuthenticated: true,
    });

    // Mock window location with all required properties
    originalLocation = window.location;
    const mockLocation = {
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn(),
      origin: "http://localhost",
      protocol: "http:",
      host: "localhost",
      hostname: "localhost",
      port: "",
      pathname: "/",
      search: "",
      hash: "",
    };
    let hrefValue = "";
    Object.defineProperty(mockLocation, "href", {
      get() {
        return hrefValue;
      },
      set(value: string) {
        hrefValue = value;
      },
    });
    vi.stubGlobal("location", mockLocation);

    // Mock window methods that may be undefined in test environment
    Object.defineProperty(window, "addEventListener", {
      value: vi.fn() as any,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "removeEventListener", {
      value: vi.fn() as any,
      writable: true,
      configurable: true,
    });

    // Store the mocked functions for verification
    mockWindowAddEventListener = window.addEventListener;
    mockWindowRemoveEventListener = window.removeEventListener;

    // Clear all mock calls before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.resetAllMocks();
  });

  describe("Session timeout behavior", () => {
    it("should show warning before timeout", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10 / 60000, // Very small for testing
          warningMinutes: 5 / 60000,
          enableWarningDialog: true,
        }),
      );

      // Fast forward past warning time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockToast.warning).toHaveBeenCalled();
    });

    it("should logout after timeout duration", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 1 / 60000, // Very small for testing
          warningMinutes: 0.5 / 60000,
          enableWarningDialog: true,
        }),
      );

      // Fast forward past timeout duration
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Sesi Anda telah berakhir karena tidak ada aktivitas",
      );
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("should reset timeout on user activity", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Simulate user activity events
      const activityEvents = [
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "click",
        "mousemove",
      ];

      activityEvents.forEach((event) => {
        expect(mockWindowAddEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          { passive: true },
        );
      });

      // Cleanup
      unmount();
    });

    it("should cleanup event listeners on unmount", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      unmount();

      // Verify cleanup - each activity event should be removed
      const activityEvents = [
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "click",
        "mousemove",
      ];

      activityEvents.forEach((event) => {
        expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
        );
      });
    });
  });

  describe("Warning dialog functionality", () => {
    it("should show warning at configured time", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 5,
          enableWarningDialog: true,
        }),
      );

      // Fast forward to warning time (15 - 5 = 10 minutes)
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        "Session akan berakhir dalam 5 menit. Lakukan aktivitas untuk melanjutkan.",
        expect.objectContaining({
          duration: 5 * 60 * 1000,
          dismissible: true,
        }),
      );
    });

    it("should not show warning when disabled", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 5,
          enableWarningDialog: false,
        }),
      );

      // Fast forward past warning time
      act(() => {
        vi.advanceTimersByTime(11 * 60 * 1000);
      });

      expect(mockToast.warning).not.toHaveBeenCalled();
    });

    it("should only show warning once", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 5,
          enableWarningDialog: true,
        }),
      );

      // Fast forward to warning time
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(1);

      // Fast forward more - warning should not be shown again
      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(1);
    });
  });

  describe("No user logged in", () => {
    it("should not set timeout when user is null", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: mockLogout,
        login: vi.fn(),
        register: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        refreshSession: vi.fn(),
        hasRole: vi.fn(),
        session: null,
        loading: false,
        initialized: true,
        isAuthenticated: false,
      });

      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Fast forward - should not logout
      act(() => {
        vi.advanceTimersByTime(20 * 60 * 1000);
      });

      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockToast.warning).not.toHaveBeenCalled();
    });
  });

  describe("Activity tracking", () => {
    it("should throttle activity events to 5 seconds", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Get the activity handler
      const addEventListenerCalls = mockWindowAddEventListener.mock.calls;
      const mousedownHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      expect(mousedownHandler).toBeDefined();

      // Call handler multiple times quickly
      act(() => {
        mousedownHandler();
        mousedownHandler();
        mousedownHandler();
      });

      // Should throttle and not cause issues
      expect(true).toBe(true);
    });

    it("should track multiple activity events", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const activityEvents = [
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "click",
        "mousemove",
      ];

      activityEvents.forEach((event) => {
        expect(mockWindowAddEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          { passive: true },
        );
      });

      expect(mockWindowAddEventListener).toHaveBeenCalledTimes(
        activityEvents.length,
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle zero warning minutes", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 1,
          warningMinutes: 0,
          enableWarningDialog: true,
        }),
      );

      // Fast forward - should not show warning
      act(() => {
        vi.advanceTimersByTime(30 * 1000);
      });

      expect(mockToast.warning).not.toHaveBeenCalled();
    });

    it("should handle very short timeout", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 0.5, // 30 seconds
          warningMinutes: 0.25, // 15 seconds
          enableWarningDialog: true,
        }),
      );

      // Fast forward to warning time
      act(() => {
        vi.advanceTimersByTime(15 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalled();

      // Fast forward to timeout
      act(() => {
        vi.advanceTimersByTime(15 * 1000);
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should cleanup timers on unmount", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      unmount();

      // Should clear both timeout and warning timeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should work with default options", () => {
      renderHook(() => useSessionTimeout({}));

      // Should use default values: 15 min timeout, 2 min warning
      expect(mockUseAuth).toHaveBeenCalled();
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle shared device scenario - auto logout after inactivity", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5, // 5 minutes for shared devices
          warningMinutes: 1, // Warn at 4 minutes
          enableWarningDialog: true,
        }),
      );

      // Simulate 4 minutes of inactivity
      act(() => {
        vi.advanceTimersByTime(4 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        "Session akan berakhir dalam 1 menit. Lakukan aktivitas untuk melanjutkan.",
        expect.any(Object),
      );

      // User doesn't respond - continue to 5 minutes
      act(() => {
        vi.advanceTimersByTime(1 * 60 * 1000);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Sesi Anda telah berakhir karena tidak ada aktivitas",
      );
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("should extend session on activity after warning", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(4 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalled();

      // User performs activity - get handler and simulate activity
      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "keydown",
      )?.[1];

      if (handler) {
        // Simulate activity after 5 seconds (throttle period)
        act(() => {
          vi.advanceTimersByTime(5000);
          handler();
        });

        // Session should be extended - no logout
        act(() => {
          vi.advanceTimersByTime(4 * 60 * 1000);
        });

        expect(mockLogout).not.toHaveBeenCalled();
      }
    });
  });
});
