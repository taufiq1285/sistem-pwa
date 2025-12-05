/**
 * Logger Utility Unit Tests
 * Tests the structure and availability of logger methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/utils/logger';

describe('Logger Utility', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  describe('API structure', () => {
    it('should have all required methods', () => {
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('auth');
      expect(logger).toHaveProperty('group');
      expect(logger).toHaveProperty('groupEnd');
    });

    it('should have methods that are functions', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.auth).toBe('function');
      expect(typeof logger.group).toBe('function');
      expect(typeof logger.groupEnd).toBe('function');
    });
  });

  describe('warn()', () => {
    it('should always call console.warn', () => {
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('warning message');
    });

    it('should pass multiple arguments to console.warn', () => {
      logger.warn('warn:', 123, { key: 'value' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('warn:', 123, { key: 'value' });
    });
  });

  describe('error()', () => {
    it('should always call console.error', () => {
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
    });

    it('should pass multiple arguments to console.error', () => {
      const error = new Error('test');
      logger.error('Error:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('method invocation', () => {
    it('should not throw errors when called', () => {
      expect(() => logger.info('test')).not.toThrow();
      expect(() => logger.warn('test')).not.toThrow();
      expect(() => logger.error('test')).not.toThrow();
      expect(() => logger.debug('test')).not.toThrow();
      expect(() => logger.auth('test')).not.toThrow();
      expect(() => logger.group('test')).not.toThrow();
      expect(() => logger.groupEnd()).not.toThrow();
    });

    it('should handle empty arguments', () => {
      expect(() => logger.info()).not.toThrow();
      expect(() => logger.warn()).not.toThrow();
      expect(() => logger.error()).not.toThrow();
    });

    it('should handle null and undefined', () => {
      expect(() => logger.info(null, undefined)).not.toThrow();
      expect(() => logger.warn(null)).not.toThrow();
      expect(() => logger.error(undefined)).not.toThrow();
    });
  });
});
