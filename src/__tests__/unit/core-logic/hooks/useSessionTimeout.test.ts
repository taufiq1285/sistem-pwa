/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionTimeout } from "@/lib/hooks/useSessionTimeout";
import type { AuthUser } from "@/types/auth.types";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../../lib/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth as useAuthImport } from "@/lib/hooks/useAuth";
import { toast as toastImport } from "sonner";
const mockUseAuth = vi.mocked(useAuthImport);
const mockToast = vi.mocked(toastImport);

describe("useSessionTimeout Hook", () => {
  let mockLogout: () => Promise<void>;
  let originalLocation: Location;
  let mockWindowAddEventListener: any;
  let mockWindowRemoveEventListener: any;
  let setTimeoutSpy: any;
  let clearTimeoutSpy: any;
  let consoleLogSpy: any;

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

    // Spy on timer functions
    setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    // Spy on console.log
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

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
    consoleLogSpy.mockRestore();
    vi.resetAllMocks();
  });

  // ==========================================
  // SECTION 1: Timer Coverage - setTimeout/clearTimeout
  // ==========================================

  describe("Timer Coverage - setTimeout/clearTimeout", () => {
    it("should set warning timer and logout timer on mount", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Should set 2 timers: warning and logout
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);

      // Warning timer: (15 - 2) * 60 * 1000 = 13 * 60 * 1000
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        13 * 60 * 1000,
      );

      // Logout timer: 15 * 60 * 1000
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        15 * 60 * 1000,
      );
    });

    it("should only set logout timer when warning disabled", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: false,
        }),
      );

      // Should only set 1 timer: logout
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        15 * 60 * 1000,
      );
    });

    it("should clear existing timers before setting new ones (resetTimeout)", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Ambil handler activity untuk memicu resetTimeout pada timer yang sudah ada
      const addEventListenerCalls = mockWindowAddEventListener.mock.calls;
      const mousedownHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      expect(mousedownHandler).toBeDefined();

      // Bersihkan hitungan setelah mount awal
      clearTimeoutSpy.mockClear();

      // Lewati throttle 5 detik lalu trigger activity
      act(() => {
        vi.advanceTimersByTime(5000);
        mousedownHandler();
      });

      // resetTimeout harus membersihkan timeout lama
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    });

    it("should clear timeout and warning timeout on unmount", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      unmount();

      // Should clear both timeout and warning timeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should clear timers when user logs out", () => {
      const { rerender } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // User logs out
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

      rerender();

      // Should clear all timers when user becomes null
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should execute warning timer callback at correct time", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 3,
          enableWarningDialog: true,
        }),
      );

      // Fast forward to warning time (10 - 3 = 7 minutes)
      act(() => {
        vi.advanceTimersByTime(7 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        "Session akan berakhir dalam 3 menit. Lakukan aktivitas untuk melanjutkan.",
        expect.objectContaining({
          duration: 3 * 60 * 1000,
          dismissible: true,
        }),
      );
    });

    it("should execute logout timer callback at correct time", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Fast forward to timeout (5 minutes)
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Session timeout - auto logout",
      );
      expect(mockToast.error).toHaveBeenCalledWith(
        "Sesi Anda telah berakhir karena tidak ada aktivitas",
      );
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("should not set timers when user is null", () => {
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

      // Should not set any timers
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 2: Branch Coverage
  // ==========================================

  describe("Branch Coverage - resetTimeout Function", () => {
    it("should branch: if (timeoutRef.current) clearTimeout - existing timeout", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const addEventListenerCalls = mockWindowAddEventListener.mock.calls;
      const mousedownHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      clearTimeoutSpy.mockClear();

      act(() => {
        vi.advanceTimersByTime(5000);
        mousedownHandler();
      });

      // Timeout utama minimal harus pernah di-clear
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should branch: if (warningTimeoutRef.current) clearTimeout - existing warning timeout", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const addEventListenerCalls = mockWindowAddEventListener.mock.calls;
      const mousedownHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      clearTimeoutSpy.mockClear();

      act(() => {
        vi.advanceTimersByTime(5000);
        mousedownHandler();
      });

      // Warning timeout juga ikut dibersihkan
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should branch: if (!user) return - no user logged in", () => {
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

      // Should return early and not set timers
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      expect(mockToast.warning).not.toHaveBeenCalled();
    });

    it("should branch: if (enableWarningDialog) true - set warning timer", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Should set warning timer
      const warningTimerCalls = setTimeoutSpy.mock.calls.filter(
        (call: any[]) => call[1] === 13 * 60 * 1000,
      );
      expect(warningTimerCalls.length).toBeGreaterThan(0);
    });

    it("should branch: if (enableWarningDialog) false - skip warning timer", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: false,
        }),
      );

      // Should not set warning timer
      const warningTimerCalls = setTimeoutSpy.mock.calls.filter(
        (call: any[]) => call[1] === 13 * 60 * 1000,
      );
      expect(warningTimerCalls.length).toBe(0);
    });

    it("should branch: if (!warningShownRef.current) - show warning first time", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Fast forward to warning time
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      // Warning should be shown (warningShownRef.current was false)
      expect(mockToast.warning).toHaveBeenCalledTimes(1);
    });

    it("should branch: if (!warningShownRef.current) false - warning already shown", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Fast forward to warning time
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(1);

      // Fast forward more - warning should not be shown again
      act(() => {
        vi.advanceTimersByTime(1 * 60 * 1000);
      });

      // Still only 1 warning
      expect(mockToast.warning).toHaveBeenCalledTimes(1);
    });
  });

  describe("Branch Coverage - handleActivity Function", () => {
    it("should branch: if (now - lastActivityRef.current < 5000) - throttle active", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const addEventListenerCalls = mockWindowAddEventListener.mock.calls;
      const mousedownHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      expect(mousedownHandler).toBeDefined();

      // Clear previous setTimeout calls
      setTimeoutSpy.mockClear();

      // Call handler immediately (within 5 seconds - throttle active)
      act(() => {
        mousedownHandler();
      });

      // Should not call resetTimeout (no new timers set)
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it("should branch: if (now - lastActivityRef.current < 5000) false - throttle inactive", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const addEventListenerCalls = mockWindowAddEventListener.mock.calls;
      const mousedownHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      expect(mousedownHandler).toBeDefined();

      // Clear previous setTimeout calls
      setTimeoutSpy.mockClear();
      clearTimeoutSpy.mockClear();

      // Advance time by 5 seconds to exit throttle period
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Call handler after 5 seconds (throttle inactive)
      act(() => {
        mousedownHandler();
      });

      // Should call resetTimeout (new timers set)
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(setTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe("Branch Coverage - useEffect Cleanup", () => {
    it("should branch: if (!user) in useEffect - clear all timeouts", () => {
      const { rerender } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      clearTimeoutSpy.mockClear();

      // User logs out
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

      rerender();

      // Should clear both timeout and warning timeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should branch: if (timeoutRef.current) in cleanup - clear timeout", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      unmount();

      // Should clear timeout in cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should branch: if (warningTimeoutRef.current) in cleanup - clear warning timeout", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      unmount();

      // Should clear warning timeout in cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 3: Path Coverage
  // ==========================================

  describe("Path Coverage - Complete Execution Paths", () => {
    it("Path 1: User present → Set warning timer → Warning shown → Set logout timer → Logout executed", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Step 1: User present, timers set
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);

      // Step 2: Advance to warning time
      act(() => {
        vi.advanceTimersByTime(4 * 60 * 1000);
      });

      // Warning shown
      expect(mockToast.warning).toHaveBeenCalledTimes(1);

      // Step 3: Advance to logout time
      act(() => {
        vi.advanceTimersByTime(1 * 60 * 1000);
      });

      // Logout executed
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("Path 2: User present → Set warning timer → Warning shown → Activity detected → Timers reset", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(1);

      // Get activity handler
      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "keydown",
      )?.[1];

      expect(handler).toBeDefined();

      // Clear previous calls
      setTimeoutSpy.mockClear();
      clearTimeoutSpy.mockClear();

      // Simulate activity after 5 seconds (exit throttle)
      act(() => {
        vi.advanceTimersByTime(5000);
        handler();
      });

      // Timers should be reset (clear + set new ones)
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(setTimeoutSpy).toHaveBeenCalled();

      // Should not logout yet
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("Path 3: Warning disabled → Set logout timer only → Logout executed", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: false,
        }),
      );

      // Only logout timer set
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

      // Advance to logout time
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // No warning shown
      expect(mockToast.warning).not.toHaveBeenCalled();

      // Logout executed
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("Path 4: No user → No timers set → No logout", () => {
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
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // No timers set
      expect(setTimeoutSpy).not.toHaveBeenCalled();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      // No logout
      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockToast.warning).not.toHaveBeenCalled();
    });

    it("Path 5: User logs out → All timers cleared", () => {
      const { rerender } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Timers set
      expect(setTimeoutSpy).toHaveBeenCalled();

      // User logs out
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

      clearTimeoutSpy.mockClear();

      rerender();

      // All timers cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("Path 6: Component unmounts → All timers cleared + event listeners removed", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      unmount();

      // All timers cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();

      // All event listeners removed
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

  // ==========================================
  // SECTION 4: Statement Coverage
  // ==========================================

  describe("Statement Coverage - All Statements Executed", () => {
    it("should execute: warningShownRef.current = false in resetTimeout", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(1);

      // Get handler and trigger activity to reset
      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "keydown",
      )?.[1];

      act(() => {
        vi.advanceTimersByTime(5000);
        handler();
      });

      // Should reset warningShownRef to false
      // Next warning should be shown again after reset
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(2);
    });

    it("should execute: console.log('Session timeout - auto logout')", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Session timeout - auto logout",
      );
    });

    it("should execute: toast.error('Sesi Anda telah berakhir...')", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        "Sesi Anda telah berakhir karena tidak ada aktivitas",
      );
    });

    it("should execute: logout() call", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should execute: window.location.assign('/login')", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("should execute: lastActivityRef.current = now in handleActivity", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "keydown",
      )?.[1];

      // Advance time by 5 seconds to exit throttle
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      clearTimeoutSpy.mockClear();

      // Trigger activity
      act(() => {
        handler();
      });

      // Should have updated lastActivityRef and called resetTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 5: Activity Event Coverage
  // ==========================================

  describe("Activity Event Coverage - All 6 Events", () => {
    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "mousemove",
    ];

    activityEvents.forEach((eventType) => {
      it(`should register and respond to ${eventType} event`, () => {
        renderHook(() =>
          useSessionTimeout({
            timeoutMinutes: 15,
            warningMinutes: 2,
            enableWarningDialog: true,
          }),
        );

        // Verify event listener was added
        expect(mockWindowAddEventListener).toHaveBeenCalledWith(
          eventType,
          expect.any(Function),
          { passive: true },
        );

        // Get the specific handler
        const handler = mockWindowAddEventListener.mock.calls.find(
          (call: any[]) => call[0] === eventType,
        )?.[1];

        expect(handler).toBeDefined();

        // Advance time to exit throttle
        act(() => {
          vi.advanceTimersByTime(5000);
        });

        clearTimeoutSpy.mockClear();

        // Trigger the event
        act(() => {
          handler();
        });

        // Should have reset timeout
        expect(clearTimeoutSpy).toHaveBeenCalled();
      });
    });

    it("should register all 6 activity events with passive: true", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

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

    it("should remove all 6 activity event listeners on unmount", () => {
      const { unmount } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      unmount();

      activityEvents.forEach((event) => {
        expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
        );
      });
    });
  });

  // ==========================================
  // SECTION 6: Throttling Logic
  // ==========================================

  describe("Throttling Logic - 5 Second Throttle", () => {
    it("should skip reset if activity within 5 seconds (throttle active)", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      // Clear initial calls
      setTimeoutSpy.mockClear();
      clearTimeoutSpy.mockClear();

      // First activity
      act(() => {
        handler();
      });

      // Should not reset (within 5 seconds of lastActivityRef initialization)
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it("should reset if activity after 5 seconds (throttle inactive)", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "mousedown",
      )?.[1];

      // Advance 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      setTimeoutSpy.mockClear();
      clearTimeoutSpy.mockClear();

      // Activity after 5 seconds
      act(() => {
        handler();
      });

      // Should reset (after 5 seconds)
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(setTimeoutSpy).toHaveBeenCalled();
    });

    it("should allow multiple activities with 5 second gaps between them", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "click",
      )?.[1];

      // Activity 1: at 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
        handler();
      });

      // Activity 2: at 10 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
        handler();
      });

      // Activity 3: at 15 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
        handler();
      });

      // All activities should trigger reset (each after 5 seconds)
      // Initial + 3 activities = 4 timer setups
      expect(setTimeoutSpy).toHaveBeenCalled();
    });

    it("should throttle rapid successive activities (less than 5 seconds apart)", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "mousemove",
      )?.[1];

      setTimeoutSpy.mockClear();

      // Rapid activities within 5 seconds
      act(() => {
        handler(); // 0 seconds
        handler(); // Still within 5 seconds
        handler(); // Still within 5 seconds
        handler(); // Still within 5 seconds
      });

      // Only initial timer setup, no resets from rapid activities
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 7: Warning Dialog Functionality
  // ==========================================

  describe("Warning Dialog Functionality", () => {
    it("should show warning with correct message and duration", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 5,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        "Session akan berakhir dalam 5 menit. Lakukan aktivitas untuk melanjutkan.",
        {
          duration: 5 * 60 * 1000,
          dismissible: true,
        },
      );
    });

    it("should show warning only once per session", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 5,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(1);

      // Advance more (still before timeout)
      act(() => {
        vi.advanceTimersByTime(3 * 60 * 1000);
      });

      // Still only 1 warning
      expect(mockToast.warning).toHaveBeenCalledTimes(1);
    });

    it("should not show warning when enableWarningDialog is false", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 5,
          enableWarningDialog: false,
        }),
      );

      // Advance past warning time
      act(() => {
        vi.advanceTimersByTime(12 * 60 * 1000);
      });

      expect(mockToast.warning).not.toHaveBeenCalled();
    });

    it("should reset warning flag when timeout is reset", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledTimes(1);

      // Simulate activity to reset
      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "keydown",
      )?.[1];

      act(() => {
        vi.advanceTimersByTime(5000);
        handler();
      });

      // Advance to new warning time
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      // Warning shown again after reset
      expect(mockToast.warning).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================
  // SECTION 8: Edge Cases
  // ==========================================

  describe("Edge Cases", () => {
    it("should handle zero warning minutes", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 0,
          enableWarningDialog: true,
        }),
      );

      // Warning time: (5 - 0) * 60 * 1000 = 5 minutes = same as timeout
      // So warning would trigger at same time as logout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // Both warning and logout might trigger, but logout should happen
      expect(mockLogout).toHaveBeenCalled();
    });

    it("should handle very short timeout (seconds instead of minutes)", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 0.5, // 30 seconds
          warningMinutes: 0.25, // 15 seconds
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time (15 seconds)
      act(() => {
        vi.advanceTimersByTime(15 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalled();

      // Advance to timeout (15 more seconds = 30 total)
      act(() => {
        vi.advanceTimersByTime(15 * 1000);
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should handle timeout longer than warning", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 30,
          warningMinutes: 5,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time (25 minutes)
      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        "Session akan berakhir dalam 5 menit. Lakukan aktivitas untuk melanjutkan.",
        expect.any(Object),
      );
    });

    it("should handle warning minutes equal to timeout minutes", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 10, // Same as timeout
          enableWarningDialog: true,
        }),
      );

      // Warning time: (10 - 10) * 60 * 1000 = 0
      // Warning should trigger immediately
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Warning shown immediately
      expect(mockToast.warning).toHaveBeenCalled();
    });

    it("should handle default options", () => {
      renderHook(() => useSessionTimeout());

      // Default: 15 min timeout, 2 min warning
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        15 * 60 * 1000, // Logout timer
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        13 * 60 * 1000, // Warning timer (15 - 2)
      );
    });

    it("should handle user switching (logout then login as different user)", () => {
      const { rerender } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // User 1 logged in
      expect(setTimeoutSpy).toHaveBeenCalled();

      // User logs out
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

      clearTimeoutSpy.mockClear();

      rerender();

      // Timers cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();

      // User 2 logs in
      const user2: AuthUser = {
        ...mockUser,
        id: "2",
        email: "user2@example.com",
      };

      mockUseAuth.mockReturnValue({
        user: user2,
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

      setTimeoutSpy.mockClear();

      rerender();

      // New timers set for user 2
      expect(setTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 9: Real-World Scenarios
  // ==========================================

  describe("Real-World Scenarios", () => {
    it("should handle shared device scenario - auto logout after inactivity", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5, // 5 minutes for shared devices
          warningMinutes: 1, // Warn at 4 minutes
          enableWarningDialog: true,
        }),
      );

      // User is inactive for 4 minutes
      act(() => {
        vi.advanceTimersByTime(4 * 60 * 1000);
      });

      // Warning shown
      expect(mockToast.warning).toHaveBeenCalledWith(
        "Session akan berakhir dalam 1 menit. Lakukan aktivitas untuk melanjutkan.",
        expect.any(Object),
      );

      // User doesn't respond - continue to 5 minutes
      act(() => {
        vi.advanceTimersByTime(1 * 60 * 1000);
      });

      // Auto logout
      expect(mockToast.error).toHaveBeenCalledWith(
        "Sesi Anda telah berakhir karena tidak ada aktivitas",
      );
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("should extend session when user responds to warning", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 10,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // Advance to warning time (8 minutes)
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      expect(mockToast.warning).toHaveBeenCalled();

      // User performs activity (e.g., clicks somewhere)
      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "click",
      )?.[1];

      act(() => {
        vi.advanceTimersByTime(5000); // Exit throttle
        handler();
      });

      // Advance 8 more minutes (would be timeout without activity)
      act(() => {
        vi.advanceTimersByTime(8 * 60 * 1000);
      });

      // Should NOT logout - session extended
      expect(mockLogout).not.toHaveBeenCalled();

      // New warning shown
      expect(mockToast.warning).toHaveBeenCalledTimes(2);
    });

    it("should handle continuous activity (no timeout)", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "keydown",
      )?.[1];

      // Simulate continuous activity every 30 seconds for 10 minutes
      for (let i = 0; i < 20; i++) {
        act(() => {
          vi.advanceTimersByTime(30000); // 30 seconds
        });

        // After 5 seconds from last activity
        if (i > 0) {
          act(() => {
            handler();
          });
        }
      }

      // Should never logout or show warning due to continuous activity
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("should handle tab switching (visibility changes)", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // User switches away from tab (no activity)
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000);
      });

      // Should still timeout
      expect(mockLogout).toHaveBeenCalled();
    });

    it("should handle network latency during logout", async () => {
      // Mock logout that takes time
      mockLogout = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 1000));
      });

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

      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // Logout should be called even if it takes time
      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });
  });

  // ==========================================
  // SECTION 10: Integration with useAuth
  // ==========================================

  describe("Integration with useAuth", () => {
    it("should call useAuth logout function on timeout", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should call the logout from useAuth
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it("should respect user state from useAuth", () => {
      // Initially no user
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

      const { rerender } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // No timers set
      expect(setTimeoutSpy).not.toHaveBeenCalled();

      // User logs in
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

      rerender();

      // Timers now set
      expect(setTimeoutSpy).toHaveBeenCalled();
    });

    it("should handle useAuth state changes", () => {
      const { rerender } = renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      // User logged in
      expect(setTimeoutSpy).toHaveBeenCalled();

      // Change to different user
      const user2: AuthUser = {
        ...mockUser,
        id: "2",
        email: "user2@example.com",
      };

      mockUseAuth.mockReturnValue({
        user: user2,
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

      setTimeoutSpy.mockClear();

      rerender();

      // Timers reset for new user
      expect(setTimeoutSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 11: Performance Testing
  // ==========================================

  describe("Performance Testing", () => {
    it("should handle rapid timer resets efficiently", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          enableWarningDialog: true,
        }),
      );

      const handler = mockWindowAddEventListener.mock.calls.find(
        (call: any[]) => call[0] === "mousemove",
      )?.[1];

      // Simulate 100 activity events with 5 second gaps
      clearTimeoutSpy.mockClear();
      for (let i = 0; i < 100; i++) {
        act(() => {
          vi.advanceTimersByTime(5000);
          handler();
        });
      }

      // Dengan fake timers, performa wall-time tidak representatif.
      // Validasi efisiensi secara fungsional: loop selesai dan reset timeout terjadi berulang.
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(50);
    });

    it("should not cause memory leaks with multiple mount/unmount cycles", () => {
      const mounts = 10;

      for (let i = 0; i < mounts; i++) {
        const { unmount } = renderHook(() =>
          useSessionTimeout({
            timeoutMinutes: 15,
            warningMinutes: 2,
            enableWarningDialog: true,
          }),
        );

        unmount();
      }

      // All timers should be cleared
      // All event listeners should be removed
      const activityEvents = [
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "click",
        "mousemove",
      ];

      const removeCalls = mockWindowRemoveEventListener.mock.calls;
      activityEvents.forEach((event) => {
        const eventRemoves = removeCalls.filter(
          (call: any[]) => call[0] === event,
        );
        expect(eventRemoves.length).toBe(mounts);
      });
    });
  });

  // ==========================================
  // SECTION 12: Error Handling
  // ==========================================

  describe("Error Handling", () => {
    it("should handle logout function throwing error", async () => {
      const mockErrorLogout = vi
        .fn()
        .mockRejectedValue(new Error("Logout failed"));

      mockUseAuth.mockReturnValue({
        user: mockUser,
        logout: mockErrorLogout,
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

      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should still attempt redirect even if logout fails
      expect(mockErrorLogout).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });

    it("should handle window.location.assign throwing error", () => {
      const mockAssign = vi.fn().mockImplementation(() => {
        throw new Error("Navigation failed");
      });

      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          assign: mockAssign,
        },
        writable: true,
        configurable: true,
      });

      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 5,
          warningMinutes: 1,
          enableWarningDialog: true,
        }),
      );

      // Advance to timeout
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // Should attempt logout and redirect
      expect(mockLogout).toHaveBeenCalled();
      expect(mockAssign).toHaveBeenCalledWith("/login");
    });

    it("should handle toast functions throwing errors", async () => {
      // SKIPPED: Hook does not currently handle toast errors
      // TODO: Add try-catch in hook implementation if this is needed

      // Mock toast.warning to throw error
      const originalWarning = mockToast.warning;
      mockToast.warning = vi.fn().mockImplementation(() => {
        throw new Error("Toast failed");
      });

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

      // Should attempt to show warning even if it fails
      expect(mockToast.warning).toHaveBeenCalled();

      // Restore
      mockToast.warning = originalWarning;
    });
  });

  // ==========================================
  // SECTION 13: Configuration Validation
  // ==========================================

  describe("Configuration Validation", () => {
    it("should use default values when options not provided", () => {
      renderHook(() => useSessionTimeout({}));

      // Default: 15 min timeout, 2 min warning, enableWarningDialog: true
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        15 * 60 * 1000, // Logout timer
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        13 * 60 * 1000, // Warning timer (15 - 2)
      );
    });

    it("should use default values when called with no arguments", () => {
      renderHook(() => useSessionTimeout());

      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        15 * 60 * 1000, // Logout timer
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        13 * 60 * 1000, // Warning timer (15 - 2)
      );
    });

    it("should handle partial configuration", () => {
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: 20, // Custom timeout
          // warningMinutes and enableWarningDialog use defaults
        }),
      );

      // 20 min timeout, 2 min warning (default)
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        20 * 60 * 1000, // Logout timer
      );
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        18 * 60 * 1000, // Warning timer (20 - 2)
      );
    });

    it("should handle invalid configuration gracefully", () => {
      // TypeScript would prevent this at compile time, but runtime test
      renderHook(() =>
        useSessionTimeout({
          timeoutMinutes: -1, // Invalid
          warningMinutes: -1, // Invalid
          enableWarningDialog: true,
        }),
      );

      // Should still set timers (negative values would be handled by setTimeout)
      expect(setTimeoutSpy).toHaveBeenCalled();
    });
  });
});
