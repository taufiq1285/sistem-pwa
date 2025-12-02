/**
 * useNetworkStatus Hook Unit Tests
 *
 * Comprehensive test suite with >90% coverage
 * Tests network status monitoring and reactivity
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNetworkStatus } from '../../../lib/hooks/useNetworkStatus';
import { networkDetector } from '../../../lib/offline/network-detector';
import type { NetworkChangeEvent, NetworkStatus } from '../../../lib/offline/network-detector';

// ============================================================================
// MOCK SETUP
// ============================================================================

vi.mock('../../../lib/offline/network-detector', () => {
  const listeners = new Set<(event: NetworkChangeEvent) => void>();
  let mockStatus: NetworkStatus = 'online';
  let mockReady = false;

  return {
    networkDetector: {
      getStatus: vi.fn(() => mockStatus),
      isReady: vi.fn(() => mockReady),
      initialize: vi.fn(() => {
        mockReady = true;
      }),
      on: vi.fn((callback: (event: NetworkChangeEvent) => void) => {
        listeners.add(callback);
      }),
      off: vi.fn((callback: (event: NetworkChangeEvent) => void) => {
        listeners.delete(callback);
      }),
      // Helper to trigger events for tests
      _triggerEvent: (event: NetworkChangeEvent) => {
        listeners.forEach(listener => listener(event));
      },
      _setStatus: (status: NetworkStatus) => {
        mockStatus = status;
      },
      _reset: () => {
        listeners.clear();
        mockStatus = 'online';
        mockReady = false;
      },
    },
  };
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (networkDetector as any)._reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with online status', () => {
      (networkDetector as any)._setStatus('online');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.status).toBe('online');
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isUnstable).toBe(false);
    });

    it('should initialize with offline status', () => {
      (networkDetector as any)._setStatus('offline');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.status).toBe('offline');
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.isUnstable).toBe(false);
    });

    it('should initialize with unstable status', () => {
      (networkDetector as any)._setStatus('unstable');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.status).toBe('unstable');
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isUnstable).toBe(true);
    });

    it('should initialize network detector if not ready', () => {
      renderHook(() => useNetworkStatus());

      expect(networkDetector.isReady).toHaveBeenCalled();
      expect(networkDetector.initialize).toHaveBeenCalled();
    });

    it('should not re-initialize if already ready', () => {
      (networkDetector.isReady as any).mockReturnValue(true);

      renderHook(() => useNetworkStatus());

      expect(networkDetector.initialize).not.toHaveBeenCalled();
    });

    it('should subscribe to network detector events', () => {
      renderHook(() => useNetworkStatus());

      expect(networkDetector.on).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should mark as ready after initialization', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });
  });

  // ============================================================================
  // STATUS CHANGE TESTS
  // ============================================================================

  describe('Status Changes', () => {
    it('should update status when going offline', async () => {
      (networkDetector as any)._setStatus('online');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.status).toBe('online');

      // Trigger offline event
      (networkDetector as any)._triggerEvent({
        status: 'offline',
        timestamp: Date.now(),
        quality: undefined,
      });

      await waitFor(() => {
        expect(result.current.status).toBe('offline');
        expect(result.current.isOffline).toBe(true);
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('should update status when going online', async () => {
      (networkDetector as any)._setStatus('offline');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.status).toBe('offline');

      // Trigger online event
      (networkDetector as any)._triggerEvent({
        status: 'online',
        timestamp: Date.now(),
        quality: {
          latency: 50,
          downlink: 10,
          effectiveType: '4g',
          saveData: false,
          rtt: 50,
        },
      });

      await waitFor(() => {
        expect(result.current.status).toBe('online');
        expect(result.current.isOnline).toBe(true);
        expect(result.current.isOffline).toBe(false);
      });
    });

    it('should update status when becoming unstable', async () => {
      (networkDetector as any)._setStatus('online');
      const { result } = renderHook(() => useNetworkStatus());

      // Trigger unstable event
      (networkDetector as any)._triggerEvent({
        status: 'unstable',
        timestamp: Date.now(),
        quality: {
          latency: 500,
          downlink: 0.5,
          effectiveType: 'slow-2g',
          saveData: true,
          rtt: 500,
        },
      });

      await waitFor(() => {
        expect(result.current.status).toBe('unstable');
        expect(result.current.isUnstable).toBe(true);
        expect(result.current.isOnline).toBe(false);
        expect(result.current.isOffline).toBe(false);
      });
    });

    it('should update lastChanged timestamp on status change', async () => {
      const { result } = renderHook(() => useNetworkStatus());
      const initialTimestamp = result.current.lastChanged;

      const newTimestamp = Date.now() + 1000;
      (networkDetector as any)._triggerEvent({
        status: 'offline',
        timestamp: newTimestamp,
        quality: undefined,
      });

      await waitFor(() => {
        expect(result.current.lastChanged).toBe(newTimestamp);
        expect(result.current.lastChanged).not.toBe(initialTimestamp);
      });
    });

    it('should update quality metrics on status change', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      const mockQuality = {
        latency: 100,
        downlink: 5,
        effectiveType: '3g',
        saveData: false,
        rtt: 100,
      };

      (networkDetector as any)._triggerEvent({
        status: 'online',
        timestamp: Date.now(),
        quality: mockQuality,
      });

      await waitFor(() => {
        expect(result.current.quality).toEqual(mockQuality);
      });
    });
  });

  // ============================================================================
  // QUALITY METRICS TESTS
  // ============================================================================

  describe('Quality Metrics', () => {
    it('should expose quality metrics when available', async () => {
      const mockQuality = {
        latency: 50,
        downlink: 10,
        effectiveType: '4g',
        saveData: false,
        rtt: 50,
      };

      const { result } = renderHook(() => useNetworkStatus());

      (networkDetector as any)._triggerEvent({
        status: 'online',
        timestamp: Date.now(),
        quality: mockQuality,
      });

      await waitFor(() => {
        expect(result.current.quality).toBeDefined();
        expect(result.current.quality?.latency).toBe(50);
        expect(result.current.quality?.downlink).toBe(10);
        expect(result.current.quality?.effectiveType).toBe('4g');
        expect(result.current.quality?.saveData).toBe(false);
        expect(result.current.quality?.rtt).toBe(50);
      });
    });

    it('should handle undefined quality metrics', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      (networkDetector as any)._triggerEvent({
        status: 'offline',
        timestamp: Date.now(),
        quality: undefined,
      });

      await waitFor(() => {
        expect(result.current.quality).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // CLEANUP TESTS
  // ============================================================================

  describe('Cleanup', () => {
    it('should unsubscribe from network detector on unmount', () => {
      const { unmount } = renderHook(() => useNetworkStatus());

      expect(networkDetector.on).toHaveBeenCalled();

      unmount();

      expect(networkDetector.off).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not update state after unmount', async () => {
      const { result, unmount } = renderHook(() => useNetworkStatus());

      const initialStatus = result.current.status;
      unmount();

      // Try to trigger event after unmount
      (networkDetector as any)._triggerEvent({
        status: 'offline',
        timestamp: Date.now(),
        quality: undefined,
      });

      // Wait a bit to ensure no update happens
      await new Promise(resolve => setTimeout(resolve, 100));

      // Status should not have changed
      expect(result.current.status).toBe(initialStatus);
    });
  });

  // ============================================================================
  // MULTIPLE INSTANCES TESTS
  // ============================================================================

  describe('Multiple Instances', () => {
    it('should allow multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useNetworkStatus());
      const { result: result2 } = renderHook(() => useNetworkStatus());

      expect(result1.current.status).toBe(result2.current.status);
      expect(result1.current.isOnline).toBe(result2.current.isOnline);
    });

    it('should sync status across multiple instances', async () => {
      const { result: result1 } = renderHook(() => useNetworkStatus());
      const { result: result2 } = renderHook(() => useNetworkStatus());

      (networkDetector as any)._triggerEvent({
        status: 'offline',
        timestamp: Date.now(),
        quality: undefined,
      });

      await waitFor(() => {
        expect(result1.current.status).toBe('offline');
        expect(result2.current.status).toBe('offline');
      });
    });
  });

  // ============================================================================
  // DERIVED STATE TESTS
  // ============================================================================

  describe('Derived State', () => {
    it('should correctly derive isOnline from status', () => {
      (networkDetector as any)._setStatus('online');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isUnstable).toBe(false);
    });

    it('should correctly derive isOffline from status', () => {
      (networkDetector as any)._setStatus('offline');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.isUnstable).toBe(false);
    });

    it('should correctly derive isUnstable from status', () => {
      (networkDetector as any)._setStatus('unstable');
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isUnstable).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    it('should handle rapid status changes', async () => {
      const { result } = renderHook(() => useNetworkStatus());

      // Trigger multiple rapid changes
      (networkDetector as any)._triggerEvent({
        status: 'offline',
        timestamp: Date.now(),
        quality: undefined,
      });

      (networkDetector as any)._triggerEvent({
        status: 'unstable',
        timestamp: Date.now() + 100,
        quality: undefined,
      });

      (networkDetector as any)._triggerEvent({
        status: 'online',
        timestamp: Date.now() + 200,
        quality: {
          latency: 50,
          downlink: 10,
          effectiveType: '4g',
          saveData: false,
          rtt: 50,
        },
      });

      await waitFor(() => {
        expect(result.current.status).toBe('online');
      });
    });

    it('should maintain consistent state during lifecycle', () => {
      const { result, rerender } = renderHook(() => useNetworkStatus());

      const status1 = result.current.status;
      rerender();
      const status2 = result.current.status;

      expect(status1).toBe(status2);
    });
  });
});
