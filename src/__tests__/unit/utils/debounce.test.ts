/**
 * Debounce Utility Function Unit Tests
 * Comprehensive tests for standalone debounce functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, debounceImmediate } from '@/lib/utils/debounce';

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('test');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on rapid calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('call1');
      vi.advanceTimersByTime(300);

      debouncedFn('call2');
      vi.advanceTimersByTime(300);

      debouncedFn('call3');
      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('should handle multiple arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('arg1', 'arg2', 123, true);
      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123, true);
    });

    it('should preserve this context', () => {
      const obj = {
        value: 42,
        method: function (this: { value: number }) {
          return this.value;
        },
      };

      const debouncedMethod = debounce(obj.method, 500);
      const spy = vi.spyOn(obj, 'method');

      debouncedMethod.call(obj);
      vi.advanceTimersByTime(500);

      expect(spy).toHaveBeenCalled();
    });

    it('should work with different wait times', () => {
      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();

      const debouncedFn1 = debounce(mockFn1, 100);
      const debouncedFn2 = debounce(mockFn2, 1000);

      debouncedFn1('fast');
      debouncedFn2('slow');

      vi.advanceTimersByTime(100);
      expect(mockFn1).toHaveBeenCalledWith('fast');
      expect(mockFn2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(900);
      expect(mockFn2).toHaveBeenCalledWith('slow');
    });

    it('should clear previous timeout', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('call1');
      debouncedFn('call2');

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should work with zero wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('test');
      vi.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should handle rapid successive calls correctly', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      // Simulate 10 rapid calls
      for (let i = 0; i < 10; i++) {
        debouncedFn(`call${i}`);
        vi.advanceTimersByTime(50);
      }

      // Wait for debounce to complete
      vi.advanceTimersByTime(500);

      // Should only call once with the last value
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call9');
    });

    it('should work with async functions', () => {
      const mockAsyncFn = vi.fn(async () => {
        return 'result';
      });

      const debouncedFn = debounce(mockAsyncFn, 500);

      debouncedFn();
      vi.advanceTimersByTime(500);

      expect(mockAsyncFn).toHaveBeenCalled();
    });
  });

  describe('debounceImmediate', () => {
    it('should execute immediately on first call', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 500);

      debouncedFn('first');

      expect(mockFn).toHaveBeenCalledWith('first');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should debounce subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 500);

      // First call - immediate
      debouncedFn('call1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Second call within wait period - debounced
      vi.advanceTimersByTime(100);
      debouncedFn('call2');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Third call within wait period - still debounced
      vi.advanceTimersByTime(100);
      debouncedFn('call3');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should reset to immediate after wait period', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 500);

      // First call - immediate
      debouncedFn('call1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Wait for debounce period to complete
      vi.advanceTimersByTime(500);

      // Next call should be immediate again
      debouncedFn('call2');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('call2');
    });

    it('should handle multiple arguments on immediate call', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 500);

      debouncedFn('arg1', 'arg2', 123);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should preserve this context', () => {
      const obj = {
        value: 100,
        method: function (this: { value: number }) {
          return this.value;
        },
      };

      const debouncedMethod = debounceImmediate(obj.method, 500);
      const spy = vi.spyOn(obj, 'method');

      debouncedMethod.call(obj);

      expect(spy).toHaveBeenCalled();
    });

    it('should clear timeout on subsequent calls', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 500);

      debouncedFn('call1');
      vi.advanceTimersByTime(100);
      debouncedFn('call2');

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle zero wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 0);

      debouncedFn('call1');
      expect(mockFn).toHaveBeenCalledWith('call1');

      vi.advanceTimersByTime(0);

      debouncedFn('call2');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('call2');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle search input debouncing', () => {
      const searchFn = vi.fn();
      const debouncedSearch = debounce(searchFn, 300);

      // User typing "hello"
      debouncedSearch('h');
      vi.advanceTimersByTime(50);
      debouncedSearch('he');
      vi.advanceTimersByTime(50);
      debouncedSearch('hel');
      vi.advanceTimersByTime(50);
      debouncedSearch('hell');
      vi.advanceTimersByTime(50);
      debouncedSearch('hello');

      // Before debounce completes
      expect(searchFn).not.toHaveBeenCalled();

      // After debounce completes
      vi.advanceTimersByTime(300);
      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(searchFn).toHaveBeenCalledWith('hello');
    });

    it('should handle window resize debouncing', () => {
      const resizeHandler = vi.fn();
      const debouncedResize = debounce(resizeHandler, 150);

      // Simulate rapid resize events
      for (let i = 0; i < 20; i++) {
        debouncedResize({ width: 800 + i, height: 600 });
        vi.advanceTimersByTime(10);
      }

      // Wait for debounce
      vi.advanceTimersByTime(150);

      expect(resizeHandler).toHaveBeenCalledTimes(1);
      expect(resizeHandler).toHaveBeenCalledWith({ width: 819, height: 600 });
    });

    it('should handle button click debouncing with immediate', () => {
      const clickHandler = vi.fn();
      const debouncedClick = debounceImmediate(clickHandler, 1000);

      // First click - should execute immediately
      debouncedClick('submit');
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Rapid subsequent clicks - should be ignored
      vi.advanceTimersByTime(100);
      debouncedClick('submit');
      vi.advanceTimersByTime(100);
      debouncedClick('submit');

      expect(clickHandler).toHaveBeenCalledTimes(1);

      // After wait period, next click should execute
      vi.advanceTimersByTime(1000);
      debouncedClick('submit');

      expect(clickHandler).toHaveBeenCalledTimes(2);
    });

    it('should handle scroll event debouncing', () => {
      const scrollHandler = vi.fn();
      const debouncedScroll = debounce(scrollHandler, 100);

      // Simulate continuous scrolling
      for (let i = 0; i < 50; i++) {
        debouncedScroll({ scrollY: i * 10 });
        vi.advanceTimersByTime(5);
      }

      // Wait for debounce
      vi.advanceTimersByTime(100);

      expect(scrollHandler).toHaveBeenCalledTimes(1);
      expect(scrollHandler).toHaveBeenCalledWith({ scrollY: 490 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle function returning values', () => {
      const mockFn = vi.fn(() => 'result');
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveReturnedWith('result');
    });

    it('should handle function throwing errors', () => {
      const mockFn = vi.fn(() => {
        throw new Error('Test error');
      });

      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();

      expect(() => {
        vi.advanceTimersByTime(500);
      }).toThrow('Test error');
    });

    it('should handle very long wait times', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 10000);

      debouncedFn('test');
      vi.advanceTimersByTime(9999);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalled();
    });

    it('should handle null and undefined arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn(null, undefined);
      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledWith(null, undefined);
    });
  });
});
