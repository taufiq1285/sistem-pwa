/**
 * IndexedDB Mock
 */

import { vi } from "vitest";

export const createIndexedDBMock = () => {
  const store = new Map();

  return {
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
  };
};

export const indexedDBMock = createIndexedDBMock();
