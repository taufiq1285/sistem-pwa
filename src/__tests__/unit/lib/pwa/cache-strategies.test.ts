/**
 * Cache Strategies Tests
 *
 * Tests for cache strategy implementations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  networkOnly,
  cacheOnly,
  getStrategyHandler,
  applyCacheRule,
  cleanupCache,
  cleanupExpiredCache,
  precacheUrls,
  clearAllCaches,
  getCacheStats,
} from '../../../../lib/pwa/cache-strategies';
import type { StrategyOptions } from '../../../../lib/pwa/cache-strategies';
import type { CacheRule } from '../../../../config/cache.config';

// ============================================================================
// MOCKS
// ============================================================================

// Mock global fetch
global.fetch = vi.fn();

// Mock caches API
const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn(),
};

global.caches = {
  open: vi.fn(() => Promise.resolve(mockCache)),
  keys: vi.fn(),
  delete: vi.fn(),
  match: vi.fn(),
  has: vi.fn(),
} as any;

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Cache Strategies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console spies
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // CACHE FIRST STRATEGY
  // ============================================================================

  describe('cacheFirst', () => {
    const options: StrategyOptions = {
      cacheName: 'test-cache',
      maxAge: 60000, // 1 minute
    };

    it('should return cached response if available and valid', async () => {
      const request = new Request('https://example.com/image.jpg');
      const cachedResponse = new Response('cached', {
        headers: { date: new Date().toUTCString() },
      });

      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await cacheFirst(request, options);

      expect(response).toBe(cachedResponse);
      expect(mockCache.match).toHaveBeenCalledWith(request, undefined);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch from network on cache miss', async () => {
      const request = new Request('https://example.com/image.jpg');
      const networkResponse = new Response('network', { status: 200 });

      mockCache.match.mockResolvedValue(undefined);
      (global.fetch as any).mockResolvedValue(networkResponse);

      const response = await cacheFirst(request, options);

      expect(response).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalledWith(request);
      expect(mockCache.put).toHaveBeenCalled();
    });

    it('should fetch from network if cache expired', async () => {
      const request = new Request('https://example.com/image.jpg');
      const oldDate = new Date(Date.now() - 120000); // 2 minutes ago
      const expiredResponse = new Response('expired', {
        headers: { date: oldDate.toUTCString() },
      });
      const networkResponse = new Response('fresh', { status: 200 });

      mockCache.match.mockResolvedValue(expiredResponse);
      (global.fetch as any).mockResolvedValue(networkResponse);

      const response = await cacheFirst(request, options);

      expect(response).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalledWith(request);
    });

    it('should return stale cache on network error', async () => {
      const request = new Request('https://example.com/image.jpg');
      const staleResponse = new Response('stale', {
        headers: { date: new Date(Date.now() - 120000).toUTCString() },
      });

      mockCache.match.mockResolvedValueOnce(staleResponse).mockResolvedValueOnce(staleResponse);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const response = await cacheFirst(request, options);

      expect(response).toBe(staleResponse);
    });

    it('should not cache non-200 responses', async () => {
      const request = new Request('https://example.com/image.jpg');
      const networkResponse = new Response('error', { status: 404 });

      mockCache.match.mockResolvedValue(undefined);
      (global.fetch as any).mockResolvedValue(networkResponse);

      await cacheFirst(request, options);

      expect(mockCache.put).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // NETWORK FIRST STRATEGY
  // ============================================================================

  describe('networkFirst', () => {
    const options: StrategyOptions = {
      cacheName: 'test-cache',
      networkTimeout: 3000,
    };

    it('should return network response on success', async () => {
      const request = new Request('https://example.com/api/data');
      const networkResponse = new Response('network', { status: 200 });

      (global.fetch as any).mockResolvedValue(networkResponse);

      const response = await networkFirst(request, options);

      expect(response).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        request,
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(mockCache.put).toHaveBeenCalled();
    });

    it('should fallback to cache on network failure', async () => {
      const request = new Request('https://example.com/api/data');
      const cachedResponse = new Response('cached');

      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await networkFirst(request, options);

      expect(response).toBe(cachedResponse);
      expect(mockCache.match).toHaveBeenCalledWith(request, undefined);
    });

    it('should throw error if both network and cache fail', async () => {
      const request = new Request('https://example.com/api/data');

      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      mockCache.match.mockResolvedValue(undefined);

      await expect(networkFirst(request, options)).rejects.toThrow();
    });

    it('should cache successful network responses', async () => {
      const request = new Request('https://example.com/api/data');
      const networkResponse = new Response('network', { status: 200 });

      (global.fetch as any).mockResolvedValue(networkResponse);

      await networkFirst(request, options);

      expect(mockCache.put).toHaveBeenCalledWith(request, expect.any(Response));
    });

    it('should not cache non-200 responses', async () => {
      const request = new Request('https://example.com/api/data');
      const networkResponse = new Response('error', { status: 500 });

      (global.fetch as any).mockResolvedValue(networkResponse);

      await networkFirst(request, options);

      expect(mockCache.put).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // STALE WHILE REVALIDATE STRATEGY
  // ============================================================================

  describe('staleWhileRevalidate', () => {
    const options: StrategyOptions = {
      cacheName: 'test-cache',
    };

    it('should return cached response immediately', async () => {
      const request = new Request('https://example.com/page.html');
      const cachedResponse = new Response('cached');
      const networkResponse = new Response('fresh', { status: 200 });

      mockCache.match.mockResolvedValue(cachedResponse);
      (global.fetch as any).mockResolvedValue(networkResponse);

      const response = await staleWhileRevalidate(request, options);

      expect(response).toBe(cachedResponse);
      // Network update happens in background
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(global.fetch).toHaveBeenCalledWith(request);
    });

    it('should wait for network if no cache available', async () => {
      const request = new Request('https://example.com/page.html');
      const networkResponse = new Response('network', { status: 200 });

      mockCache.match.mockResolvedValue(undefined);
      (global.fetch as any).mockResolvedValue(networkResponse);

      const response = await staleWhileRevalidate(request, options);

      expect(response).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalledWith(request);
    });

    it('should update cache in background', async () => {
      const request = new Request('https://example.com/page.html');
      const cachedResponse = new Response('cached');
      const networkResponse = new Response('fresh', { status: 200 });

      mockCache.match.mockResolvedValue(cachedResponse);
      (global.fetch as any).mockResolvedValue(networkResponse);

      await staleWhileRevalidate(request, options);

      // Wait for background update
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCache.put).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const request = new Request('https://example.com/page.html');
      const cachedResponse = new Response('cached');

      mockCache.match.mockResolvedValue(cachedResponse);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const response = await staleWhileRevalidate(request, options);

      expect(response).toBe(cachedResponse);
      // Should not throw even though network failed
    });

    it('should throw error if both cache and network fail', async () => {
      const request = new Request('https://example.com/page.html');

      mockCache.match.mockResolvedValue(undefined);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(staleWhileRevalidate(request, options)).rejects.toThrow();
    });
  });

  // ============================================================================
  // NETWORK ONLY STRATEGY
  // ============================================================================

  describe('networkOnly', () => {
    const options: StrategyOptions = {
      cacheName: 'test-cache',
    };

    it('should always fetch from network', async () => {
      const request = new Request('https://example.com/api/post', { method: 'POST' });
      const networkResponse = new Response('success');

      (global.fetch as any).mockResolvedValue(networkResponse);

      const response = await networkOnly(request, options);

      expect(response).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalledWith(request);
      expect(mockCache.match).not.toHaveBeenCalled();
      expect(mockCache.put).not.toHaveBeenCalled();
    });

    it('should throw error on network failure', async () => {
      const request = new Request('https://example.com/api/post', { method: 'POST' });

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(networkOnly(request, options)).rejects.toThrow('Network error');
    });
  });

  // ============================================================================
  // CACHE ONLY STRATEGY
  // ============================================================================

  describe('cacheOnly', () => {
    const options: StrategyOptions = {
      cacheName: 'test-cache',
    };

    it('should return cached response', async () => {
      const request = new Request('https://example.com/offline.html');
      const cachedResponse = new Response('offline page');

      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await cacheOnly(request, options);

      expect(response).toBe(cachedResponse);
      expect(mockCache.match).toHaveBeenCalledWith(request, undefined);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should throw error if no cache available', async () => {
      const request = new Request('https://example.com/offline.html');

      mockCache.match.mockResolvedValue(undefined);

      await expect(cacheOnly(request, options)).rejects.toThrow(
        'No cached response for: https://example.com/offline.html'
      );
    });
  });

  // ============================================================================
  // STRATEGY ROUTER
  // ============================================================================

  describe('getStrategyHandler', () => {
    it('should return cacheFirst handler', () => {
      const handler = getStrategyHandler('CacheFirst');
      expect(handler).toBe(cacheFirst);
    });

    it('should return networkFirst handler', () => {
      const handler = getStrategyHandler('NetworkFirst');
      expect(handler).toBe(networkFirst);
    });

    it('should return staleWhileRevalidate handler', () => {
      const handler = getStrategyHandler('StaleWhileRevalidate');
      expect(handler).toBe(staleWhileRevalidate);
    });

    it('should return networkOnly handler', () => {
      const handler = getStrategyHandler('NetworkOnly');
      expect(handler).toBe(networkOnly);
    });

    it('should return cacheOnly handler', () => {
      const handler = getStrategyHandler('CacheOnly');
      expect(handler).toBe(cacheOnly);
    });

    it('should fallback to networkFirst for unknown strategy', () => {
      const handler = getStrategyHandler('UnknownStrategy');
      expect(handler).toBe(networkFirst);
      expect(console.warn).toHaveBeenCalledWith(
        'Unknown strategy: UnknownStrategy, using NetworkFirst'
      );
    });
  });

  // ============================================================================
  // APPLY CACHE RULE
  // ============================================================================

  describe('applyCacheRule', () => {
    it('should apply cache rule to request', async () => {
      const request = new Request('https://example.com/image.jpg');
      const rule: CacheRule = {
        name: 'images',
        urlPattern: /\.jpg$/,
        strategy: 'CacheFirst',
        cacheName: 'images-cache',
        maxAge: 60000,
      };

      const cachedResponse = new Response('cached image', {
        headers: { date: new Date().toUTCString() },
      });

      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await applyCacheRule(request, rule);

      expect(response).toBe(cachedResponse);
    });
  });

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  describe('cleanupCache', () => {
    it('should delete oldest entries when exceeding max', async () => {
      const requests = [
        new Request('https://example.com/1'),
        new Request('https://example.com/2'),
        new Request('https://example.com/3'),
        new Request('https://example.com/4'),
        new Request('https://example.com/5'),
      ];

      mockCache.keys.mockResolvedValue(requests);
      mockCache.delete.mockResolvedValue(true);

      await cleanupCache('test-cache', 3);

      // Should delete 2 oldest entries (5 - 3 = 2)
      expect(mockCache.delete).toHaveBeenCalledTimes(2);
    });

    it('should not delete if under max entries', async () => {
      const requests = [new Request('https://example.com/1'), new Request('https://example.com/2')];

      mockCache.keys.mockResolvedValue(requests);

      await cleanupCache('test-cache', 5);

      expect(mockCache.delete).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredCache', () => {
    it('should delete expired entries', async () => {
      const oldDate = new Date(Date.now() - 120000).toUTCString(); // 2 minutes ago
      const newDate = new Date().toUTCString();

      const requests = [
        new Request('https://example.com/old'),
        new Request('https://example.com/new'),
      ];

      const responses = [
        new Response('old', { headers: { date: oldDate } }),
        new Response('new', { headers: { date: newDate } }),
      ];

      mockCache.keys.mockResolvedValue(requests);
      mockCache.match.mockImplementation((req) => {
        const index = requests.indexOf(req);
        return Promise.resolve(responses[index]);
      });
      mockCache.delete.mockResolvedValue(true);

      await cleanupExpiredCache('test-cache', 60000); // 1 minute max age

      // Should delete the old entry
      expect(mockCache.delete).toHaveBeenCalledWith(requests[0]);
      expect(mockCache.delete).toHaveBeenCalledTimes(1);
    });

    it('should skip entries without date header', async () => {
      const requests = [new Request('https://example.com/no-date')];
      const responses = [new Response('no date')];

      mockCache.keys.mockResolvedValue(requests);
      mockCache.match.mockResolvedValue(responses[0]);

      await cleanupExpiredCache('test-cache', 60000);

      expect(mockCache.delete).not.toHaveBeenCalled();
    });
  });

  describe('precacheUrls', () => {
    it('should precache all URLs', async () => {
      const urls = [
        'https://example.com/1.html',
        'https://example.com/2.html',
        'https://example.com/3.html',
      ];

      (global.fetch as any).mockResolvedValue(new Response('cached', { status: 200 }));

      await precacheUrls(urls, 'static-cache');

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(mockCache.put).toHaveBeenCalledTimes(3);
    });

    it('should skip failed fetches', async () => {
      const urls = ['https://example.com/1.html', 'https://example.com/2.html'];

      (global.fetch as any)
        .mockResolvedValueOnce(new Response('ok', { status: 200 }))
        .mockRejectedValueOnce(new Error('Network error'));

      await precacheUrls(urls, 'static-cache');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockCache.put).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', async () => {
      const cacheNames = ['cache-1', 'cache-2', 'cache-3'];

      (global.caches.keys as any).mockResolvedValue(cacheNames);
      (global.caches.delete as any).mockResolvedValue(true);

      const count = await clearAllCaches();

      expect(count).toBe(3);
      expect(global.caches.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const requests = [
        new Request('https://example.com/1'),
        new Request('https://example.com/2'),
        new Request('https://example.com/3'),
      ];

      mockCache.keys.mockResolvedValue(requests);

      const stats = await getCacheStats('test-cache');

      expect(stats).toEqual({
        name: 'test-cache',
        size: 3,
        urls: [
          'https://example.com/1',
          'https://example.com/2',
          'https://example.com/3',
        ],
      });
    });

    it('should handle empty cache', async () => {
      mockCache.keys.mockResolvedValue([]);

      const stats = await getCacheStats('empty-cache');

      expect(stats).toEqual({
        name: 'empty-cache',
        size: 0,
        urls: [],
      });
    });
  });
});
