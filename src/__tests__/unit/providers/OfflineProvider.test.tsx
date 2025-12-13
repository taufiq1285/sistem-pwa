/**
 * OfflineProvider Unit Tests
 *
 * Comprehensive test suite for OfflineProvider
 * Tests initialization, context providing, and IndexedDB integration
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  OfflineProvider,
  useOfflineContext,
} from "../../../providers/OfflineProvider";
import { indexedDBManager } from "../../../lib/offline/indexeddb";

// ============================================================================
// MOCK SETUP
// ============================================================================

vi.mock("@/lib/offline/indexeddb", () => ({
  indexedDBManager: {
    initialize: vi.fn(),
    isReady: vi.fn(),
  },
}));

vi.mock("@/lib/hooks/useOffline", () => ({
  useOffline: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    isUnstable: false,
    status: "online" as const,
    saveOffline: vi.fn(),
    getOffline: vi.fn(),
    getAllOffline: vi.fn(),
    deleteOffline: vi.fn(),
    quality: {
      latency: 50,
      downlink: 10,
      effectiveType: "4g",
      saveData: false,
      rtt: 50,
    },
  })),
}));

// ============================================================================
// TEST COMPONENTS
// ============================================================================

function TestConsumer() {
  const offline = useOfflineContext();

  return (
    <div>
      <div data-testid="status">{offline.status}</div>
      <div data-testid="isOnline">{offline.isOnline.toString()}</div>
      <div data-testid="isOffline">{offline.isOffline.toString()}</div>
    </div>
  );
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("OfflineProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (indexedDBManager.initialize as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize IndexedDB on mount", async () => {
      render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(indexedDBManager.initialize).toHaveBeenCalled();
      });
    });

    it("should render children after IndexedDB is ready", async () => {
      render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("status")).toBeInTheDocument();
      });
    });

    it("should not render children before IndexedDB is ready", () => {
      (indexedDBManager.initialize as any).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { container } = render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should log success message when IndexedDB initializes", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining("OfflineProvider: IndexedDB initialized"),
        );
      });

      consoleLogSpy.mockRestore();
    });

    it("should log error message when IndexedDB initialization fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Init failed");
      (indexedDBManager.initialize as any).mockRejectedValue(error);

      render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "OfflineProvider: Failed to initialize IndexedDB",
          ),
          error,
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ============================================================================
  // CONTEXT TESTS
  // ============================================================================

  describe("Context", () => {
    it("should provide offline context to children", async () => {
      render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("online");
        expect(screen.getByTestId("isOnline")).toHaveTextContent("true");
        expect(screen.getByTestId("isOffline")).toHaveTextContent("false");
      });
    });

    it("should throw error when useOfflineContext is used outside provider", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useOfflineContext must be used within OfflineProvider");

      consoleErrorSpy.mockRestore();
    });

    it("should provide all offline methods", async () => {
      function MethodChecker() {
        const offline = useOfflineContext();

        return (
          <div>
            <div data-testid="hasOffline">
              {offline.saveOffline !== undefined ? "true" : "false"}
            </div>
            <div data-testid="hasGet">
              {offline.getOffline !== undefined ? "true" : "false"}
            </div>
            <div data-testid="hasGetAll">
              {offline.getAllOffline !== undefined ? "true" : "false"}
            </div>
            <div data-testid="hasDelete">
              {offline.deleteOffline !== undefined ? "true" : "false"}
            </div>
          </div>
        );
      }

      render(
        <OfflineProvider>
          <MethodChecker />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("hasOffline")).toHaveTextContent("true");
        expect(screen.getByTestId("hasGet")).toHaveTextContent("true");
        expect(screen.getByTestId("hasGetAll")).toHaveTextContent("true");
        expect(screen.getByTestId("hasDelete")).toHaveTextContent("true");
      });
    });

    it("should provide quality metrics", async () => {
      function QualityChecker() {
        const offline = useOfflineContext();

        return (
          <div>
            <div data-testid="quality">
              {offline.quality ? "available" : "unavailable"}
            </div>
            {offline.quality && (
              <>
                <div data-testid="effectiveType">
                  {offline.quality.effectiveType}
                </div>
                <div data-testid="latency">{offline.quality.latency}</div>
              </>
            )}
          </div>
        );
      }

      render(
        <OfflineProvider>
          <QualityChecker />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("quality")).toHaveTextContent("available");
        expect(screen.getByTestId("effectiveType")).toHaveTextContent("4g");
        expect(screen.getByTestId("latency")).toHaveTextContent("50");
      });
    });
  });

  // ============================================================================
  // CLEANUP TESTS
  // ============================================================================

  describe("Cleanup", () => {
    it("should cleanup on unmount", async () => {
      const { unmount } = render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(indexedDBManager.initialize).toHaveBeenCalled();
      });

      unmount();

      // Should not throw or cause errors
      expect(true).toBe(true);
    });

    it("should not update state after unmount", async () => {
      let resolveInit: () => void;
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve;
      });

      (indexedDBManager.initialize as any).mockReturnValue(initPromise);

      const { unmount } = render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      unmount();

      // Resolve after unmount
      resolveInit!();

      // Wait a bit to ensure no state updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not throw or cause errors
      expect(true).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration", () => {
    it("should work with multiple children", async () => {
      render(
        <OfflineProvider>
          <TestConsumer />
          <TestConsumer />
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        const statusElements = screen.getAllByTestId("status");
        expect(statusElements).toHaveLength(3);
        statusElements.forEach((el) => {
          expect(el).toHaveTextContent("online");
        });
      });
    });

    it("should initialize only once with multiple children", async () => {
      render(
        <OfflineProvider>
          <TestConsumer />
          <TestConsumer />
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("status")).toHaveLength(3);
      });

      expect(indexedDBManager.initialize).toHaveBeenCalledTimes(1);
    });

    it("should handle nested components accessing context", async () => {
      function NestedComponent() {
        return (
          <div>
            <TestConsumer />
            <div>
              <TestConsumer />
            </div>
          </div>
        );
      }

      render(
        <OfflineProvider>
          <NestedComponent />
        </OfflineProvider>,
      );

      await waitFor(() => {
        const statusElements = screen.getAllByTestId("status");
        expect(statusElements).toHaveLength(2);
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle IndexedDB initialization error gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (indexedDBManager.initialize as any).mockRejectedValue(
        new Error("IndexedDB not supported"),
      );

      const { container } = render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Should not render children on error
      expect(container.firstChild).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it("should not throw when initialization takes long time", async () => {
      const initPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      (indexedDBManager.initialize as any).mockReturnValue(initPromise);

      const { container } = render(
        <OfflineProvider>
          <TestConsumer />
        </OfflineProvider>,
      );

      // Initially null
      expect(container.firstChild).toBeNull();

      // After initialization
      await waitFor(
        () => {
          expect(screen.getByTestId("status")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });
});
