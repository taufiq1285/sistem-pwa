/**
 * Storage Manager Unit Tests
 *
 * Tests for unified storage management including:
 * - Storage initialization
 * - Get/Set/Remove operations
 * - localStorage and IndexedDB integration
 * - Storage availability checks
 * - Storage usage information
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initStorage,
  getItem,
  setItem,
  removeItem,
  clear,
  isStorageAvailable,
  getStorageInfo,
} from '../../../lib/offline/storage-manager';
import { indexedDBManager } from '../../../lib/offline/indexeddb';
import { logger } from '../../../lib/utils/logger';

// Mock IndexedDB manager
vi.mock('../../../lib/offline/indexeddb', () => ({
  indexedDBManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    read: vi.fn(),
    clearAll: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    getDatabaseInfo: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../../lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  const mock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    // Expose store for testing
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };

  return mock;
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Storage Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset internal store dari factory mock
    localStorageMock.clear();
    
    // Reset properti store manual untuk implementasi mock di bawah
    (localStorageMock as any).store = {};

    // Reset implementasi mock ke default
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      (localStorageMock as any).store = (localStorageMock as any).store || {};
      (localStorageMock as any).store[key] = value;
    });

    localStorageMock.getItem.mockImplementation((key: string) => {
      const store = (localStorageMock as any).store || {};
      return store[key] || null;
    });

    localStorageMock.removeItem.mockImplementation((key: string) => {
      const store = (localStorageMock as any).store || {};
      delete store[key];
    });

    // --- PERBAIKAN DI SINI ---
    // Membersihkan properti tambahan tanpa menghapus fungsi mock utama
    const builtInMethods = ['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length', '_getStore', '_setStore'];
    
    Object.keys(global.localStorage).forEach((key) => {
      // Hanya hapus jika key BUKAN merupakan method bawaan mock
      if (!builtInMethods.includes(key)) {
        delete (global.localStorage as any)[key];
      }
    });
  });

  describe('initStorage', () => {
    it('should initialize IndexedDB successfully', async () => {
      await initStorage();

      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Storage systems initialized successfully'
      );
    });

    it('should warn if localStorage is not available', async () => {
      const originalLocalStorage = global.localStorage;
      // @ts-ignore
      global.localStorage = undefined;

      await initStorage();

      expect(logger.warn).toHaveBeenCalledWith('localStorage is not available');

      global.localStorage = originalLocalStorage;
    });

    it('should handle initialization errors', async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error('Init error')
      );

      await expect(initStorage()).rejects.toThrow('Init error');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to initialize storage:',
        expect.any(Error)
      );
    });
  });

  describe('getItem', () => {
    describe('with ID (IndexedDB)', () => {
      it('should fetch from IndexedDB when ID is provided', async () => {
        const mockData = { id: '123', name: 'Test' };
        vi.mocked(indexedDBManager.read).mockResolvedValue(mockData);

        const result = await getItem('users', '123');

        expect(result).toEqual(mockData);
        expect(indexedDBManager.read).toHaveBeenCalledWith('users', '123');
      });

      it('should return undefined when IndexedDB item not found', async () => {
        vi.mocked(indexedDBManager.read).mockResolvedValue(undefined);

        const result = await getItem('users', '456');

        expect(result).toBeUndefined();
      });

      it('should handle IndexedDB read errors', async () => {
        vi.mocked(indexedDBManager.read).mockRejectedValue(
          new Error('Read error')
        );

        const result = await getItem('users', '123');

        expect(result).toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to get item users:',
          expect.any(Error)
        );
      });
    });

    describe('without ID (localStorage)', () => {
      it('should get JSON object from localStorage', async () => {
        const data = { id: 1, name: 'Test' };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(data));

        const result = await getItem<{ id: number; name: string }>('test-key');

        expect(result).toEqual(data);
        expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
      });

      it('should get string from localStorage', async () => {
        localStorageMock.getItem.mockReturnValue('simple-string');

        const result = await getItem<string>('string-key');

        expect(result).toBe('simple-string');
      });

      it('should return undefined when key not found', async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await getItem('non-existent');

        expect(result).toBeUndefined();
      });

      it('should handle invalid JSON gracefully', async () => {
        localStorageMock.getItem.mockReturnValue('invalid-json{');

        const result = await getItem('bad-json');

        // Should return as string when JSON parsing fails
        expect(result).toBe('invalid-json{');
      });

      it('should handle localStorage errors', async () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        const result = await getItem('error-key');

        expect(result).toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to get item error-key:',
          expect.any(Error)
        );
      });
    });
  });

  describe('setItem', () => {
    it('should store string in localStorage', async () => {
      await setItem('string-key', 'test value');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'string-key',
        'test value'
      );
    });

    it('should serialize and store object in localStorage', async () => {
      const data = { id: 1, name: 'Test' };

      await setItem('object-key', data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'object-key',
        JSON.stringify(data)
      );
    });

    it('should serialize and store array in localStorage', async () => {
      const data = [1, 2, 3, 4, 5];

      await setItem('array-key', data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'array-key',
        JSON.stringify(data)
      );
    });

    it('should store number in localStorage', async () => {
      await setItem('number-key', 42);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('number-key', '42');
    });

    it('should store boolean in localStorage', async () => {
      await setItem('bool-key', true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('bool-key', 'true');
    });

    it('should handle storage quota errors', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      await expect(setItem('key', 'value')).rejects.toThrow('Quota exceeded');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to set item key:',
        expect.any(Error)
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', async () => {
      await removeItem('test-key');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle removal errors', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove error');
      });

      await expect(removeItem('error-key')).rejects.toThrow('Remove error');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to remove item error-key:',
        expect.any(Error)
      );
    });
  });

  describe('clear', () => {
    it('should clear both localStorage and IndexedDB', async () => {
      await clear();

      expect(localStorageMock.clear).toHaveBeenCalled();
      expect(indexedDBManager.clearAll).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('All storage cleared');
    });

    it('should handle clear errors', async () => {
      vi.mocked(indexedDBManager.clearAll).mockRejectedValue(
        new Error('Clear error')
      );

      await expect(clear()).rejects.toThrow('Clear error');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to clear storage:',
        expect.any(Error)
      );
    });

    it('should call localStorage.clear before IndexedDB', async () => {
      const clearOrder: string[] = [];

      localStorageMock.clear.mockImplementation(() => {
        clearOrder.push('localStorage');
      });

      vi.mocked(indexedDBManager.clearAll).mockImplementation(async () => {
        clearOrder.push('indexedDB');
      });

      await clear();

      expect(clearOrder).toEqual(['localStorage', 'indexedDB']);
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when both storages are available', () => {
      vi.mocked(indexedDBManager.isReady).mockReturnValue(true);

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        '__storage_test__',
        'test'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('__storage_test__');
    });

    it('should return false when localStorage throws error', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage disabled');
      });

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(false);
    });

    it('should return false when IndexedDB is not ready', () => {
      vi.mocked(indexedDBManager.isReady).mockReturnValue(false);

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(false);
    });
  });

 describe('getStorageInfo', () => {
    it('should return storage usage information', async () => {
      // Mock localStorage with some data
      Object.defineProperty(localStorage, 'key1', {
        value: 'value1',
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(localStorage, 'key2', {
        value: 'longer value string',
        enumerable: true,
        configurable: true,
      });

      localStorageMock.getItem.mockImplementation((key) => {
        const data: Record<string, string> = {
          key1: 'value1',
          key2: 'longer value string',
        };
        return data[key] || null;
      });

      // PERBAIKAN: Menambahkan 'name' dan 'version' agar sesuai tipe data
      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: 'test-db',
        version: 1,
        stores: ['users', 'kuis', 'nilai'],
        totalSize: 150,
      });

      const info = await getStorageInfo();

      expect(info).toMatchObject({
        localStorage: {
          used: expect.any(Number),
          available: 5 * 1024 * 1024, // 5MB
        },
        indexedDB: {
          stores: ['users', 'kuis', 'nilai'],
          totalItems: 150,
        },
      });
    });

    it('should handle empty localStorage', async () => {
      // Ensure localStorage is truly empty
      // Loop safe ini tidak akan menghapus method mock
      const builtInMethods = ['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length', '_getStore', '_setStore'];
      Object.keys(localStorage).forEach((key) => {
        if (!builtInMethods.includes(key)) {
          delete (localStorage as any)[key];
        }
      });

      // PERBAIKAN: Menambahkan 'name' dan 'version'
      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: 'test-db',
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const info = await getStorageInfo();

      expect(info.localStorage.used).toBeGreaterThanOrEqual(0);
      expect(info.indexedDB.totalItems).toBe(0);
    });

    it('should handle errors getting storage info', async () => {
      vi.mocked(indexedDBManager.getDatabaseInfo).mockRejectedValue(
        new Error('Info error')
      );

      await expect(getStorageInfo()).rejects.toThrow('Info error');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get storage info:',
        expect.any(Error)
      );
    });

    it('should calculate localStorage size correctly', async () => {
      // Ensure localStorage is empty first
      const builtInMethods = ['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length', '_getStore', '_setStore'];
      Object.keys(localStorage).forEach((key) => {
        if (!builtInMethods.includes(key)) {
          delete (localStorage as any)[key];
        }
      });

      // Create a simple localStorage mock with known data
      const testData: Record<string, string> = {
        testKey: 'testValue',
      };

      Object.keys(testData).forEach((key) => {
        Object.defineProperty(localStorage, key, {
          value: testData[key],
          enumerable: true,
          configurable: true,
        });
      });

      localStorageMock.getItem.mockImplementation((key) => testData[key] || null);

      // PERBAIKAN: Menambahkan 'name' dan 'version'
      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: 'test-db',
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const info = await getStorageInfo();

      // Size should include the key and value
      // At minimum it should be the sum of key length + value length
      const expectedSize = 'testKey'.length + 'testValue'.length;
      expect(info.localStorage.used).toBeGreaterThanOrEqual(expectedSize);
    });
  });

  describe('Integration', () => {
    it('should work with getItem and setItem together', async () => {
      const data = { id: 1, name: 'Integration Test' };

      await setItem('integration-key', data);

      localStorageMock.getItem.mockReturnValue(JSON.stringify(data));

      const retrieved = await getItem<typeof data>('integration-key');

      expect(retrieved).toEqual(data);
    });

    it('should work with setItem and removeItem together', async () => {
      await setItem('temp-key', 'temp-value');
      await removeItem('temp-key');

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should preserve type information for getItem', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const user: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const result = await getItem<User>('user-key');

      expect(result).toEqual(user);
      // TypeScript should know result is User | undefined
      if (result) {
        expect(result.id).toBe(1);
        expect(result.name).toBe('Test User');
        expect(result.email).toBe('test@example.com');
      }
    });
  });
});