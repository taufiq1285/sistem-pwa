/**
 * Offline Data Schema Validation Tests
 *
 * Tests for offline data structures including:
 * - Sync operation enums
 * - Queue item validation
 * - Sync metadata
 * - Cached data
 * - Offline quiz data
 */

import { describe, it, expect } from "vitest";
import {
  SyncOperationSchema,
  SyncStatusSchema,
  SyncEntitySchema,
  OfflineQueueItemSchema,
  SyncMetadataSchema,
  CachedDataSchema,
  OfflineKuisSchema,
  OfflineKuisSoalSchema,
  OfflineKuisJawabanSchema,
  DatabaseMetadataSchema,
  validateOfflineQueue,
  safeValidateOfflineQueue,
  validateSyncMetadata,
  safeValidateSyncMetadata,
  validateCachedData,
  safeValidateCachedData,
  validateOfflineKuis,
  validateOfflineKuisSoal,
  validateOfflineKuisJawaban,
} from "@/lib/validations/offline-data.schema";

describe("Offline Data Schema Validation", () => {
  describe("SyncOperationSchema - Enum", () => {
    it('should accept "create" operation', () => {
      const result = SyncOperationSchema.safeParse("create");
      expect(result.success).toBe(true);
    });

    it('should accept "update" operation', () => {
      const result = SyncOperationSchema.safeParse("update");
      expect(result.success).toBe(true);
    });

    it('should accept "delete" operation', () => {
      const result = SyncOperationSchema.safeParse("delete");
      expect(result.success).toBe(true);
    });

    it("should reject invalid operation", () => {
      const result = SyncOperationSchema.safeParse("invalid");
      expect(result.success).toBe(false);
    });
  });

  describe("SyncStatusSchema - Enum", () => {
    it("should accept all valid statuses", () => {
      const statuses = ["pending", "syncing", "completed", "failed"];

      statuses.forEach((status) => {
        const result = SyncStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status", () => {
      const result = SyncStatusSchema.safeParse("error");
      expect(result.success).toBe(false);
    });
  });

  describe("SyncEntitySchema - Enum", () => {
    it("should accept all valid entities", () => {
      const entities = [
        "kuis",
        "kuis_soal",
        "kuis_jawaban",
        "nilai",
        "materi",
        "kelas",
        "user",
      ];

      entities.forEach((entity) => {
        const result = SyncEntitySchema.safeParse(entity);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid entity", () => {
      const result = SyncEntitySchema.safeParse("invalid_entity");
      expect(result.success).toBe(false);
    });
  });

  describe("OfflineQueueItemSchema - Valid Cases", () => {
    it("should accept valid queue item", () => {
      const data = {
        id: "queue-1",
        entity: "kuis",
        operation: "create",
        data: { title: "Test Quiz" },
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept queue item with error message", () => {
      const data = {
        id: "queue-1",
        entity: "nilai",
        operation: "update",
        data: { score: 85 },
        timestamp: Date.now(),
        status: "failed",
        retryCount: 3,
        error: "Network timeout",
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept retryCount of 0", () => {
      const data = {
        id: "queue-1",
        entity: "kelas",
        operation: "delete",
        data: {},
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept high retryCount", () => {
      const data = {
        id: "queue-1",
        entity: "materi",
        operation: "create",
        data: { content: "Material" },
        timestamp: Date.now(),
        status: "failed",
        retryCount: 99,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept complex nested data", () => {
      const data = {
        id: "queue-1",
        entity: "kuis_soal",
        operation: "create",
        data: {
          question: "What is...?",
          options: ["A", "B", "C", "D"],
          nested: { level: 2 },
        },
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("OfflineQueueItemSchema - Invalid Cases", () => {
    it("should reject negative retryCount", () => {
      const data = {
        id: "queue-1",
        entity: "kuis",
        operation: "create",
        data: {},
        timestamp: Date.now(),
        status: "pending",
        retryCount: -1,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid entity", () => {
      const data = {
        id: "queue-1",
        entity: "invalid",
        operation: "create",
        data: {},
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid operation", () => {
      const data = {
        id: "queue-1",
        entity: "kuis",
        operation: "invalid",
        data: {},
        timestamp: Date.now(),
        status: "pending",
        retryCount: 0,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const data = {
        id: "queue-1",
        entity: "kuis",
        operation: "create",
        data: {},
        timestamp: Date.now(),
        status: "invalid",
        retryCount: 0,
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const data = {
        id: "queue-1",
        entity: "kuis",
      };

      const result = OfflineQueueItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("SyncMetadataSchema - Valid Cases", () => {
    it("should accept valid sync metadata", () => {
      const data = {
        lastSyncTime: Date.now(),
        pendingChanges: 5,
        failedChanges: 2,
        nextSyncTime: Date.now() + 60000,
        syncEnabled: true,
      };

      const result = SyncMetadataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept metadata without nextSyncTime", () => {
      const data = {
        lastSyncTime: Date.now(),
        pendingChanges: 0,
        failedChanges: 0,
        syncEnabled: false,
      };

      const result = SyncMetadataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept zero pending and failed changes", () => {
      const data = {
        lastSyncTime: Date.now(),
        pendingChanges: 0,
        failedChanges: 0,
        syncEnabled: true,
      };

      const result = SyncMetadataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept high change counts", () => {
      const data = {
        lastSyncTime: Date.now(),
        pendingChanges: 1000,
        failedChanges: 100,
        syncEnabled: true,
      };

      const result = SyncMetadataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("SyncMetadataSchema - Invalid Cases", () => {
    it("should reject negative pendingChanges", () => {
      const data = {
        lastSyncTime: Date.now(),
        pendingChanges: -5,
        failedChanges: 0,
        syncEnabled: true,
      };

      const result = SyncMetadataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject negative failedChanges", () => {
      const data = {
        lastSyncTime: Date.now(),
        pendingChanges: 5,
        failedChanges: -2,
        syncEnabled: true,
      };

      const result = SyncMetadataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const data = {
        lastSyncTime: Date.now(),
      };

      const result = SyncMetadataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("CachedDataSchema - Valid Cases", () => {
    it("should accept valid cached data", () => {
      const data = {
        key: "user_123",
        data: { name: "John Doe", role: "mahasiswa" },
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000,
        version: 1,
      };

      const result = CachedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept cached data without expiresAt", () => {
      const data = {
        key: "kuis_456",
        data: { title: "Quiz Title" },
        timestamp: Date.now(),
      };

      const result = CachedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(1); // Default value
      }
    });

    it("should accept custom version number", () => {
      const data = {
        key: "nilai_789",
        data: { score: 85 },
        timestamp: Date.now(),
        version: 5,
      };

      const result = CachedDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept any data type", () => {
      const testCases = [
        { key: "test1", data: "string", timestamp: Date.now() },
        { key: "test2", data: 123, timestamp: Date.now() },
        { key: "test3", data: true, timestamp: Date.now() },
        { key: "test4", data: null, timestamp: Date.now() },
        { key: "test5", data: ["array"], timestamp: Date.now() },
      ];

      testCases.forEach((testCase) => {
        const result = CachedDataSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("CachedDataSchema - Invalid Cases", () => {
    it("should reject missing key", () => {
      const data = {
        data: { test: "data" },
        timestamp: Date.now(),
      };

      const result = CachedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing timestamp", () => {
      const data = {
        key: "test",
        data: { test: "data" },
      };

      const result = CachedDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("OfflineKuisSchema", () => {
    it("should accept valid offline kuis", () => {
      const data = {
        id: "kuis-1",
        judul: "Quiz Title",
        deskripsi: "Quiz description",
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        tipe_kuis: "kuis",
        waktu_mulai: "2024-01-01T08:00:00Z",
        waktu_selesai: "2024-01-01T09:00:00Z",
        durasi_menit: 60,
        passing_grade: 60,
        is_published: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T01:00:00Z",
        _offline_created: false,
        _offline_updated: true,
        _last_synced: Date.now(),
      };

      const result = OfflineKuisSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept all tipe_kuis options", () => {
      const types = ["kuis", "uts", "uas"];

      types.forEach((tipe) => {
        const data = {
          id: "kuis-1",
          judul: "Test",
          deskripsi: null,
          kelas_id: "kelas-1",
          dosen_id: "dosen-1",
          tipe_kuis: tipe,
          waktu_mulai: "2024-01-01T08:00:00Z",
          waktu_selesai: "2024-01-01T09:00:00Z",
          durasi_menit: null,
          passing_grade: 60,
          is_published: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        };

        const result = OfflineKuisSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should accept null optional fields", () => {
      const data = {
        id: "kuis-1",
        judul: "Test",
        deskripsi: null,
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        tipe_kuis: "kuis",
        waktu_mulai: "2024-01-01T08:00:00Z",
        waktu_selesai: "2024-01-01T09:00:00Z",
        durasi_menit: null,
        passing_grade: 60,
        is_published: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const result = OfflineKuisSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("OfflineKuisSoalSchema", () => {
    it("should accept valid offline soal", () => {
      const data = {
        id: "soal-1",
        kuis_id: "kuis-1",
        nomor_soal: 1,
        tipe_soal: "pilihan_ganda",
        pertanyaan: "What is the answer?",
        poin: 10,
        pilihan_jawaban: { a: "Option A", b: "Option B" },
        jawaban_benar: "a",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
        _offline_created: true,
      };

      const result = OfflineKuisSoalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept all tipe_soal options", () => {
      const types = ["pilihan_ganda", "esai", "isian_singkat"];

      types.forEach((tipe) => {
        const data = {
          id: "soal-1",
          kuis_id: "kuis-1",
          nomor_soal: 1,
          tipe_soal: tipe,
          pertanyaan: "Question",
          poin: 5,
          pilihan_jawaban: null,
          jawaban_benar: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        };

        const result = OfflineKuisSoalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("OfflineKuisJawabanSchema", () => {
    it("should accept valid offline jawaban", () => {
      const data = {
        id: "jawaban-1",
        kuis_id: "kuis-1",
        soal_id: "soal-1",
        mahasiswa_id: "mhs-1",
        jawaban: "a",
        poin_diperoleh: 10,
        is_correct: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
        _offline_created: true,
        _offline_updated: false,
        _last_synced: Date.now(),
      };

      const result = OfflineKuisJawabanSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept null scoring fields", () => {
      const data = {
        id: "jawaban-1",
        kuis_id: "kuis-1",
        soal_id: "soal-1",
        mahasiswa_id: "mhs-1",
        jawaban: null,
        poin_diperoleh: null,
        is_correct: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: null,
      };

      const result = OfflineKuisJawabanSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("DatabaseMetadataSchema", () => {
    it("should accept valid metadata", () => {
      const data = {
        key: "version",
        value: "1.0.0",
        updated_at: Date.now(),
      };

      const result = DatabaseMetadataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept any value type", () => {
      const testCases = [
        { key: "string", value: "text", updated_at: Date.now() },
        { key: "number", value: 123, updated_at: Date.now() },
        { key: "boolean", value: true, updated_at: Date.now() },
        { key: "object", value: { nested: "data" }, updated_at: Date.now() },
      ];

      testCases.forEach((testCase) => {
        const result = DatabaseMetadataSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Validation Helper Functions", () => {
    describe("validateOfflineQueue", () => {
      it("should validate correct queue item", () => {
        const data = {
          id: "queue-1",
          entity: "kuis",
          operation: "create",
          data: {},
          timestamp: Date.now(),
          status: "pending",
          retryCount: 0,
        };

        expect(() => validateOfflineQueue(data)).not.toThrow();
      });

      it("should throw on invalid queue item", () => {
        const data = {
          id: "queue-1",
          entity: "invalid",
        };

        expect(() => validateOfflineQueue(data)).toThrow();
      });
    });

    describe("safeValidateOfflineQueue", () => {
      it("should return success for valid data", () => {
        const data = {
          id: "queue-1",
          entity: "nilai",
          operation: "update",
          data: {},
          timestamp: Date.now(),
          status: "completed",
          retryCount: 1,
        };

        const result = safeValidateOfflineQueue(data);
        expect(result.success).toBe(true);
      });

      it("should return error for invalid data", () => {
        const data = {
          id: "queue-1",
        };

        const result = safeValidateOfflineQueue(data);
        expect(result.success).toBe(false);
      });
    });

    describe("validateSyncMetadata", () => {
      it("should validate correct metadata", () => {
        const data = {
          lastSyncTime: Date.now(),
          pendingChanges: 5,
          failedChanges: 2,
          syncEnabled: true,
        };

        expect(() => validateSyncMetadata(data)).not.toThrow();
      });

      it("should throw on invalid metadata", () => {
        const data = {
          lastSyncTime: Date.now(),
        };

        expect(() => validateSyncMetadata(data)).toThrow();
      });
    });

    describe("safeValidateSyncMetadata", () => {
      it("should return success for valid metadata", () => {
        const data = {
          lastSyncTime: Date.now(),
          pendingChanges: 0,
          failedChanges: 0,
          syncEnabled: false,
        };

        const result = safeValidateSyncMetadata(data);
        expect(result.success).toBe(true);
      });
    });

    describe("validateCachedData", () => {
      it("should validate correct cached data", () => {
        const data = {
          key: "test",
          data: { value: 123 },
          timestamp: Date.now(),
        };

        expect(() => validateCachedData(data)).not.toThrow();
      });

      it("should throw on invalid cached data", () => {
        const data = {
          key: "test",
        };

        expect(() => validateCachedData(data)).toThrow();
      });
    });

    describe("safeValidateCachedData", () => {
      it("should return success for valid cached data", () => {
        const data = {
          key: "test",
          data: null,
          timestamp: Date.now(),
        };

        const result = safeValidateCachedData(data);
        expect(result.success).toBe(true);
      });
    });

    describe("validateOfflineKuis", () => {
      it("should validate correct offline kuis", () => {
        const data = {
          id: "kuis-1",
          judul: "Test",
          deskripsi: null,
          kelas_id: "kelas-1",
          dosen_id: "dosen-1",
          tipe_kuis: "kuis",
          waktu_mulai: "2024-01-01T08:00:00Z",
          waktu_selesai: "2024-01-01T09:00:00Z",
          durasi_menit: null,
          passing_grade: 60,
          is_published: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        };

        expect(() => validateOfflineKuis(data)).not.toThrow();
      });
    });

    describe("validateOfflineKuisSoal", () => {
      it("should validate correct offline soal", () => {
        const data = {
          id: "soal-1",
          kuis_id: "kuis-1",
          nomor_soal: 1,
          tipe_soal: "esai",
          pertanyaan: "Question",
          poin: 10,
          pilihan_jawaban: null,
          jawaban_benar: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        };

        expect(() => validateOfflineKuisSoal(data)).not.toThrow();
      });
    });

    describe("validateOfflineKuisJawaban", () => {
      it("should validate correct offline jawaban", () => {
        const data = {
          id: "jawaban-1",
          kuis_id: "kuis-1",
          soal_id: "soal-1",
          mahasiswa_id: "mhs-1",
          jawaban: "answer",
          poin_diperoleh: 8,
          is_correct: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: null,
        };

        expect(() => validateOfflineKuisJawaban(data)).not.toThrow();
      });
    });
  });
});
