/**
 * useNotification Hook Unit Tests
 * Comprehensive tests for notification/toast functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '@/lib/hooks/useNotification';
import { toast } from 'sonner';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('useNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success', () => {
    it('should call toast.success with message only', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.success('Operation successful');
      });

      expect(toast.success).toHaveBeenCalledWith('Operation successful', {
        description: undefined,
        duration: 5000,
      });
    });

    it('should call toast.success with title and message', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.success('User saved successfully', 'Success');
      });

      expect(toast.success).toHaveBeenCalledWith('Success', {
        description: 'User saved successfully',
        duration: 5000,
      });
    });

    it('should accept custom duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.success('Quick message', undefined, 2000);
      });

      expect(toast.success).toHaveBeenCalledWith('Quick message', {
        description: undefined,
        duration: 2000,
      });
    });
  });

  describe('error', () => {
    it('should call toast.error with message only', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.error('Operation failed');
      });

      expect(toast.error).toHaveBeenCalledWith('Operation failed', {
        description: undefined,
        duration: 5000,
      });
    });

    it('should call toast.error with title and message', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.error('Failed to save user', 'Error');
      });

      expect(toast.error).toHaveBeenCalledWith('Error', {
        description: 'Failed to save user',
        duration: 5000,
      });
    });

    it('should accept custom duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.error('Critical error', 'Error', 10000);
      });

      expect(toast.error).toHaveBeenCalledWith('Error', {
        description: 'Critical error',
        duration: 10000,
      });
    });
  });

  describe('warning', () => {
    it('should call toast.warning with message only', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.warning('Please be careful');
      });

      expect(toast.warning).toHaveBeenCalledWith('Please be careful', {
        description: undefined,
        duration: 5000,
      });
    });

    it('should call toast.warning with title and message', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.warning('This action cannot be undone', 'Warning');
      });

      expect(toast.warning).toHaveBeenCalledWith('Warning', {
        description: 'This action cannot be undone',
        duration: 5000,
      });
    });

    it('should accept custom duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.warning('Important warning', undefined, 7000);
      });

      expect(toast.warning).toHaveBeenCalledWith('Important warning', {
        description: undefined,
        duration: 7000,
      });
    });
  });

  describe('info', () => {
    it('should call toast.info with message only', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.info('Here is some information');
      });

      expect(toast.info).toHaveBeenCalledWith('Here is some information', {
        description: undefined,
        duration: 5000,
      });
    });

    it('should call toast.info with title and message', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.info('New features available', 'Info');
      });

      expect(toast.info).toHaveBeenCalledWith('Info', {
        description: 'New features available',
        duration: 5000,
      });
    });

    it('should accept custom duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.info('Quick tip', undefined, 3000);
      });

      expect(toast.info).toHaveBeenCalledWith('Quick tip', {
        description: undefined,
        duration: 3000,
      });
    });
  });

  describe('dismiss', () => {
    it('should dismiss specific toast by id', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.dismiss('toast-123');
      });

      expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
    });

    it('should dismiss specific toast by numeric id', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.dismiss(123);
      });

      expect(toast.dismiss).toHaveBeenCalledWith(123);
    });

    it('should dismiss all toasts when no id provided', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.dismiss();
      });

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('clear', () => {
    it('should clear all toasts', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.clear();
      });

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('memoization', () => {
    it('should return same methods reference on re-render', () => {
      const { result, rerender } = renderHook(() => useNotification());

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult.success).toBe(secondResult.success);
      expect(firstResult.error).toBe(secondResult.error);
      expect(firstResult.warning).toBe(secondResult.warning);
      expect(firstResult.info).toBe(secondResult.info);
      expect(firstResult.dismiss).toBe(secondResult.dismiss);
      expect(firstResult.clear).toBe(secondResult.clear);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string message', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.success('');
      });

      expect(toast.success).toHaveBeenCalledWith('', {
        description: undefined,
        duration: 5000,
      });
    });

    it('should handle very long messages', () => {
      const { result } = renderHook(() => useNotification());
      const longMessage = 'a'.repeat(1000);

      act(() => {
        result.current.error(longMessage);
      });

      expect(toast.error).toHaveBeenCalledWith(longMessage, {
        description: undefined,
        duration: 5000,
      });
    });

    it('should handle special characters in message', () => {
      const { result } = renderHook(() => useNotification());
      const specialMessage = '<script>alert("xss")</script>';

      act(() => {
        result.current.warning(specialMessage);
      });

      expect(toast.warning).toHaveBeenCalledWith(specialMessage, {
        description: undefined,
        duration: 5000,
      });
    });

    it('should handle zero duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.info('Message', undefined, 0);
      });

      expect(toast.info).toHaveBeenCalledWith('Message', {
        description: undefined,
        duration: 0,
      });
    });

    it('should handle negative duration', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.success('Message', undefined, -1000);
      });

      expect(toast.success).toHaveBeenCalledWith('Message', {
        description: undefined,
        duration: -1000,
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should handle form submission success', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.success('Form submitted successfully', 'Success', 3000);
      });

      expect(toast.success).toHaveBeenCalledWith('Success', {
        description: 'Form submitted successfully',
        duration: 3000,
      });
    });

    it('should handle API error', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.error('Failed to connect to server', 'Connection Error', 5000);
      });

      expect(toast.error).toHaveBeenCalledWith('Connection Error', {
        description: 'Failed to connect to server',
        duration: 5000,
      });
    });

    it('should handle validation warning', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.warning('Please fill all required fields', 'Validation Warning');
      });

      expect(toast.warning).toHaveBeenCalledWith('Validation Warning', {
        description: 'Please fill all required fields',
        duration: 5000,
      });
    });

    it('should handle multiple sequential notifications', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.info('Loading data...');
        result.current.success('Data loaded');
        result.current.warning('Some items failed to load');
      });

      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });

    it('should dismiss specific notification after showing new one', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.info('Loading...');
        result.current.dismiss('loading-toast');
        result.current.success('Done!');
      });

      expect(toast.info).toHaveBeenCalled();
      expect(toast.dismiss).toHaveBeenCalledWith('loading-toast');
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
