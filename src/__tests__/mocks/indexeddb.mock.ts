/**
 * IndexedDB Mock
 */

import { vi } from "vitest";
import "fake-indexeddb/auto";

export const createIndexedDBMock = () => {
  const store = new Map();

  const mock = {
    initialize: vi.fn(async () => {
      return true;
    }),
    isReady: vi.fn(() => true),
    create: vi.fn(async (_storeName: string, item: any) => {
      store.set(item.id, item);
      return item;
    }),
    read: vi.fn(async (_storeName: string, id: string) => {
      return store.get(id);
    }),
    update: vi.fn(async (_storeName: string, item: any) => {
      store.set(item.id, item);
      return item;
    }),
    delete: vi.fn(async (_storeName: string, id: string) => {
      store.delete(id);
    }),
    getAll: vi.fn(async () => {
      return Array.from(store.values());
    }),
    clear: vi.fn(async () => {
      store.clear();
    }),
    getById: vi.fn(async (_storeName: string, id: string) => {
      return store.get(id);
    }),
    clearStore: vi.fn(async () => {
      store.clear();
    }),
    _reset: vi.fn(() => {
      store.clear();
      vi.clearAllMocks();
    }),
    mockResolvedValue: vi.fn((value: any) => {
      return mock;
    }),
    mockRejectedValue: vi.fn((error: any) => {
      return mock;
    }),
  };

  return mock;
};

export const indexedDBMock = createIndexedDBMock();

// Mock the IndexedDBManager class
export const mockIndexedDBManager = {
  getInstance: vi.fn(() => indexedDBMock),
  initialize: vi.fn(async () => true),
};
