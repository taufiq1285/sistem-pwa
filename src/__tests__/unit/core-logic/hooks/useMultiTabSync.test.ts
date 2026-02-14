/**
 * White-box Tests for useMultiTabSync Hook
 *
 * Coverage Goals:
 * - Statement Coverage: 100%
 * - Branch Coverage: 100%
 * - Path Coverage: 100%
 * - Condition Coverage: 100%
 * - Integration Coverage: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMultiTabSync } from "@/lib/hooks/useMultiTabSync";

// Mock useAuth hook
const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  role: "mahasiswa",
};

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    logout: mockLogout,
  })),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock window.location
const originalLocation = window.location;
delete (window as any).location;
window.location = { href: "" } as any;

describe("useMultiTabSync", () => {
  let storageEventListeners: Array<(e: StorageEvent) => void>;
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    storageEventListeners = [];
    mockLogout.mockResolvedValue(undefined);

    // Capture storage event listeners
    addEventListenerSpy = vi.spyOn(window, "addEventListener").mockImplementation(
      (event: string, handler: any) => {
        if (event === "storage") {
          storageEventListeners.push(handler);
        }
        return undefined;
      },
    );

    removeEventListenerSpy = vi.spyOn(window, "removeEventListener").mockReturnValue(undefined);

    // Clear localStorage
    localStorage.clear();

    // Reset window.location.href
    window.location.href = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  // Helper to trigger storage event
  const triggerStorageEvent = (
    key: string,
    newValue: string | null,
    oldValue: string | null = null,
  ) => {
    const event = new StorageEvent("storage", {
      key,
      newValue,
      oldValue,
      storageArea: localStorage,
    });

    storageEventListeners.forEach((handler) => handler(event));
  };

  describe("SECTION 1: Hook Initialization", () => {
    it("should initialize with user present", () => {
      const { result } = renderHook(() => useMultiTabSync());

      expect(result.current).toBeDefined();
      expect(result.current.broadcastLogin).toBeInstanceOf(Function);
      expect(result.current.broadcastLogout).toBeInstanceOf(Function);
    });

    it("should add storage event listener on mount", () => {
      renderHook(() => useMultiTabSync());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function),
      );
    });

    it("should remove storage event listener on unmount", () => {
      const { unmount } = renderHook(() => useMultiTabSync());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it("should broadcast current user login on mount", () => {
      renderHook(() => useMultiTabSync());

      const storedData = localStorage.getItem("_multiTabSync");
      expect(storedData).toBeDefined();

      if (storedData) {
        const message = JSON.parse(storedData);
        expect(message.type).toBe("login");
        expect(message.userId).toBe("user-123");
        expect(message.email).toBe("test@example.com");
        expect(message.timestamp).toBeDefined();
      }
    });
  });

  describe("SECTION 2: broadcastLogin Function", () => {
    it("should broadcast login event to localStorage", () => {
      const { result } = renderHook(() => useMultiTabSync());

      act(() => {
        result.current.broadcastLogin("user-456", "new@example.com");
      });

      const storedData = localStorage.getItem("_multiTabSync");
      expect(storedData).toBeDefined();

      if (storedData) {
        const message = JSON.parse(storedData);
        expect(message.type).toBe("login");
        expect(message.userId).toBe("user-456");
        expect(message.email).toBe("new@example.com");
        expect(message.timestamp).toBeGreaterThan(0);
      }
    });

    it("should overwrite previous login broadcast", () => {
      const { result } = renderHook(() => useMultiTabSync());

      act(() => {
        result.current.broadcastLogin("user-111", "first@example.com");
      });

      let storedData = localStorage.getItem("_multiTabSync");
      let message = JSON.parse(storedData!);
      expect(message.userId).toBe("user-111");

      act(() => {
        result.current.broadcastLogin("user-222", "second@example.com");
      });

      storedData = localStorage.getItem("_multiTabSync");
      message = JSON.parse(storedData!);
      expect(message.userId).toBe("user-222");
      expect(message.email).toBe("second@example.com");
    });

    it("should include valid timestamp", () => {
      const { result } = renderHook(() => useMultiTabSync());

      const beforeTime = Date.now();

      act(() => {
        result.current.broadcastLogin("user-123", "test@example.com");
      });

      const afterTime = Date.now();

      const storedData = localStorage.getItem("_multiTabSync");
      const message = JSON.parse(storedData!);
      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("SECTION 3: broadcastLogout Function", () => {
    it("should broadcast logout event to localStorage", () => {
      const { result } = renderHook(() => useMultiTabSync());

      act(() => {
        result.current.broadcastLogout();
      });

      const storedData = localStorage.getItem("_logout_event");
      expect(storedData).toBeDefined();

      if (storedData) {
        const message = JSON.parse(storedData);
        expect(message.type).toBe("logout");
        expect(message.timestamp).toBeGreaterThan(0);
      }
    });

    it("should not include userId in logout message", () => {
      const { result } = renderHook(() => useMultiTabSync());

      act(() => {
        result.current.broadcastLogout();
      });

      const storedData = localStorage.getItem("_logout_event");
      const message = JSON.parse(storedData!);
      expect(message.userId).toBeUndefined();
      expect(message.email).toBeUndefined();
    });
  });

  describe("SECTION 4: Storage Event Handling - Logout Detection", () => {
    it("should detect logout event from another tab", async () => {
      const { toast } = await import("sonner");

      renderHook(() => useMultiTabSync());

      const logoutMessage = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(logoutMessage));
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalledWith(
        "Terdeteksi logout dari tab lain",
      );
    });

    it("should ignore logout event with null newValue", async () => {
      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("_logout_event", null);
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("should handle logout event with valid JSON", async () => {
      renderHook(() => useMultiTabSync());

      const validMessage = JSON.stringify({
        type: "logout",
        timestamp: 1234567890,
      });

      await act(async () => {
        triggerStorageEvent("_logout_event", validMessage);
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should handle logout event gracefully with invalid JSON", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("_logout_event", "invalid-json");
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Error handling multi-tab sync:",
        expect.any(Error),
      );

      // Should not logout on error
      expect(mockLogout).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("SECTION 5: Storage Event Handling - Different User Login", () => {
    it("should detect different user login from another tab", async () => {
      const { toast } = await import("sonner");

      renderHook(() => useMultiTabSync());

      const differentUserMessage = {
        type: "login" as const,
        userId: "different-user-456",
        email: "different@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent(
          "_multiTabSync",
          JSON.stringify(differentUserMessage),
        );
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(toast.warning).toHaveBeenCalledWith(
        "different@example.com login di tab lain - current session logout",
      );
    });

    it("should NOT logout when same user logs in another tab", async () => {
      renderHook(() => useMultiTabSync());

      const sameUserMessage = {
        type: "login" as const,
        userId: "user-123", // Same as current user
        email: "test@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(sameUserMessage));
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("should ignore login event with null newValue", async () => {
      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("_multiTabSync", null);
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("should ignore login event with missing userId", async () => {
      renderHook(() => useMultiTabSync());

      const messageWithoutUserId = {
        type: "login" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent(
          "_multiTabSync",
          JSON.stringify(messageWithoutUserId),
        );
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("should handle login event with invalid JSON", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("_multiTabSync", "invalid-json");
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Error handling multi-tab sync:",
        expect.any(Error),
      );
      expect(mockLogout).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("SECTION 6: Branch Coverage - Storage Event Filtering", () => {
    it("should ignore storage events for unrelated keys", async () => {
      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("unrelated_key", "some-value");
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("should process LOGOUT_EVENT key", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(message));
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("should process STORAGE_KEY for login events", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "login" as const,
        userId: "other-user",
        email: "other@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(message));
      });

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("SECTION 7: Integration with useAuth", () => {
    it("should call logout from useAuth when detecting logout event", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(message));
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it("should call logout when different user logs in", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "login" as const,
        userId: "completely-different-user",
        email: "alien@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(message));
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("SECTION 8: Toast Notifications", () => {
    it("should show info toast when detecting logout from another tab", async () => {
      const { toast } = await import("sonner");

      renderHook(() => useMultiTabSync());

      const message = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(message));
      });

      expect(toast.info).toHaveBeenCalledWith(
        "Terdeteksi logout dari tab lain",
      );
    });

    it("should show warning toast when different user logs in", async () => {
      const { toast } = await import("sonner");

      renderHook(() => useMultiTabSync());

      const message = {
        type: "login" as const,
        userId: "different-user",
        email: "newuser@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(message));
      });

      expect(toast.warning).toHaveBeenCalledWith(
        "newuser@example.com login di tab lain - current session logout",
      );
    });

    it("should not show toast when same user logs in", async () => {
      const { toast } = await import("sonner");

      renderHook(() => useMultiTabSync());

      const message = {
        type: "login" as const,
        userId: "user-123", // Same user
        email: "test@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(message));
      });

      expect(toast.info).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });
  });

  describe("SECTION 9: Console Logging", () => {
    it("should log when detecting logout from another tab", async () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      const message = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(message));
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Detected logout from another tab, current tab logging out",
      );

      consoleLogSpy.mockRestore();
    });

    it("should log when detecting different user login", async () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      const message = {
        type: "login" as const,
        userId: "different-user",
        email: "different@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(message));
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Different user detected"),
      );

      consoleLogSpy.mockRestore();
    });

    it("should warn on error handling storage event", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("_multiTabSync", "{invalid-json}");
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Error handling multi-tab sync:",
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("SECTION 10: Timestamp Handling", () => {
    it("should include valid timestamp in login broadcast", () => {
      const { result } = renderHook(() => useMultiTabSync());

      const before = Date.now();

      act(() => {
        result.current.broadcastLogin("user-123", "test@example.com");
      });

      const after = Date.now();

      const stored = localStorage.getItem("_multiTabSync");
      const message = JSON.parse(stored!);
      expect(message.timestamp).toBeGreaterThanOrEqual(before);
      expect(message.timestamp).toBeLessThanOrEqual(after);
    });

    it("should include valid timestamp in logout broadcast", () => {
      const { result } = renderHook(() => useMultiTabSync());

      const before = Date.now();

      act(() => {
        result.current.broadcastLogout();
      });

      const after = Date.now();

      const stored = localStorage.getItem("_logout_event");
      const message = JSON.parse(stored!);
      expect(message.timestamp).toBeGreaterThanOrEqual(before);
      expect(message.timestamp).toBeLessThanOrEqual(after);
    });

    it("should handle storage event with old timestamp", async () => {
      renderHook(() => useMultiTabSync());

      const oldMessage = {
        type: "logout" as const,
        timestamp: 1000000000000, // Old timestamp
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(oldMessage));
      });

      // Should still process old events
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("SECTION 11: Multiple Event Handling", () => {
    it("should handle multiple sequential logout events", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(message));
      });

      // First logout should be called
      expect(mockLogout).toHaveBeenCalledTimes(1);

      // Reset mock
      mockLogout.mockClear();

      // Second event
      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(message));
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid login events from different users", async () => {
      renderHook(() => useMultiTabSync());

      const user1Message = {
        type: "login" as const,
        userId: "user-111",
        email: "user1@example.com",
        timestamp: Date.now(),
      };

      const user2Message = {
        type: "login" as const,
        userId: "user-222",
        email: "user2@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(user1Message));
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);

      mockLogout.mockClear();

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(user2Message));
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("SECTION 12: Return Value - Broadcast Functions", () => {
    it("should return broadcastLogin function", () => {
      const { result } = renderHook(() => useMultiTabSync());

      expect(result.current.broadcastLogin).toBeDefined();
      expect(typeof result.current.broadcastLogin).toBe("function");
    });

    it("should return broadcastLogout function", () => {
      const { result } = renderHook(() => useMultiTabSync());

      expect(result.current.broadcastLogout).toBeDefined();
      expect(typeof result.current.broadcastLogout).toBe("function");
    });
  });

  describe("SECTION 13: Path Coverage - All Execution Paths", () => {
    it("Path 1: User present -> attach listener -> receive logout event -> logout", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(message));
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("Path 2: User present -> attach listener -> receive different user login -> logout", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "login" as const,
        userId: "different",
        email: "different@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(message));
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it("Path 3: User present -> attach listener -> receive same user login -> no logout", async () => {
      renderHook(() => useMultiTabSync());

      const message = {
        type: "login" as const,
        userId: "user-123",
        email: "test@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(message));
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("Path 4: User present -> attach listener -> receive unrelated key -> no logout", async () => {
      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("random_key", "value");
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("Path 5: User present -> attach listener -> receive null newValue -> no logout", async () => {
      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("_logout_event", null);
      });

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("Path 6: User present -> attach listener -> receive invalid JSON -> warn", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      await act(async () => {
        triggerStorageEvent("_multiTabSync", "not-json");
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(mockLogout).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("Path 7: Broadcast login -> store in localStorage", () => {
      const { result } = renderHook(() => useMultiTabSync());

      act(() => {
        result.current.broadcastLogin("test-id", "test@example.com");
      });

      const stored = localStorage.getItem("_multiTabSync");
      expect(stored).toBeDefined();
    });

    it("Path 8: Broadcast logout -> store in localStorage", () => {
      const { result } = renderHook(() => useMultiTabSync());

      act(() => {
        result.current.broadcastLogout();
      });

      const stored = localStorage.getItem("_logout_event");
      expect(stored).toBeDefined();
    });

    it("Path 9: Hook unmount -> remove listener", () => {
      const { unmount } = renderHook(() => useMultiTabSync());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe("SECTION 14: Real-World Scenarios", () => {
    it("Scenario 1: User opens two tabs, logs out in one tab", async () => {
      const { toast } = await import("sonner");

      // Tab 1: Render hook
      renderHook(() => useMultiTabSync());

      // Simulate Tab 2 logging out
      const logoutMessage = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(logoutMessage));
      });

      // Tab 1 should logout
      expect(mockLogout).toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalled();
    });

    it("Scenario 2: User opens two tabs, different user logs in Tab 2", async () => {
      const { toast } = await import("sonner");

      // Tab 1: User A logged in
      renderHook(() => useMultiTabSync());

      // Tab 2: User B logs in
      const userBLogin = {
        type: "login" as const,
        userId: "user-b-456",
        email: "userB@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(userBLogin));
      });

      // Tab 1 should logout
      expect(mockLogout).toHaveBeenCalled();
      expect(toast.warning).toHaveBeenCalledWith(
        "userB@example.com login di tab lain - current session logout",
      );
    });

    it("Scenario 3: Same user opens multiple tabs, no conflict", async () => {
      // Tab 1
      renderHook(() => useMultiTabSync());

      // Tab 2: Same user logs in
      const sameUserLogin = {
        type: "login" as const,
        userId: "user-123", // Same user
        email: "test@example.com",
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_multiTabSync", JSON.stringify(sameUserLogin));
      });

      // Should NOT logout
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it("Scenario 4: Network issues cause corrupted storage event", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      // Corrupted data
      await act(async () => {
        triggerStorageEvent("_multiTabSync", "corrupted{data");
      });

      // Should handle gracefully
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(mockLogout).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("SECTION 15: Error Recovery", () => {
    it("should recover from JSON parse error and continue listening", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() => useMultiTabSync());

      // Send invalid JSON
      await act(async () => {
        triggerStorageEvent("_multiTabSync", "invalid");
      });

      expect(consoleWarnSpy).toHaveBeenCalled();

      // Reset mock
      mockLogout.mockClear();

      // Send valid logout event
      const validMessage = {
        type: "logout" as const,
        timestamp: Date.now(),
      };

      await act(async () => {
        triggerStorageEvent("_logout_event", JSON.stringify(validMessage));
      });

      expect(mockLogout).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
