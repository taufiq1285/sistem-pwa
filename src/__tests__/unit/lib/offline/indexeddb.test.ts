/**
 * IndexedDB Manager Unit Tests
 *
 * Comprehensive test suite with >90% coverage
 * Uses fake-indexeddb for isolated testing
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDBManager } from '@/lib/offline/indexeddb';
import type { OfflineKuis, OfflineNilai, OfflineMateri } from '@/types/offline.types';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockKuis: OfflineKuis = {
  id: 'test-kuis-1',
  judul: 'Test Kuis',
  deskripsi: 'Test description',
  kelas_id: 'kelas-1',
  dosen_id: 'dosen-1',
  tipe_kuis: 'kuis',
  waktu_mulai: '2024-01-01T00:00:00Z',
  waktu_selesai: '2024-01-02T00:00:00Z',
  durasi_menit: 60,
  passing_grade: 70,
  is_published: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null,
};

const mockNilai: OfflineNilai = {
  id: 'test-nilai-1',
  mahasiswa_id: 'mahasiswa-1',
  kelas_id: 'kelas-1',
  nilai_kuis: 85,
  nilai_tugas: 90,
  nilai_uts: 80,
  nilai_uas: 88,
  nilai_praktikum: 92,
  nilai_kehadiran: 95,
  nilai_akhir: 87.5,
  nilai_huruf: 'A',
  keterangan: 'Good performance',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null,
};

const mockMateri: OfflineMateri = {
  id: 'test-materi-1',
  judul: 'Test Materi',
  deskripsi: 'Test description',
  kelas_id: 'kelas-1',
  dosen_id: 'dosen-1',
  file_url: 'https://example.com/file.pdf',
  file_type: 'application/pdf',
  file_size: 1024,
  order_number: 1,
  is_published: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null,
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('IndexedDBManager', () => {
  let dbManager: IndexedDBManager;

  beforeAll(() => {
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Suppress unhandled rejections from IndexedDB AbortError
    // These are expected in tests that intentionally cause errors (e.g., duplicate keys)
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason: unknown) => {
        // Suppress AbortError from IndexedDB transactions
        if (reason && typeof reason === 'object' && 'name' in reason && reason.name === 'AbortError') {
          // Expected error, suppress it
          return;
        }
        // Re-throw other unhandled rejections
        throw reason;
      });
    }
  });

  beforeEach(async () => {
    dbManager = new IndexedDBManager();
    await dbManager.initialize();
  });

  afterEach(async () => {
    if (dbManager.isReady()) {
      await dbManager.clearAll();
      dbManager.close();
    }
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize database successfully', async () => {
      expect(dbManager.isReady()).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      const initSpy = vi.spyOn(dbManager as any, 'ensureInitialized');
      await dbManager.initialize();
      expect(dbManager.isReady()).toBe(true);
      initSpy.mockRestore();
    });

    it('should get database info with correct structure', async () => {
      const info = await dbManager.getDatabaseInfo();

      expect(info).toHaveProperty('name', 'sistem_praktikum_pwa');
      expect(info).toHaveProperty('version', 1);
      expect(info).toHaveProperty('stores');
      expect(info).toHaveProperty('totalSize');
      expect(info.stores).toBeInstanceOf(Array);
      expect(info.stores.length).toBeGreaterThanOrEqual(9);
    });

    it('should close database connection', () => {
      dbManager.close();
      expect(dbManager.isReady()).toBe(false);
    });

    it('should handle close on already closed database', () => {
      dbManager.close();
      dbManager.close(); // Should not throw
      expect(dbManager.isReady()).toBe(false);
    });

    it('should check if database is ready', () => {
      expect(dbManager.isReady()).toBe(true);
      dbManager.close();
      expect(dbManager.isReady()).toBe(false);
    });
  });

  // ============================================================================
  // CRUD OPERATIONS TESTS
  // ============================================================================

  describe('CRUD Operations', () => {
    describe('Create', () => {
      it('should create a new kuis item', async () => {
        const result = await dbManager.create('kuis', mockKuis);
        expect(result).toEqual(mockKuis);
      });

      it('should create a new nilai item', async () => {
        const result = await dbManager.create('nilai', mockNilai);
        expect(result).toEqual(mockNilai);
      });

      it('should create a new materi item', async () => {
        const result = await dbManager.create('materi', mockMateri);
        expect(result).toEqual(mockMateri);
      });

      it('should throw error when creating duplicate item', async () => {
        await dbManager.create('kuis', mockKuis);
        await expect(dbManager.create('kuis', mockKuis)).rejects.toThrow();
      });

      it('should create items in different stores', async () => {
        await dbManager.create('kuis', mockKuis);
        await dbManager.create('nilai', mockNilai);

        const kuis = await dbManager.read('kuis', mockKuis.id);
        const nilai = await dbManager.read('nilai', mockNilai.id);

        expect(kuis).toBeDefined();
        expect(nilai).toBeDefined();
      });
    });

    describe('Read', () => {
      it('should read an existing kuis item', async () => {
        await dbManager.create('kuis', mockKuis);
        const result = await dbManager.read<OfflineKuis>('kuis', mockKuis.id);
        expect(result).toEqual(mockKuis);
      });

      it('should read an existing nilai item', async () => {
        await dbManager.create('nilai', mockNilai);
        const result = await dbManager.read<OfflineNilai>('nilai', mockNilai.id);
        expect(result).toEqual(mockNilai);
      });

      it('should return undefined for non-existent item', async () => {
        const result = await dbManager.read('kuis', 'non-existent-id');
        expect(result).toBeUndefined();
      });

      it('should read items from different stores', async () => {
        await dbManager.create('kuis', mockKuis);
        await dbManager.create('materi', mockMateri);

        const kuis = await dbManager.read('kuis', mockKuis.id);
        const materi = await dbManager.read('materi', mockMateri.id);

        expect(kuis).toBeDefined();
        expect(materi).toBeDefined();
      });
    });

    describe('Update', () => {
      it('should update an existing kuis item', async () => {
        await dbManager.create('kuis', mockKuis);
        const updated = { ...mockKuis, judul: 'Updated Title' };
        const result = await dbManager.update('kuis', updated);
        expect(result.judul).toBe('Updated Title');
      });

      it('should update an existing nilai item', async () => {
        await dbManager.create('nilai', mockNilai);
        const updated = { ...mockNilai, nilai_akhir: 95 };
        const result = await dbManager.update('nilai', updated);
        expect(result.nilai_akhir).toBe(95);
      });

      it('should create item if it does not exist (upsert)', async () => {
        const result = await dbManager.update('kuis', mockKuis);
        expect(result).toEqual(mockKuis);

        const retrieved = await dbManager.read('kuis', mockKuis.id);
        expect(retrieved).toEqual(mockKuis);
      });

      it('should update multiple fields', async () => {
        await dbManager.create('kuis', mockKuis);
        const updated = {
          ...mockKuis,
          judul: 'New Title',
          deskripsi: 'New Description',
          passing_grade: 80,
        };

        await dbManager.update('kuis', updated);
        const result = await dbManager.read<OfflineKuis>('kuis', mockKuis.id);

        expect(result?.judul).toBe('New Title');
        expect(result?.deskripsi).toBe('New Description');
        expect(result?.passing_grade).toBe(80);
      });
    });

    describe('Delete', () => {
      it('should delete an existing kuis item', async () => {
        await dbManager.create('kuis', mockKuis);
        await dbManager.delete('kuis', mockKuis.id);

        const result = await dbManager.read('kuis', mockKuis.id);
        expect(result).toBeUndefined();
      });

      it('should delete an existing nilai item', async () => {
        await dbManager.create('nilai', mockNilai);
        await dbManager.delete('nilai', mockNilai.id);

        const result = await dbManager.read('nilai', mockNilai.id);
        expect(result).toBeUndefined();
      });

      it('should not throw error when deleting non-existent item', async () => {
        await expect(
          dbManager.delete('kuis', 'non-existent-id')
        ).resolves.not.toThrow();
      });

      it('should delete item and verify count decreases', async () => {
        await dbManager.create('kuis', mockKuis);
        const beforeCount = await dbManager.count('kuis');
        expect(beforeCount).toBe(1);

        await dbManager.delete('kuis', mockKuis.id);
        const afterCount = await dbManager.count('kuis');
        expect(afterCount).toBe(0);
      });
    });
  });

  // ============================================================================
  // QUERY OPERATIONS TESTS
  // ============================================================================

  describe('Query Operations', () => {
    beforeEach(async () => {
      const kuis1 = { ...mockKuis, id: 'kuis-1', kelas_id: 'kelas-1' };
      const kuis2 = { ...mockKuis, id: 'kuis-2', kelas_id: 'kelas-1' };
      const kuis3 = { ...mockKuis, id: 'kuis-3', kelas_id: 'kelas-2' };
      const kuis4 = { ...mockKuis, id: 'kuis-4', kelas_id: 'kelas-2' };

      await dbManager.create('kuis', kuis1);
      await dbManager.create('kuis', kuis2);
      await dbManager.create('kuis', kuis3);
      await dbManager.create('kuis', kuis4);
    });

    it('should get all items from a store', async () => {
      const results = await dbManager.getAll<OfflineKuis>('kuis');
      expect(results).toHaveLength(4);
    });

    it('should get items by index', async () => {
      const results = await dbManager.getByIndex<OfflineKuis>(
        'kuis',
        'kelas_id',
        'kelas-1'
      );

      expect(results).toHaveLength(2);
      expect(results.every(k => k.kelas_id === 'kelas-1')).toBe(true);
    });

    it('should get all items with limit', async () => {
      const results = await dbManager.getAll<OfflineKuis>('kuis', { limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('should get all items with offset', async () => {
      const results = await dbManager.getAll<OfflineKuis>('kuis', { offset: 2 });
      expect(results).toHaveLength(2);
    });

    it('should get all items with offset and limit', async () => {
      const results = await dbManager.getAll<OfflineKuis>('kuis', {
        offset: 1,
        limit: 2,
      });
      expect(results).toHaveLength(2);
    });

    it('should count items in a store', async () => {
      const count = await dbManager.count('kuis');
      expect(count).toBe(4);
    });

    it('should count zero for empty store', async () => {
      const count = await dbManager.count('users');
      expect(count).toBe(0);
    });

    it('should clear all items from a store', async () => {
      await dbManager.clear('kuis');
      const count = await dbManager.count('kuis');
      expect(count).toBe(0);
    });

    it('should clear store without affecting other stores', async () => {
      await dbManager.create('nilai', mockNilai);
      await dbManager.clear('kuis');

      const kuisCount = await dbManager.count('kuis');
      const nilaiCount = await dbManager.count('nilai');

      expect(kuisCount).toBe(0);
      expect(nilaiCount).toBe(1);
    });
  });

  // ============================================================================
  // BATCH OPERATIONS TESTS
  // ============================================================================

  describe('Batch Operations', () => {
    const mockItems: OfflineKuis[] = [
      { ...mockKuis, id: 'batch-1' },
      { ...mockKuis, id: 'batch-2' },
      { ...mockKuis, id: 'batch-3' },
    ];

    describe('Batch Create', () => {
      it('should create multiple items successfully', async () => {
        const result = await dbManager.batchCreate('kuis', mockItems);

        expect(result.success).toBe(true);
        expect(result.count).toBe(3);
        expect(result.data).toHaveLength(3);
        expect(result.failed).toBeUndefined();
      });

      it('should handle partial failures gracefully', async () => {
        await dbManager.create('kuis', mockItems[0]);
        const result = await dbManager.batchCreate('kuis', mockItems);

        expect(result.success).toBe(false);
        expect(result.count).toBe(2);
        expect(result.failed).toHaveLength(1);
        expect(result.failed?.[0].item.id).toBe('batch-1');
      });

      it('should return empty on empty array', async () => {
        const result = await dbManager.batchCreate('kuis', []);
        expect(result.success).toBe(true);
        expect(result.count).toBe(0);
      });
    });

    describe('Batch Update', () => {
      beforeEach(async () => {
        await dbManager.batchCreate('kuis', mockItems);
      });

      it('should update multiple items successfully', async () => {
        const updatedItems = mockItems.map(item => ({
          ...item,
          judul: 'Updated Title',
        }));

        const result = await dbManager.batchUpdate('kuis', updatedItems);

        expect(result.success).toBe(true);
        expect(result.count).toBe(3);

        const retrieved = await dbManager.read<OfflineKuis>('kuis', 'batch-1');
        expect(retrieved?.judul).toBe('Updated Title');
      });

      it('should upsert non-existent items', async () => {
        const newItems = [
          { ...mockKuis, id: 'new-1', judul: 'New Item' },
        ];

        const result = await dbManager.batchUpdate('kuis', newItems);
        expect(result.success).toBe(true);

        const count = await dbManager.count('kuis');
        expect(count).toBe(4);
      });
    });

    describe('Batch Delete', () => {
      beforeEach(async () => {
        await dbManager.batchCreate('kuis', mockItems);
      });

      it('should delete multiple items successfully', async () => {
        const ids = mockItems.map(item => item.id);
        const result = await dbManager.batchDelete('kuis', ids);

        expect(result.success).toBe(true);
        expect(result.count).toBe(3);

        const remainingCount = await dbManager.count('kuis');
        expect(remainingCount).toBe(0);
      });

      it('should handle non-existent IDs gracefully', async () => {
        const ids = ['non-existent-1', 'non-existent-2'];
        const result = await dbManager.batchDelete('kuis', ids);

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);
      });

      it('should delete subset of items', async () => {
        const ids = ['batch-1', 'batch-2'];
        await dbManager.batchDelete('kuis', ids);

        const count = await dbManager.count('kuis');
        expect(count).toBe(1);

        const remaining = await dbManager.read('kuis', 'batch-3');
        expect(remaining).toBeDefined();
      });
    });
  });

  // ============================================================================
  // METADATA OPERATIONS TESTS
  // ============================================================================

  describe('Metadata Operations', () => {
    it('should set and get metadata', async () => {
      await dbManager.setMetadata('last_full_sync', Date.now());
      const value = await dbManager.getMetadata('last_full_sync');

      expect(value).toBeDefined();
      expect(typeof value).toBe('number');
    });

    it('should update existing metadata', async () => {
      await dbManager.setMetadata('sync_enabled', true);
      await dbManager.setMetadata('sync_enabled', false);

      const value = await dbManager.getMetadata('sync_enabled');
      expect(value).toBe(false);
    });

    it('should return undefined for non-existent metadata', async () => {
      const value = await dbManager.getMetadata('non_existent_key');
      expect(value).toBeUndefined();
    });

    it('should set db_version metadata on initialization', async () => {
      const version = await dbManager.getMetadata('db_version');
      expect(version).toBeDefined();
      expect(version).toBe(1);
    });

    it('should handle different metadata types', async () => {
      await dbManager.setMetadata('string_meta', 'test');
      await dbManager.setMetadata('number_meta', 123);
      await dbManager.setMetadata('boolean_meta', true);
      await dbManager.setMetadata('object_meta', { key: 'value' });

      expect(await dbManager.getMetadata('string_meta')).toBe('test');
      expect(await dbManager.getMetadata('number_meta')).toBe(123);
      expect(await dbManager.getMetadata('boolean_meta')).toBe(true);
      expect(await dbManager.getMetadata('object_meta')).toEqual({ key: 'value' });
    });
  });

  // ============================================================================
  // UTILITY METHODS TESTS
  // ============================================================================

  describe('Utility Methods', () => {
    it('should check if database is ready', () => {
      expect(dbManager.isReady()).toBe(true);
    });

    it('should check if database is not ready after close', () => {
      dbManager.close();
      expect(dbManager.isReady()).toBe(false);
    });

    it('should clear all stores', async () => {
      await dbManager.create('kuis', mockKuis);
      await dbManager.create('nilai', mockNilai);
      await dbManager.create('materi', mockMateri);

      await dbManager.clearAll();

      const kuisCount = await dbManager.count('kuis');
      const nilaiCount = await dbManager.count('nilai');
      const materiCount = await dbManager.count('materi');

      expect(kuisCount).toBe(0);
      expect(nilaiCount).toBe(0);
      expect(materiCount).toBe(0);
    });

    it('should get accurate database info with data', async () => {
      await dbManager.create('kuis', mockKuis);
      await dbManager.create('nilai', mockNilai);

      const info = await dbManager.getDatabaseInfo();

      expect(info.name).toBe('sistem_praktikum_pwa');
      expect(info.version).toBe(1);
      expect(info.totalSize).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create
      await dbManager.create('kuis', mockKuis);

      // Read
      const retrieved = await dbManager.read<OfflineKuis>('kuis', mockKuis.id);
      expect(retrieved).toEqual(mockKuis);

      // Update
      const updated = { ...mockKuis, judul: 'Updated' };
      await dbManager.update('kuis', updated);

      // Verify update
      const afterUpdate = await dbManager.read<OfflineKuis>('kuis', mockKuis.id);
      expect(afterUpdate?.judul).toBe('Updated');

      // Delete
      await dbManager.delete('kuis', mockKuis.id);

      // Verify deletion
      const afterDelete = await dbManager.read('kuis', mockKuis.id);
      expect(afterDelete).toBeUndefined();
    });

    it('should handle multiple stores simultaneously', async () => {
      await Promise.all([
        dbManager.create('kuis', mockKuis),
        dbManager.create('nilai', mockNilai),
        dbManager.create('materi', mockMateri),
      ]);

      const [kuis, nilai, materi] = await Promise.all([
        dbManager.read<OfflineKuis>('kuis', mockKuis.id),
        dbManager.read<OfflineNilai>('nilai', mockNilai.id),
        dbManager.read<OfflineMateri>('materi', mockMateri.id),
      ]);

      expect(kuis).toEqual(mockKuis);
      expect(nilai).toEqual(mockNilai);
      expect(materi).toEqual(mockMateri);
    });

    it('should maintain data integrity across batch operations', async () => {
      const items: OfflineKuis[] = Array.from({ length: 10 }, (_, i) => ({
        ...mockKuis,
        id: `kuis-${i}`,
      }));

      await dbManager.batchCreate('kuis', items);

      const count = await dbManager.count('kuis');
      expect(count).toBe(10);

      await dbManager.batchDelete('kuis', items.slice(0, 5).map(i => i.id));

      const afterDelete = await dbManager.count('kuis');
      expect(afterDelete).toBe(5);

      const remaining = await dbManager.getAll<OfflineKuis>('kuis');
      expect(remaining.every(k => parseInt(k.id.split('-')[1]) >= 5)).toBe(true);
    });

    it('should handle large dataset operations', async () => {
      const largeDataset: OfflineKuis[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockKuis,
        id: `large-${i}`,
        kelas_id: `kelas-${i % 5}`,
      }));

      const result = await dbManager.batchCreate('kuis', largeDataset);
      expect(result.success).toBe(true);
      expect(result.count).toBe(100);

      const allItems = await dbManager.getAll<OfflineKuis>('kuis');
      expect(allItems).toHaveLength(100);

      const kelas1Items = await dbManager.getByIndex<OfflineKuis>(
        'kuis',
        'kelas_id',
        'kelas-1'
      );
      expect(kelas1Items).toHaveLength(20);
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        dbManager.create('kuis', { ...mockKuis, id: `concurrent-${i}` })
      );

      await Promise.all(operations);

      const count = await dbManager.count('kuis');
      expect(count).toBe(10);
    });
  });
});
