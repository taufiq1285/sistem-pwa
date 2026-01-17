/**
 * IndexedDB Manager
 *
 * Purpose: Manage offline data storage using IndexedDB
 * Features:
 * - Database initialization
 * - Object stores setup with versioning
 * - CRUD operations (Create, Read, Update, Delete)
 * - Batch operations
 * - Query with filters
 * - Error handling
 * - Migration support
 */

import { openDB, type IDBPDatabase } from "idb";
import type {
  IndexedDBConfig,
  StoreName,
  QueryOptions,
  BatchOperationResult,
  IndexedDBError as IDBError,
  DatabaseMetadata,
  MetadataKey,
} from "@/types/offline.types";

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const DB_NAME = "sistem_praktikum_pwa";
const DB_VERSION = 2; // ✅ Incremented for new object stores

/**
 * Database schema configuration
 */
const DB_CONFIG: IndexedDBConfig = {
  dbName: DB_NAME,
  version: DB_VERSION,
  stores: [
    // Kuis Store
    {
      name: "kuis",
      keyPath: "id",
      indexes: [
        { name: "kelas_id", keyPath: "kelas_id" },
        { name: "dosen_id", keyPath: "dosen_id" },
        { name: "created_at", keyPath: "created_at" },
        { name: "is_published", keyPath: "is_published" },
      ],
    },
    // Kuis Soal Store
    {
      name: "kuis_soal",
      keyPath: "id",
      indexes: [
        { name: "kuis_id", keyPath: "kuis_id" },
        { name: "nomor_soal", keyPath: "nomor_soal" },
      ],
    },
    // Kuis Jawaban Store
    {
      name: "kuis_jawaban",
      keyPath: "id",
      indexes: [
        { name: "kuis_id", keyPath: "kuis_id" },
        { name: "soal_id", keyPath: "soal_id" },
        { name: "mahasiswa_id", keyPath: "mahasiswa_id" },
      ],
    },
    // Nilai Store
    {
      name: "nilai",
      keyPath: "id",
      indexes: [
        { name: "mahasiswa_id", keyPath: "mahasiswa_id" },
        { name: "kelas_id", keyPath: "kelas_id" },
      ],
    },
    // Materi Store
    {
      name: "materi",
      keyPath: "id",
      indexes: [
        { name: "kelas_id", keyPath: "kelas_id" },
        { name: "dosen_id", keyPath: "dosen_id" },
        { name: "is_published", keyPath: "is_published" },
      ],
    },
    // Kelas Store
    {
      name: "kelas",
      keyPath: "id",
      indexes: [
        { name: "dosen_id", keyPath: "dosen_id" },
        { name: "is_active", keyPath: "is_active" },
      ],
    },
    // Users Store
    {
      name: "users",
      keyPath: "id",
      indexes: [
        { name: "email", keyPath: "email", options: { unique: true } },
        { name: "role", keyPath: "role" },
      ],
    },
    // Sync Queue Store
    {
      name: "sync_queue",
      keyPath: "id",
      indexes: [
        { name: "entity", keyPath: "entity" },
        { name: "status", keyPath: "status" },
        { name: "timestamp", keyPath: "timestamp" },
      ],
    },
    // Metadata Store
    {
      name: "metadata",
      keyPath: "key",
    },
    // ✅ OFFLINE STORES for Quiz
    // Offline Quiz Cache
    {
      name: "offline_quiz",
      keyPath: "id",
      indexes: [{ name: "cachedAt", keyPath: "cachedAt" }],
    },
    // Offline Questions Cache
    {
      name: "offline_questions",
      keyPath: "id",
      indexes: [
        { name: "kuis_id", keyPath: "kuis_id" },
        { name: "cachedAt", keyPath: "cachedAt" },
      ],
    },
    // Offline Answers (pending sync)
    {
      name: "offline_answers",
      keyPath: "id",
      indexes: [
        { name: "kuis_id", keyPath: "kuis_id" },
        { name: "mahasiswa_id", keyPath: "mahasiswa_id" },
        { name: "attempt_id", keyPath: "attempt_id" },
        { name: "synced", keyPath: "synced" },
      ],
    },
    // Offline Attempts Cache
    {
      name: "offline_attempts",
      keyPath: "id",
      indexes: [
        { name: "kuis_id", keyPath: "kuis_id" },
        { name: "mahasiswa_id", keyPath: "mahasiswa_id" },
        { name: "synced", keyPath: "synced" },
        { name: "cachedAt", keyPath: "cachedAt" },
      ],
    },
  ],
};

// ============================================================================
// INDEXEDDB MANAGER CLASS
// ============================================================================

