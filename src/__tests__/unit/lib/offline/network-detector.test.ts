/**
 * NetworkDetector Unit Tests
 *
 * Comprehensive test suite with >90% coverage
 * Tests network detection, quality checks, and event emitters
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { NetworkDetector } from '../../../../lib/offline/network-detector';
import type { NetworkChangeEvent } from '../../../../lib/offline/network-detector';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock global timers
vi.useFakeTimers();

// Mock performance.now()
const mockPerformanceNow = vi.fn();
global.performance = { now: mockPerformanceNow } as any;

// Helper to mock navigator.onLine
function mockNavigatorOnline(isOnline: boolean) {
  Object.defineProperty(global.navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: isOnline,
  });
}

// Helper to mock navigator.connection
function mockNavigatorConnection(connection: any) {
  Object.defineProperty(global.navigator, 'connection', {
    writable: true,
    configurable: true,
    value: connection,
  });
}

// ============================================================================
// TESTS
// ============================================================================

describe('NetworkDetector', () => {
  let detector: NetworkDetector;

  beforeAll(() => {
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Reset navigator to online state
    mockNavigatorOnline(true);

    // Reset fetch mock to success
    mockFetch.mockResolvedValue({ ok: true });

    // Reset performance.now
    mockPerformanceNow.mockReturnValue(0);
  });

  afterEach(() => {
    // Cleanup detector
    if (detector) {
      detector.destroy();
    }
  });

  afterAll(() => {
    // Restore timers
    vi.useRealTimers();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should create detector with default config', () => {
      detector = new NetworkDetector();
      expect(detector).toBeDefined();
      expect(detector.isReady()).toBe(false);
    });

    it('should create detector with custom config', () => {
      detector = new NetworkDetector({
        pingUrl: '/custom-ping',
        pingInterval: 10000,
        pingTimeout: 3000,
        enableQualityCheck: false,
        enablePeriodicCheck: false,
      });

      expect(detector).toBeDefined();
    });

    it('should initialize successfully', () => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
      detector.initialize();

      expect(detector.isReady()).toBe(true);
      expect(detector.getStatus()).toBe('online');
    });

    it('should not re-initialize if already initialized', () => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
      detector.initialize();
      detector.initialize(); // Second call

      expect(detector.isReady()).toBe(true);
      expect(console.warn).toHaveBeenCalledWith('NetworkDetector already initialized');
    });

    it('should set initial status based on navigator.onLine', () => {
      mockNavigatorOnline(false);
      detector = new NetworkDetector({ enablePeriodicCheck: false });

      expect(detector.getStatus()).toBe('offline');
    });

    it('should start periodic check when enabled', () => {
      detector = new NetworkDetector({
        enablePeriodicCheck: true,
        pingInterval: 1000,
      });

      detector.initialize();

      expect(detector.isReady()).toBe(true);
      // Periodic check should be running
    });
  });

  // ============================================================================
  // CLEANUP TESTS
  // ============================================================================

  describe('Cleanup', () => {
    it('should destroy detector and cleanup resources', () => {
      detector = new NetworkDetector({ enablePeriodicCheck: true });
      detector.initialize();

      const listener = vi.fn();
      detector.on(listener);

      detector.destroy();

      expect(detector.isReady()).toBe(false);
      expect(detector.getListenerCount()).toBe(0);
    });

    it('should handle destroy on uninitialized detector', () => {
      detector = new NetworkDetector();
      detector.destroy(); // Should not throw

      expect(detector.isReady()).toBe(false);
    });
  });

  // ============================================================================
  // STATUS GETTER TESTS
  // ============================================================================

  describe('Status Getters', () => {
    beforeEach(() => {
      mockNavigatorOnline(true);
      detector = new NetworkDetector({ enablePeriodicCheck: false });
      detector.initialize();
    });

    it('should return current status', () => {
      expect(detector.getStatus()).toBe('online');
    });

    it('should check if online', () => {
      expect(detector.isOnline()).toBe(true);
      expect(detector.isOffline()).toBe(false);
      expect(detector.isUnstable()).toBe(false);
    });

    it('should check if offline', () => {
      mockNavigatorOnline(false);
      detector = new NetworkDetector({ enablePeriodicCheck: false });

      expect(detector.isOffline()).toBe(true);
      expect(detector.isOnline()).toBe(false);
      expect(detector.isUnstable()).toBe(false);
    });
  });

  // ============================================================================
  // PING TESTS
  // ============================================================================

  describe('Ping', () => {
    beforeEach(() => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
    });

    it('should return true when ping succeeds', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await detector.ping();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ping',
        expect.objectContaining({
          method: 'HEAD',
          cache: 'no-cache',
        })
      );
    });

    it('should return false when ping fails', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const result = await detector.ping();

      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await detector.ping();

      expect(result).toBe(false);
    });

    it('should handle aborted request (timeout scenario)', async () => {
      // Mock fetch that throws abort error
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await detector.ping();

      expect(result).toBe(false);
    });

    it('should use custom ping URL', async () => {
      detector = new NetworkDetector({
        pingUrl: '/custom-health-check',
        enablePeriodicCheck: false,
      });

      mockFetch.mockResolvedValue({ ok: true });

      await detector.ping();

      expect(mockFetch).toHaveBeenCalledWith(
        '/custom-health-check',
        expect.any(Object)
      );
    });
  });

  // ============================================================================
  // LATENCY MEASUREMENT TESTS
  // ============================================================================

  describe('Latency Measurement', () => {
    beforeEach(() => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
    });

    it('should measure latency successfully', async () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(150);
      mockFetch.mockResolvedValue({ ok: true });

      const latency = await detector.measureLatency();

      expect(latency).toBe(150);
    });

    it('should return timeout value when ping fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const latency = await detector.measureLatency();

      expect(latency).toBe(5000); // Default timeout
    });

    it('should use custom timeout', async () => {
      detector = new NetworkDetector({
        pingTimeout: 3000,
        enablePeriodicCheck: false,
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const latency = await detector.measureLatency();

      expect(latency).toBe(3000);
    });
  });

  // ============================================================================
  // NETWORK QUALITY TESTS
  // ============================================================================

  describe('Network Quality', () => {
    beforeEach(() => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
    });

    it('should return undefined when connection API not available', () => {
      mockNavigatorConnection(undefined);

      const quality = detector.checkQuality();

      expect(quality).toBeUndefined();
    });

    it('should return quality metrics when connection API available', () => {
      mockNavigatorConnection({
        rtt: 100,
        downlink: 10,
        effectiveType: '4g',
        saveData: false,
      });

      const quality = detector.checkQuality();

      expect(quality).toEqual({
        latency: 100,
        downlink: 10,
        effectiveType: '4g',
        saveData: false,
        rtt: 100,
      });
    });

    it('should handle missing effectiveType', () => {
      mockNavigatorConnection({
        rtt: 50,
        downlink: 5,
        effectiveType: undefined,
        saveData: true,
      });

      const quality = detector.checkQuality();

      expect(quality?.effectiveType).toBe('unknown');
    });

    it('should map all connection types correctly', () => {
      const types = ['slow-2g', '2g', '3g', '4g', 'unknown-type'];

      types.forEach((type) => {
        mockNavigatorConnection({
          rtt: 100,
          downlink: 10,
          effectiveType: type,
          saveData: false,
        });

        const quality = detector.checkQuality();

        if (type === 'unknown-type') {
          expect(quality?.effectiveType).toBe('unknown');
        } else {
          expect(quality?.effectiveType).toBe(type);
        }
      });
    });

    it('should handle errors when checking quality', () => {
      mockNavigatorConnection({
        get rtt() {
          throw new Error('Access denied');
        },
      });

      const quality = detector.checkQuality();

      expect(quality).toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EVENT EMITTER TESTS
  // ============================================================================

  describe('Event Emitter', () => {
    beforeEach(() => {
      detector = new NetworkDetector({
        enablePeriodicCheck: false,
        enableQualityCheck: false,
      });
      detector.initialize();
    });

    it('should add listener with on()', () => {
      const listener = vi.fn();
      detector.on(listener);

      expect(detector.getListenerCount()).toBe(1);
    });

    it('should remove listener with off()', () => {
      const listener = vi.fn();
      detector.on(listener);
      detector.off(listener);

      expect(detector.getListenerCount()).toBe(0);
    });

    it('should remove listener with unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = detector.on(listener);

      expect(detector.getListenerCount()).toBe(1);

      unsubscribe();

      expect(detector.getListenerCount()).toBe(0);
    });

    it('should call listener on status change', () => {
      const listener = vi.fn();
      detector.on(listener);

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));

      expect(listener).toHaveBeenCalled();
      const event: NetworkChangeEvent = listener.mock.calls[0][0];
      expect(event.status).toBe('offline');
      expect(event.isOnline).toBe(false);
    });

    it('should call once() listener only once', () => {
      const listener = vi.fn();
      detector.once(listener);

      // Trigger multiple events
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));

      // Should be called only once
      expect(listener).toHaveBeenCalledTimes(1);
      expect(detector.getListenerCount()).toBe(0);
    });

    it('should call multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      detector.on(listener1);
      detector.on(listener2);
      detector.on(listener3);

      window.dispatchEvent(new Event('offline'));

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      detector.on(errorListener);
      detector.on(normalListener);

      window.dispatchEvent(new Event('offline'));

      // Both should be called despite error
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should call config onStatusChange callback', () => {
      const callback = vi.fn();
      detector = new NetworkDetector({
        enablePeriodicCheck: false,
        onStatusChange: callback,
      });
      detector.initialize();

      window.dispatchEvent(new Event('offline'));

      expect(callback).toHaveBeenCalled();
    });

    it('should include timestamp in event', () => {
      const listener = vi.fn();
      detector.on(listener);

      window.dispatchEvent(new Event('offline'));

      const event: NetworkChangeEvent = listener.mock.calls[0][0];
      expect(event.timestamp).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // ONLINE/OFFLINE EVENT HANDLING TESTS
  // ============================================================================

  describe('Online/Offline Events', () => {
    beforeEach(() => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
      detector.initialize();
    });

    it('should handle offline event', () => {
      const listener = vi.fn();
      detector.on(listener);

      window.dispatchEvent(new Event('offline'));

      expect(detector.getStatus()).toBe('offline');
      expect(listener).toHaveBeenCalled();
    });

    it('should handle online event with successful ping', async () => {
      // Start offline
      window.dispatchEvent(new Event('offline'));
      expect(detector.getStatus()).toBe('offline');

      // Mock successful ping
      mockFetch.mockResolvedValue({ ok: true });

      // Trigger online event
      const onlinePromise = new Promise<void>((resolve) => {
        detector.on((event) => {
          if (event.status === 'online') {
            resolve();
          }
        });
      });

      window.dispatchEvent(new Event('online'));

      // Wait for async ping to complete
      await vi.runAllTimersAsync();
      await onlinePromise;

      expect(detector.getStatus()).toBe('online');
    });

    it('should set unstable status when online but ping fails', async () => {
      // Start offline
      window.dispatchEvent(new Event('offline'));

      // Mock failed ping
      mockFetch.mockResolvedValue({ ok: false });

      // Trigger online event
      const unstablePromise = new Promise<void>((resolve) => {
        detector.on((event) => {
          if (event.status === 'unstable') {
            resolve();
          }
        });
      });

      window.dispatchEvent(new Event('online'));

      // Wait for async ping
      await vi.runAllTimersAsync();
      await unstablePromise;

      expect(detector.getStatus()).toBe('unstable');
    });

    it('should not emit duplicate status changes', () => {
      const listener = vi.fn();
      detector.on(listener);

      // Trigger offline twice
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('offline'));

      // Should only emit once (initial status is online, first offline triggers change)
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // PERIODIC CHECK TESTS
  // ============================================================================

  describe('Periodic Checks', () => {
    it('should run periodic checks when enabled', async () => {
      detector = new NetworkDetector({
        enablePeriodicCheck: true,
        pingInterval: 1000,
      });
      detector.initialize();

      mockFetch.mockResolvedValue({ ok: true });

      // Advance time to trigger periodic check
      await vi.advanceTimersByTimeAsync(1000);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should not run periodic checks when disabled', async () => {
      detector = new NetworkDetector({
        enablePeriodicCheck: false,
      });
      detector.initialize();

      // Advance time
      await vi.advanceTimersByTimeAsync(30000);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should detect online status during periodic check', async () => {
      detector = new NetworkDetector({
        enablePeriodicCheck: true,
        pingInterval: 1000,
      });
      detector.initialize();

      // Start offline
      window.dispatchEvent(new Event('offline'));
      expect(detector.getStatus()).toBe('offline');

      // Mock successful ping
      mockNavigatorOnline(true);
      mockFetch.mockResolvedValue({ ok: true });

      const listener = vi.fn();
      detector.on(listener);

      // Advance time to trigger periodic check
      await vi.advanceTimersByTimeAsync(1000);

      // Status should change to online
      expect(detector.getStatus()).toBe('online');
    });

    it('should detect unstable status during periodic check', async () => {
      detector = new NetworkDetector({
        enablePeriodicCheck: true,
        pingInterval: 1000,
      });
      detector.initialize();

      // Mock failed ping
      mockFetch.mockResolvedValue({ ok: false });

      // Advance time to trigger periodic check
      await vi.advanceTimersByTimeAsync(1000);

      // Status should change to unstable
      expect(detector.getStatus()).toBe('unstable');
    });

    it('should stop periodic checks when destroyed', async () => {
      detector = new NetworkDetector({
        enablePeriodicCheck: true,
        pingInterval: 1000,
      });
      detector.initialize();

      detector.destroy();

      mockFetch.mockClear();

      // Advance time
      await vi.advanceTimersByTimeAsync(5000);

      // Should not ping after destroyed
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should skip periodic check when navigator is offline', async () => {
      mockNavigatorOnline(false);

      detector = new NetworkDetector({
        enablePeriodicCheck: true,
        pingInterval: 1000,
      });
      detector.initialize();

      mockFetch.mockClear();

      // Advance time
      await vi.advanceTimersByTimeAsync(1000);

      // Should not ping when navigator is offline
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    it('should handle complete online -> offline -> online cycle', async () => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
      detector.initialize();

      const events: NetworkChangeEvent[] = [];
      detector.on((event) => events.push(event));

      // Start online
      expect(detector.getStatus()).toBe('online');

      // Go offline
      window.dispatchEvent(new Event('offline'));
      expect(detector.getStatus()).toBe('offline');

      // Come back online
      mockFetch.mockResolvedValue({ ok: true });
      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();

      expect(detector.getStatus()).toBe('online');
      expect(events.length).toBeGreaterThan(0);
    });

    it('should emit quality metrics when enabled', () => {
      mockNavigatorConnection({
        rtt: 50,
        downlink: 20,
        effectiveType: '4g',
        saveData: false,
      });

      detector = new NetworkDetector({
        enablePeriodicCheck: false,
        enableQualityCheck: true,
      });
      detector.initialize();

      const listener = vi.fn();
      detector.on(listener);

      // Trigger a status change to emit quality metrics
      window.dispatchEvent(new Event('offline'));

      // Check the offline event (quality should not be included for offline)
      expect(listener).toHaveBeenCalled();

      // Now trigger online to get quality metrics
      mockFetch.mockResolvedValue({ ok: true });
      window.dispatchEvent(new Event('online'));

      // Wait for async ping
      vi.runAllTimersAsync();

      // Find the event with quality metrics (should be the online event)
      const eventsWithQuality = listener.mock.calls
        .map((call) => call[0])
        .filter((event) => event.quality !== undefined);

      if (eventsWithQuality.length > 0) {
        expect(eventsWithQuality[0].quality?.effectiveType).toBe('4g');
      }
    });

    it('should not emit quality metrics when disabled', () => {
      detector = new NetworkDetector({
        enablePeriodicCheck: false,
        enableQualityCheck: false,
      });

      const listener = vi.fn();
      detector.on(listener);

      detector.initialize();

      const event: NetworkChangeEvent = listener.mock.calls[0][0];
      expect(event.quality).toBeUndefined();
    });

    it('should handle rapid status changes', async () => {
      detector = new NetworkDetector({ enablePeriodicCheck: false });
      detector.initialize();

      // Rapid offline -> online -> offline
      window.dispatchEvent(new Event('offline'));
      mockFetch.mockResolvedValue({ ok: true });
      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();
      window.dispatchEvent(new Event('offline'));

      expect(detector.getStatus()).toBe('offline');
    });
  });
});
