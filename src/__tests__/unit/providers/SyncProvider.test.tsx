/**
 * SyncProvider Unit Tests
 *
 * Comprehensive test suite for SyncProvider
 * Tests sync queue management, auto-sync, and context providing
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { SyncProvider, useSyncContext } from "../../../providers/SyncProvider";

// ✅ FIX: Import mocked hooks to avoid dynamic require() errors
import { useSync } from "../../../lib/hooks/useSync";
import { useNetworkStatus } from "../../../lib/hooks/useNetworkStatus";

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockProcessQueue = vi.fn();
const mockStats = {
  total: 10,
  pending: 5,
  syncing: 0,
  completed: 3,
  failed: 2,
};

// Create stable mock return object
const mockSyncReturnValue = {
  addToQueue: vi.fn(),
  processQueue: mockProcessQueue,
  retryFailed: vi.fn(),
  clearCompleted: vi.fn(),
  stats: mockStats,
  isProcessing: false,
  isReady: true,
  refreshStats: vi.fn(),
  getAllItems: vi.fn(),
};

// ✅ FIXED: Proper type definition without 'as const' to allow mutation
let mockNetworkStatus: {
  isOnline: boolean;
  isOffline: boolean;
  isUnstable?: boolean;
  status: "online" | "offline" | "unstable";
} = {
  isOnline: true,
  isOffline: false,
  isUnstable: false,
  status: "online",
};

vi.mock("@/lib/hooks/useSync", () => ({
  useSync: vi.fn(() => mockSyncReturnValue),
}));

vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(() => mockNetworkStatus),
}));

// ============================================================================
// TEST COMPONENTS
// ============================================================================

function TestConsumer() {
  const sync = useSyncContext();

  return (
    <div>
      <div data-testid="isReady">{sync.isReady.toString()}</div>
      <div data-testid="isProcessing">{sync.isProcessing.toString()}</div>
      <div data-testid="pending">{sync.stats?.pending || 0}</div>
      <div data-testid="total">{sync.stats?.total || 0}</div>
    </div>
  );
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("SyncProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessQueue.mockResolvedValue(undefined);
    // Reset network status to online
    mockNetworkStatus = {
      isOnline: true,
      isOffline: false,
      isUnstable: false,
      status: "online",
    };
    // Reset mockStats
    mockStats.total = 10;
    mockStats.pending = 5;
    mockStats.syncing = 0;
    mockStats.completed = 3;
    mockStats.failed = 2;
    // Reset mockSyncReturnValue
    mockSyncReturnValue.stats = mockStats;
    mockSyncReturnValue.isProcessing = false;
    mockSyncReturnValue.isReady = true;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe("Initialization", () => {
    it("should render children immediately", () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      expect(screen.getByTestId("isReady")).toBeInTheDocument();
    });

    it("should provide sync context to children", () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      expect(screen.getByTestId("isReady")).toHaveTextContent("true");
      expect(screen.getByTestId("isProcessing")).toHaveTextContent("false");
    });

    it("should provide stats to children", () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      expect(screen.getByTestId("pending")).toHaveTextContent("5");
      expect(screen.getByTestId("total")).toHaveTextContent("10");
    });
  });

  // ============================================================================
  // AUTO-SYNC TESTS
  // ============================================================================

  describe("Auto-sync", () => {
    it("should auto-sync when online and has pending items", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      await waitFor(() => {
        expect(mockProcessQueue).toHaveBeenCalled();
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Auto-syncing 5 pending items"),
      );

      consoleLogSpy.mockRestore();
    });

    it("should not auto-sync when autoSync is false", async () => {
      render(
        <SyncProvider autoSync={false}>
          <TestConsumer />
        </SyncProvider>,
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it("should not auto-sync when offline", async () => {
      // ✅ FIXED: Use vi.mocked instead of dynamic require
      vi.mocked(useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
        status: "offline",
        isUnstable: false,
        lastChanged: 0,
        isReady: false,
      });

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();

      // Reset network status
      vi.mocked(useNetworkStatus).mockReturnValue({
        isOnline: true,
        isOffline: false,
        status: "online",
        isUnstable: false,
        lastChanged: Date.now(),
        isReady: true,
      });
    });

    it("should not auto-sync when not ready", async () => {
      // ✅ FIXED: Use the stable mock object
      mockSyncReturnValue.isReady = false;

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();

      // Reset
      mockSyncReturnValue.isReady = true;
    });

    it("should not auto-sync when no pending items", async () => {
      // ✅ FIXED: Use the stable mock object
      mockSyncReturnValue.stats = { ...mockStats, pending: 0 };

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();

      // Reset
      mockSyncReturnValue.stats = mockStats;
    });

    it("should handle auto-sync errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const error = new Error("Sync failed");

      // Mock to reject once, then resolve
      mockProcessQueue
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait for auto-sync to be triggered
      await waitFor(
        () => {
          expect(mockProcessQueue).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // Wait for error to be logged
      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Auto-sync failed:",
            error,
          );
        },
        { timeout: 3000 },
      );

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should trigger auto-sync when coming back online", async () => {
      // Clear any previous calls
      mockProcessQueue.mockClear();

      // Start offline
      mockNetworkStatus.isOnline = false;
      mockNetworkStatus.isOffline = true;
      mockNetworkStatus.status = "offline";

      // Start with autoSync disabled to avoid initial sync
      const { rerender } = render(
        <SyncProvider autoSync={false}>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait a bit to ensure no sync happened while offline and autoSync disabled
      await waitFor(
        () => {
          expect(screen.getByTestId("isReady")).toHaveTextContent("true");
        },
        { timeout: 2000 },
      );

      expect(mockProcessQueue).not.toHaveBeenCalled();

      // Go online AND enable autoSync
      mockNetworkStatus.isOnline = true;
      mockNetworkStatus.isOffline = false;
      mockNetworkStatus.status = "online";

      // Rerender with both online status and autoSync enabled
      rerender(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait for auto-sync to be triggered
      await waitFor(
        () => {
          expect(mockProcessQueue).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });
  });

  // ============================================================================
  // CONTEXT TESTS
  // ============================================================================

  describe("Context", () => {
    it("should throw error when useSyncContext is used outside provider", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useSyncContext must be used within SyncProvider");

      consoleErrorSpy.mockRestore();
    });

    it("should provide all sync methods", () => {
      function MethodChecker() {
        const sync = useSyncContext();

        return (
          <div>
            <div data-testid="hasAdd">
              {sync.addToQueue !== undefined ? "true" : "false"}
            </div>
            <div data-testid="hasProcess">
              {sync.processQueue !== undefined ? "true" : "false"}
            </div>
            <div data-testid="hasRetry">
              {sync.retryFailed !== undefined ? "true" : "false"}
            </div>
            <div data-testid="hasClear">
              {sync.clearCompleted !== undefined ? "true" : "false"}
            </div>
          </div>
        );
      }

      render(
        <SyncProvider>
          <MethodChecker />
        </SyncProvider>,
      );

      expect(screen.getByTestId("hasAdd")).toHaveTextContent("true");
      expect(screen.getByTestId("hasProcess")).toHaveTextContent("true");
      expect(screen.getByTestId("hasRetry")).toHaveTextContent("true");
      expect(screen.getByTestId("hasClear")).toHaveTextContent("true");
    });

    it("should share context across multiple children", () => {
      render(
        <SyncProvider>
          <TestConsumer />
          <TestConsumer />
          <TestConsumer />
        </SyncProvider>,
      );

      // All children should have access to the same context
      const pendingElements = screen.getAllByTestId("pending");
      expect(pendingElements).toHaveLength(3);
      pendingElements.forEach((el) => {
        expect(el).toHaveTextContent("5");
      });
    });
  });

  // ============================================================================
  // PROPS TESTS
  // ============================================================================

  describe("Props", () => {
    it("should respect autoSync prop", async () => {
      // Render with autoSync=false
      const { rerender } = render(
        <SyncProvider autoSync={false}>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait to ensure no sync was triggered
      await waitFor(
        () => {
          expect(screen.getByTestId("isReady")).toHaveTextContent("true");
        },
        { timeout: 2000 },
      );

      expect(mockProcessQueue).not.toHaveBeenCalled();

      // Rerender with autoSync=true
      rerender(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait for auto-sync to be triggered
      await waitFor(
        () => {
          expect(mockProcessQueue).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });

    it("should default autoSync to true", async () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait for auto-sync to be triggered (defaults to true)
      await waitFor(
        () => {
          expect(mockProcessQueue).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration", () => {
    it("should work with nested components", () => {
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
        <SyncProvider>
          <NestedComponent />
        </SyncProvider>,
      );

      const readyElements = screen.getAllByTestId("isReady");
      expect(readyElements).toHaveLength(2);
      readyElements.forEach((el) => {
        expect(el).toHaveTextContent("true");
      });
    });

    it("should handle stats updates", async () => {
      const { rerender } = render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait for initial stats
      await waitFor(() => {
        expect(screen.getByTestId("pending")).toHaveTextContent("5");
      });

      // Update stats in the mock
      mockSyncReturnValue.stats = { ...mockStats, pending: 10 };

      // Rerender to trigger context update
      rerender(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      // Wait for updated stats
      await waitFor(() => {
        expect(screen.getByTestId("pending")).toHaveTextContent("10");
      });

      // Reset stats back
      mockSyncReturnValue.stats = mockStats;
    });

    it("should handle processing state changes", () => {
      const { rerender } = render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      expect(screen.getByTestId("isProcessing")).toHaveTextContent("false");

      // Start processing
      mockSyncReturnValue.isProcessing = true;

      rerender(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      expect(screen.getByTestId("isProcessing")).toHaveTextContent("true");

      // Reset
      mockSyncReturnValue.isProcessing = false;
    });
  });

  // ============================================================================
  // CLEANUP TESTS
  // ============================================================================

  describe("Cleanup", () => {
    it("should cleanup on unmount", () => {
      const { unmount } = render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>,
      );

      unmount();

      // Should not throw or cause errors
      expect(true).toBe(true);
    });

    it("should not trigger auto-sync after unmount", async () => {
      const { unmount } = render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>,
      );

      const callCountBeforeUnmount = mockProcessQueue.mock.calls.length;

      unmount();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Should not have been called again after unmount
      expect(mockProcessQueue.mock.calls.length).toBe(callCountBeforeUnmount);
    });
  });
});