/**
 * IndexedDB Manager
 * Handles all IndexedDB operations with error handling and type safety
 */
export class IndexedDBManager {
  private db: IDBPDatabase | null = null;
  private isInitialized = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize database connection
   * Creates or upgrades database schema
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized && this.db) {
        return; // Already initialized
      }

      this.db = await openDB(DB_CONFIG.dbName, DB_CONFIG.version, {
        upgrade(db, oldVersion, newVersion) {
          console.log(
            `🔄 Upgrading IndexedDB from v${oldVersion} to v${newVersion}`,
          );

          // Create object stores
          for (const storeConfig of DB_CONFIG.stores) {
            // Create store if it doesn't exist
            if (!db.objectStoreNames.contains(storeConfig.name)) {
              const store = db.createObjectStore(storeConfig.name, {
                keyPath: storeConfig.keyPath,
                autoIncrement: storeConfig.autoIncrement,
              });

              // Create indexes
              if (storeConfig.indexes) {
                for (const index of storeConfig.indexes) {
                  store.createIndex(index.name, index.keyPath, index.options);
                }
              }

              console.log(`✅ Created store: ${storeConfig.name}`);
            }
          }
        },
        blocked() {
          console.warn("⚠️ IndexedDB upgrade blocked by another connection");
        },
        blocking() {
          console.warn("⚠️ This connection is blocking a database upgrade");
        },
        terminated() {
          console.error("❌ IndexedDB connection terminated unexpectedly");
        },
      });

      this.isInitialized = true;
      console.log("✅ IndexedDB initialized successfully");

      // Set initialization metadata
      await this.setMetadata("db_version", DB_VERSION);
    } catch (error) {
      console.error("❌ IndexedDB initialization failed:", error);
      throw this.createError(
        "Failed to initialize IndexedDB",
        "INIT_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log("🔒 IndexedDB connection closed");
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create (INSERT) a single item
   */
  async create<T extends { id: string }>(
    storeName: StoreName,
    item: T,
  ): Promise<T> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      await store.add(item);
      await tx.done;

      return item;
    } catch (error) {
      console.error(`Create failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to create item in ${storeName}`,
        "CREATE_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Read (GET) a single item by ID
   */
  async read<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      return (await store.get(id)) as T | undefined;
    } catch (error) {
      console.error(`Read failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to read item from ${storeName}`,
        "READ_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Get item by ID (alias for read)
   */
  async getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    return this.read<T>(storeName, id);
  }
  /**
   * Update (PUT) a single item
   */
  async update<T extends { id: string }>(
    storeName: StoreName,
    item: T,
  ): Promise<T> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      await store.put(item);
      await tx.done;

      return item;
    } catch (error) {
      console.error(`Update failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to update item in ${storeName}`,
        "UPDATE_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Delete (DELETE) a single item by ID
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      await store.delete(id);
      await tx.done;
    } catch (error) {
      console.error(`Delete failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to delete item from ${storeName}`,
        "DELETE_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: StoreName, options?: QueryOptions): Promise<T[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      let items: T[];

      // If we have offset, we need to get all items first, then slice
      // because IDBObjectStore.getAll() doesn't support offset
      const hasOffset = options?.offset !== undefined && options.offset > 0;
      const effectiveLimit = hasOffset ? undefined : options?.limit;

      if (options?.index) {
        const index = store.index(options.index);
        items = (await index.getAll(options.range, effectiveLimit)) as T[];
      } else {
        items = (await store.getAll(options?.range, effectiveLimit)) as T[];
      }

      // Apply offset and limit manually if needed
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const start = options.offset || 0;
        const end = options.limit ? start + options.limit : undefined;
        items = items.slice(start, end);
      }

      return items;
    } catch (error) {
      console.error(`GetAll failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to get all items from ${storeName}`,
        "GETALL_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: string | number,
  ): Promise<T[]> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);

      return (await index.getAll(value)) as T[];
    } catch (error) {
      console.error(`GetByIndex failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to get items by index from ${storeName}`,
        "GET_BY_INDEX_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Count items in a store
   */
  async count(storeName: StoreName): Promise<number> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      return await store.count();
    } catch (error) {
      console.error(`Count failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to count items in ${storeName}`,
        "COUNT_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Clear all items from a store
   */
  async clear(storeName: StoreName): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      await store.clear();
      await tx.done;

      console.log(`🗑️ Cleared all items from ${storeName}`);
    } catch (error) {
      console.error(`Clear failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to clear ${storeName}`,
        "CLEAR_FAILED",
        error as Error,
      );
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Batch create multiple items
   * Uses individual transactions to handle partial failures gracefully
   */
  async batchCreate<T extends { id: string }>(
    storeName: StoreName,
    items: T[],
  ): Promise<BatchOperationResult<T>> {
    const failed: Array<{ item: T; error: Error }> = [];
    const succeeded: T[] = [];

    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      // Use individual transactions for each item to handle partial failures
      for (const item of items) {
        try {
          const tx = this.db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);
          await store.add(item);
          await tx.done;
          succeeded.push(item);
        } catch (error) {
          failed.push({ item, error: error as Error });
        }
      }

      return {
        success: failed.length === 0,
        data: succeeded,
        failed: failed.length > 0 ? failed : undefined,
        count: succeeded.length,
      };
    } catch (error) {
      console.error(`Batch create failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to batch create items in ${storeName}`,
        "BATCH_CREATE_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Batch update multiple items
   * Uses individual transactions to handle partial failures gracefully
   */
  async batchUpdate<T extends { id: string }>(
    storeName: StoreName,
    items: T[],
  ): Promise<BatchOperationResult<T>> {
    const failed: Array<{ item: T; error: Error }> = [];
    const succeeded: T[] = [];

    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      // Use individual transactions for each item to handle partial failures
      for (const item of items) {
        try {
          const tx = this.db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);
          await store.put(item);
          await tx.done;
          succeeded.push(item);
        } catch (error) {
          failed.push({ item, error: error as Error });
        }
      }

      return {
        success: failed.length === 0,
        data: succeeded,
        failed: failed.length > 0 ? failed : undefined,
        count: succeeded.length,
      };
    } catch (error) {
      console.error(`Batch update failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to batch update items in ${storeName}`,
        "BATCH_UPDATE_FAILED",
        error as Error,
      );
    }
  }

  /**
   * Batch delete multiple items
   * Uses individual transactions to handle partial failures gracefully
   */
  async batchDelete(
    storeName: StoreName,
    ids: string[],
  ): Promise<BatchOperationResult<string>> {
    const failed: Array<{ item: string; error: Error }> = [];
    const succeeded: string[] = [];

    try {
      await this.ensureInitialized();
      if (!this.db) throw new Error("Database not initialized");

      // Use individual transactions for each item to handle partial failures
      for (const id of ids) {
        try {
          const tx = this.db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);
          await store.delete(id);
          await tx.done;
          succeeded.push(id);
        } catch (error) {
          failed.push({ item: id, error: error as Error });
        }
      }

      return {
        success: failed.length === 0,
        data: succeeded,
        failed: failed.length > 0 ? failed : undefined,
        count: succeeded.length,
      };
    } catch (error) {
      console.error(`Batch delete failed in ${storeName}:`, error);
      throw this.createError(
        `Failed to batch delete items from ${storeName}`,
        "BATCH_DELETE_FAILED",
        error as Error,
      );
    }
  }

  // ============================================================================
  // METADATA OPERATIONS
  // ============================================================================

  /**
   * Set metadata value
   */
  async setMetadata(key: MetadataKey | string, value: unknown): Promise<void> {
    const metadata: DatabaseMetadata = {
      key,
      value,
      updated_at: Date.now(),
    };

    await this.update("metadata", metadata as never);
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: MetadataKey | string): Promise<unknown> {
    const metadata = await this.read<DatabaseMetadata>("metadata", key);
    return metadata?.value;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Get database info
   */
  async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    stores: string[];
    totalSize: number;
  }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const stores = Array.from(this.db.objectStoreNames);
    let totalSize = 0;

    for (const storeName of stores) {
      const count = await this.count(storeName as StoreName);
      totalSize += count;
    }

    return {
      name: DB_CONFIG.dbName,
      version: DB_CONFIG.version,
      stores,
      totalSize,
    };
  }

  /**
   * Clear entire database
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const stores = Array.from(this.db.objectStoreNames);

    for (const storeName of stores) {
      await this.clear(storeName as StoreName);
    }

    console.log("🗑️ Cleared all data from IndexedDB");
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Create standardized IndexedDB error
   */
  private createError(
    message: string,
    code: string,
    originalError?: Error,
  ): IDBError {
    const error: IDBError = {
      name: "IndexedDBError",
      message,
      code,
      originalError,
    };
    return error as IDBError;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance of IndexedDBManager
 */
export const indexedDBManager = new IndexedDBManager();

/**
 * Initialize IndexedDB on module load
 */
export async function initializeIndexedDB(): Promise<void> {
  try {
    await indexedDBManager.initialize();
  } catch (error) {
    console.error("Failed to initialize IndexedDB:", error);
    throw error;
  }
}
