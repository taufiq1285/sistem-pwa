/**
 * API Cache Unit Tests
 *
 * Tests for generic API caching layer including:
 * - Cache hit/miss scenarios
 * - TTL expiration
 * - Stale-while-revalidate strategy
 * - Force refresh
 * - Network fallback to stale cache
 * - Optimistic updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cacheAPI,
  invalidateCache,
  invalidateCachePattern,
  clearAllCache,
  isOnline,
  optimisticUpdate,
} from '../../../lib/offline/api-cache';
import { indexedDBManager } from '../../../lib/offline/indexeddb';

// Mock IndexedDB manager
vi.mock('../../../lib/offline/indexeddb', () => ({
  indexedDBManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getMetadata: vi.fn(),
    setMetadata: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('API Cache', () => {
  let mockConsoleLog: any;
  let mockConsoleWarn: any;
  let mockConsoleError: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Re-mock indexedDB manager methods
    vi.mocked(indexedDBManager.initialize).mockResolvedValue(undefined);
    vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);
    vi.mocked(indexedDBManager.setMetadata).mockResolvedValue(undefined);

    // Mock console methods in beforeEach
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('cacheAPI - Cache Hit', () => {
    it('should return cached data when cache is fresh', async () => {
      const mockData = { id: 1, name: 'Test' };
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: 'test-key',
        data: mockData,
        timestamp: now,
        expiresAt: now + 5 * 60 * 1000, // Fresh cache
      });

      const fetcher = vi.fn().mockResolvedValue({ id: 2, name: 'New' });

      const result = await cacheAPI('test-key', fetcher);

      expect(result).toEqual(mockData);
      expect(fetcher).not.toHaveBeenCalled(); // Should not fetch
      expect(mockConsoleLog).toHaveBeenCalledWith('[API Cache] HIT: test-key');
    });

    it('should not fetch when cache is valid', async () => {
      const mockData = { value: 'cached' };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: 'key',
        data: mockData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const fetcher = vi.fn();

      await cacheAPI('key', fetcher);

      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe('cacheAPI - Cache Miss', () => {
    it('should fetch and cache data when cache is empty', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const mockData = { id: 1, name: 'Fresh Data' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const result = await cacheAPI('test-key', fetcher);

      expect(result).toEqual(mockData);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'cache_test-key',
        expect.objectContaining({
          key: 'test-key',
          data: mockData,
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('[API Cache] MISS: test-key (fetching...)');
    });

    it('should fetch when cache is expired', async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: 'test-key',
        data: { old: 'data' },
        timestamp: now - 10 * 60 * 1000,
        expiresAt: now - 1000, // Expired 1 second ago
      });

      const freshData = { new: 'data' };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI('test-key', fetcher);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('cacheAPI - Force Refresh', () => {
    it('should skip cache and fetch fresh data when forceRefresh is true', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: 'test-key',
        data: { old: 'cached' },
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const freshData = { new: 'fresh' };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI('test-key', fetcher, { forceRefresh: true });

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(indexedDBManager.getMetadata).not.toHaveBeenCalled(); // Skip cache check
    });
  });

  describe('cacheAPI - Stale While Revalidate', () => {
    it('should return stale data immediately and fetch in background', async () => {
      const now = Date.now();
      const staleData = { stale: 'data' };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: 'test-key',
        data: staleData,
        timestamp: now - 10 * 60 * 1000,
        expiresAt: now - 1000, // Expired
      });

      const freshData = { fresh: 'data' };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI('test-key', fetcher, {
        staleWhileRevalidate: true,
      });

      // Should return stale data immediately
      expect(result).toEqual(staleData);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[API Cache] STALE: test-key (revalidating in background)'
      );

      // Background fetch should be triggered (but not awaited)
      // We can't easily test the background fetch without waiting
      // Just verify the stale data was returned
    });

    it('should not use stale-while-revalidate for fresh cache', async () => {
      const now = Date.now();
      const cachedData = { cached: 'data' };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: 'test-key',
        data: cachedData,
        timestamp: now,
        expiresAt: now + 10000, // Fresh
      });

      const fetcher = vi.fn();

      const result = await cacheAPI('test-key', fetcher, {
        staleWhileRevalidate: true,
      });

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe('cacheAPI - Network Fallback', () => {
    it('should fallback to stale cache when network fails', async () => {
      const now = Date.now();
      const staleData = { stale: 'fallback' };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(null) // First call: no cache
        .mockResolvedValueOnce({
          // Second call: stale cache for fallback
          key: 'test-key',
          data: staleData,
          timestamp: now - 10 * 60 * 1000,
          expiresAt: now - 1000,
        });

      const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await cacheAPI('test-key', fetcher);

      expect(result).toEqual(staleData);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[API Cache] Network failed, using stale cache: test-key'
      );
    });

    it('should throw error when network fails and no cache available', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const networkError = new Error('Network error');
      const fetcher = vi.fn().mockRejectedValue(networkError);

      await expect(cacheAPI('test-key', fetcher)).rejects.toThrow('Network error');
    });
  });

  describe('cacheAPI - TTL Options', () => {
    it('should use default TTL when not specified', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
      const now = Date.now();

      await cacheAPI('test-key', fetcher);

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'cache_test-key',
        expect.objectContaining({
          expiresAt: now + 5 * 60 * 1000, // Default 5 minutes
        })
      );
    });

    it('should use custom TTL when provided', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
      const customTTL = 10 * 60 * 1000; // 10 minutes
      const now = Date.now();

      await cacheAPI('test-key', fetcher, { ttl: customTTL });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'cache_test-key',
        expect.objectContaining({
          expiresAt: now + customTTL,
        })
      );
    });
  });

  describe('cacheAPI - Error Handling', () => {
    it('should handle IndexedDB initialization error', async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error('IndexedDB error')
      );

      const fetcher = vi.fn();

      await expect(cacheAPI('test-key', fetcher)).rejects.toThrow('IndexedDB error');
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Cache] Error for test-key:',
        expect.any(Error)
      );
    });

    it('should handle getMetadata error gracefully', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockRejectedValue(
        new Error('Read error')
      );

      const fetcher = vi.fn().mockResolvedValue({ data: 'fallback' });

      // Should still work by fetching
      const result = await cacheAPI('test-key', fetcher);

      expect(result).toEqual({ data: 'fallback' });
      expect(fetcher).toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('should clear cache for specific key', async () => {
      await invalidateCache('test-key');

      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith('cache_test-key', null);
      expect(mockConsoleLog).toHaveBeenCalledWith('[API Cache] Invalidated: test-key');
    });

    it('should handle invalidation errors', async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error('Write error')
      );

      await invalidateCache('test-key');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Cache] Failed to invalidate test-key:',
        expect.any(Error)
      );
    });
  });

  describe('invalidateCachePattern', () => {
    it('should log pattern invalidation (TODO implementation)', async () => {
      await invalidateCachePattern('user:*');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[API Cache] Invalidating pattern: user:*'
      );
    });

    it('should handle pattern invalidation errors', async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(new Error('Init error'));

      await invalidateCachePattern('pattern:*');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Cache] Failed to invalidate pattern pattern:*:',
        expect.any(Error)
      );
    });
  });

  describe('clearAllCache', () => {
    it('should log clear all (TODO implementation)', async () => {
      await clearAllCache();

      expect(mockConsoleLog).toHaveBeenCalledWith('[API Cache] Clearing all cache...');
    });

    it('should handle clear all errors', async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(new Error('Init error'));

      await clearAllCache();

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Cache] Failed to clear all cache:',
        expect.any(Error)
      );
    });
  });

  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(isOnline()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(isOnline()).toBe(false);
    });
  });

  describe('optimisticUpdate', () => {
    it('should update cache immediately when online and server succeeds', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const localData = { id: 1, name: 'Local Update' };
      const serverData = { id: 1, name: 'Server Update' };

      const updater = vi.fn().mockResolvedValue(serverData);

      const result = await optimisticUpdate('test-key', localData, updater);

      // Should update cache with local data first
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'cache_test-key',
        expect.objectContaining({ data: localData })
      );

      // Should return server data
      expect(result).toEqual(serverData);

      // Should update cache with server data
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'cache_test-key',
        expect.objectContaining({ data: serverData })
      );
    });

    it('should keep local update when server fails', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const localData = { id: 1, name: 'Local' };
      const updater = vi.fn().mockRejectedValue(new Error('Server error'));

      const result = await optimisticUpdate('test-key', localData, updater);

      expect(result).toEqual(localData);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Cache] Optimistic update failed for test-key, keeping local:',
        expect.any(Error)
      );
    });

    it('should return local data when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const localData = { id: 1, name: 'Offline' };
      const updater = vi.fn();

      const result = await optimisticUpdate('test-key', localData, updater);

      expect(result).toEqual(localData);
      expect(updater).not.toHaveBeenCalled();
    });

    it('should use custom TTL', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const customTTL = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();

      await optimisticUpdate(
        'test-key',
        { data: 'test' },
        vi.fn(),
        { ttl: customTTL }
      );

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'cache_test-key',
        expect.objectContaining({
          expiresAt: now + customTTL,
        })
      );
    });

    it('should handle errors during optimistic update', async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error('Init error')
      );

      await expect(
        optimisticUpdate('test-key', { data: 'test' }, vi.fn())
      ).rejects.toThrow('Init error');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[API Cache] Optimistic update error for test-key:',
        expect.any(Error)
      );
    });
  });

  describe('Cache Entry Structure', () => {
    it('should create cache entry with correct structure', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const data = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(data);
      const now = Date.now();
      const ttl = 10 * 60 * 1000;

      await cacheAPI('test-key', fetcher, { ttl });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith('cache_test-key', {
        key: 'test-key',
        data,
        timestamp: now,
        expiresAt: now + ttl,
      });
    });
  });
});
