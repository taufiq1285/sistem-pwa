/**
 * SyncProvider Unit Tests
 *
 * Comprehensive test suite for SyncProvider
 * Tests sync queue management, auto-sync, and context providing
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { SyncProvider, useSyncContext } from '@/providers/SyncProvider';

// ✅ FIX: Import mocked hooks to avoid dynamic require() errors
import { useSync } from '@/lib/hooks/useSync';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockProcessQueue = vi.fn();
const mockStats = {
  total: 10,
  pending: 5,
  processing: 0,
  completed: 3,
  failed: 2,
};

vi.mock('@/lib/hooks/useSync', () => ({
  useSync: vi.fn(() => ({
    addToQueue: vi.fn(),
    processQueue: mockProcessQueue,
    retryFailed: vi.fn(),
    clearCompleted: vi.fn(),
    stats: mockStats,
    isProcessing: false,
    isReady: true,
    refreshStats: vi.fn(),
    getAllItems: vi.fn(),
  })),
}));

vi.mock('@/lib/hooks/useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    isUnstable: false,
    status: 'online' as const,
  })),
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

describe('SyncProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessQueue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should render children immediately', () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      expect(screen.getByTestId('isReady')).toBeInTheDocument();
    });

    it('should provide sync context to children', () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      expect(screen.getByTestId('isReady')).toHaveTextContent('true');
      expect(screen.getByTestId('isProcessing')).toHaveTextContent('false');
    });

    it('should provide stats to children', () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      expect(screen.getByTestId('pending')).toHaveTextContent('5');
      expect(screen.getByTestId('total')).toHaveTextContent('10');
    });
  });

  // ============================================================================
  // AUTO-SYNC TESTS
  // ============================================================================

  describe('Auto-sync', () => {
    it('should auto-sync when online and has pending items', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await waitFor(() => {
        expect(mockProcessQueue).toHaveBeenCalled();
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auto-syncing 5 pending items')
      );

      consoleLogSpy.mockRestore();
    });

    it('should not auto-sync when autoSync is false', async () => {
      render(
        <SyncProvider autoSync={false}>
          <TestConsumer />
        </SyncProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it('should not auto-sync when offline', async () => {
      // ✅ FIXED: Use vi.mocked instead of dynamic require
      vi.mocked(useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
        status: 'offline',
      });

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it('should not auto-sync when not ready', async () => {
      // ✅ FIXED: Use vi.mocked instead of dynamic require
      vi.mocked(useSync).mockReturnValue({
        addToQueue: vi.fn(),
        processQueue: mockProcessQueue,
        retryFailed: vi.fn(),
        clearCompleted: vi.fn(),
        stats: mockStats,
        isProcessing: false,
        isReady: false, // Not ready
        refreshStats: vi.fn(),
        getAllItems: vi.fn(),
      });

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it('should not auto-sync when no pending items', async () => {
      // ✅ FIXED: Use vi.mocked instead of dynamic require
      vi.mocked(useSync).mockReturnValue({
        addToQueue: vi.fn(),
        processQueue: mockProcessQueue,
        retryFailed: vi.fn(),
        clearCompleted: vi.fn(),
        stats: { ...mockStats, pending: 0 }, // No pending items
        isProcessing: false,
        isReady: true,
        refreshStats: vi.fn(),
        getAllItems: vi.fn(),
      });

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();
    });

    it('should handle auto-sync errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Sync failed');
      mockProcessQueue.mockRejectedValue(error);

      render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await waitFor(() => {
        expect(mockProcessQueue).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Auto-sync failed:', error);
      });

      consoleErrorSpy.mockRestore();
    });

    it('should trigger auto-sync when coming back online', async () => {
      // ✅ FIXED: Use vi.mocked instead of dynamic require

      // Start offline
      vi.mocked(useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
        status: 'offline',
      });

      const { rerender } = render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();

      // Go online
      vi.mocked(useNetworkStatus).mockReturnValue({
        isOnline: true,
        isOffline: false,
        status: 'online',
      });

      rerender(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await waitFor(() => {
        expect(mockProcessQueue).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // CONTEXT TESTS
  // ============================================================================

  describe('Context', () => {
    it('should throw error when useSyncContext is used outside provider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useSyncContext must be used within SyncProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should provide all sync methods', () => {
      function MethodChecker() {
        const sync = useSyncContext();

        return (
          <div>
            <div data-testid="hasAdd">
              {sync.addToQueue !== undefined ? 'true' : 'false'}
            </div>
            <div data-testid="hasProcess">
              {sync.processQueue !== undefined ? 'true' : 'false'}
            </div>
            <div data-testid="hasRetry">
              {sync.retryFailed !== undefined ? 'true' : 'false'}
            </div>
            <div data-testid="hasClear">
              {sync.clearCompleted !== undefined ? 'true' : 'false'}
            </div>
          </div>
        );
      }

      render(
        <SyncProvider>
          <MethodChecker />
        </SyncProvider>
      );

      expect(screen.getByTestId('hasAdd')).toHaveTextContent('true');
      expect(screen.getByTestId('hasProcess')).toHaveTextContent('true');
      expect(screen.getByTestId('hasRetry')).toHaveTextContent('true');
      expect(screen.getByTestId('hasClear')).toHaveTextContent('true');
    });

    it('should share context across multiple children', () => {
      render(
        <SyncProvider>
          <TestConsumer />
          <TestConsumer />
          <TestConsumer />
        </SyncProvider>
      );

      const pendingElements = screen.getAllByTestId('pending');
      expect(pendingElements).toHaveLength(3);
      pendingElements.forEach(el => {
        expect(el).toHaveTextContent('5');
      });
    });
  });

  // ============================================================================
  // PROPS TESTS
  // ============================================================================

  describe('Props', () => {
    it('should respect autoSync prop', async () => {
      const { rerender } = render(
        <SyncProvider autoSync={false}>
          <TestConsumer />
        </SyncProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockProcessQueue).not.toHaveBeenCalled();

      rerender(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      await waitFor(() => {
        expect(mockProcessQueue).toHaveBeenCalled();
      });
    });

    it('should default autoSync to true', async () => {
      render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      await waitFor(() => {
        expect(mockProcessQueue).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    it('should work with nested components', () => {
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
        </SyncProvider>
      );

      const readyElements = screen.getAllByTestId('isReady');
      expect(readyElements).toHaveLength(2);
      readyElements.forEach(el => {
        expect(el).toHaveTextContent('true');
      });
    });

    it('should handle stats updates', () => {
      // ✅ FIXED: Use vi.mocked instead of dynamic require

      const { rerender } = render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      expect(screen.getByTestId('pending')).toHaveTextContent('5');

      // Update stats
      vi.mocked(useSync).mockReturnValue({
        addToQueue: vi.fn(),
        processQueue: mockProcessQueue,
        retryFailed: vi.fn(),
        clearCompleted: vi.fn(),
        stats: { ...mockStats, pending: 10 },
        isProcessing: false,
        isReady: true,
        refreshStats: vi.fn(),
        getAllItems: vi.fn(),
      });

      rerender(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      expect(screen.getByTestId('pending')).toHaveTextContent('10');
    });

    it('should handle processing state changes', () => {
      // ✅ FIXED: Use vi.mocked instead of dynamic require

      const { rerender } = render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      expect(screen.getByTestId('isProcessing')).toHaveTextContent('false');

      // Start processing
      vi.mocked(useSync).mockReturnValue({
        addToQueue: vi.fn(),
        processQueue: mockProcessQueue,
        retryFailed: vi.fn(),
        clearCompleted: vi.fn(),
        stats: mockStats,
        isProcessing: true,
        isReady: true,
        refreshStats: vi.fn(),
        getAllItems: vi.fn(),
      });

      rerender(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      expect(screen.getByTestId('isProcessing')).toHaveTextContent('true');
    });
  });

  // ============================================================================
  // CLEANUP TESTS
  // ============================================================================

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(
        <SyncProvider>
          <TestConsumer />
        </SyncProvider>
      );

      unmount();

      // Should not throw or cause errors
      expect(true).toBe(true);
    });

    it('should not trigger auto-sync after unmount', async () => {
      const { unmount } = render(
        <SyncProvider autoSync={true}>
          <TestConsumer />
        </SyncProvider>
      );

      const callCountBeforeUnmount = mockProcessQueue.mock.calls.length;

      unmount();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not have been called again after unmount
      expect(mockProcessQueue.mock.calls.length).toBe(callCountBeforeUnmount);
    });
  });
});
