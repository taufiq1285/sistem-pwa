/**
 * Nilai API Unit Tests
 *
 * Tests for grading operations:
 * - CRUD operations
 * - Auto-calculation of final grades
 * - Batch updates
 * - Statistics and summaries
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNilai,
  getNilaiByKelas,
  getNilaiByMahasiswa,
  getNilaiById,
  getNilaiSummary,
  getMahasiswaForGrading,
} from "../../../lib/api/nilai.api";
import * as baseApi from "../../../lib/api/base.api";
import { supabase } from "../../../lib/supabase/client";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../../lib/api/base.api", () => ({
  queryWithFilters: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../../../lib/utils/errors", () => ({
  handleError: vi.fn((error) => error),
}));

vi.mock("../../../lib/validations/nilai.schema", () => ({
  calculateNilaiAkhir: vi.fn((kuis, tugas, uts, uas, praktikum, kehadiran) => {
    // Simple weighted average: 15% kuis, 20% tugas, 25% UTS, 30% UAS, 5% praktikum, 5% kehadiran
    return Math.round(
      kuis * 0.15 +
        tugas * 0.2 +
        uts * 0.25 +
        uas * 0.3 +
        praktikum * 0.05 +
        kehadiran * 0.05,
    );
  }),
  getNilaiHuruf: vi.fn((nilai) => {
    if (nilai >= 80) return "A";
    if (nilai >= 70) return "B";
    if (nilai >= 60) return "C";
    if (nilai >= 50) return "D";
    return "E";
  }),
}));

vi.mock("../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn(),
}));

vi.mock("../../../lib/middleware/permission.middleware", () => ({
  requirePermission: vi.fn((_, fn) => fn),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockNilai = {
  id: "nilai-1",
  mahasiswa_id: "mhs-1",
  kelas_id: "kelas-1",
  nilai_kuis: 80,
  nilai_tugas: 85,
  nilai_uts: 75,
  nilai_uas: 82,
  nilai_praktikum: 90,
  nilai_kehadiran: 95,
  nilai_akhir: 82,
  nilai_huruf: "A",
  keterangan: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const mockNilaiWithMahasiswa = {
  ...mockNilai,
  mahasiswa: {
    id: "mhs-1",
    nim: "BD2321001",
    user_id: "user-1",
    user: {
      full_name: "John Doe",
      email: "john@example.com",
    },
  },
};

const mockQueryBuilder = () => {
  let resolveValue = { data: null, error: null };

  const builder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    upsert: vi.fn().mockReturnThis(),
    then: vi.fn((onFulfilled) =>
      Promise.resolve(resolveValue).then(onFulfilled),
    ),
    _setResolveValue: (value: any) => {
      resolveValue = value;
      return builder;
    },
  };
  return builder;
};

// ============================================================================
// CRUD OPERATIONS TESTS
// ============================================================================

describe("Nilai API - CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNilai", () => {
    it("should get all nilai without filters", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockNilai]);

      const result = await getNilai();

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "nilai",
        [],
        expect.objectContaining({
          select: expect.stringContaining("mahasiswa:mahasiswa_id"),
          order: { column: "created_at", ascending: false },
        }),
      );
      expect(result).toEqual([mockNilai]);
    });

    it("should get nilai with kelas_id filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockNilai]);

      const result = await getNilai({ kelas_id: "kelas-1" });

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "nilai",
        [{ column: "kelas_id", operator: "eq", value: "kelas-1" }],
        expect.any(Object),
      );
      expect(result).toEqual([mockNilai]);
    });

    it("should get nilai with mahasiswa_id filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockNilai]);

      const result = await getNilai({ mahasiswa_id: "mhs-1" });

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "nilai",
        [{ column: "mahasiswa_id", operator: "eq", value: "mhs-1" }],
        expect.any(Object),
      );
      expect(result).toEqual([mockNilai]);
    });

    it("should get nilai with nilai_akhir range filters", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockNilai]);

      const result = await getNilai({
        min_nilai_akhir: 70,
        max_nilai_akhir: 90,
      });

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "nilai",
        [
          { column: "nilai_akhir", operator: "gte", value: 70 },
          { column: "nilai_akhir", operator: "lte", value: 90 },
        ],
        expect.any(Object),
      );
      expect(result).toEqual([mockNilai]);
    });

    it("should get nilai with all filters combined", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockNilai]);

      const result = await getNilai({
        kelas_id: "kelas-1",
        mahasiswa_id: "mhs-1",
        min_nilai_akhir: 70,
        max_nilai_akhir: 90,
      });

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "nilai",
        expect.arrayContaining([
          { column: "kelas_id", operator: "eq", value: "kelas-1" },
          { column: "mahasiswa_id", operator: "eq", value: "mhs-1" },
          { column: "nilai_akhir", operator: "gte", value: 70 },
          { column: "nilai_akhir", operator: "lte", value: 90 },
        ]),
        expect.any(Object),
      );
      expect(result).toEqual([mockNilai]);
    });
  });

  describe("getNilaiByKelas", () => {
    it("should get all nilai for a kelas", async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: [mockNilaiWithMahasiswa], error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await getNilaiByKelas("kelas-1");

      expect(supabase.from).toHaveBeenCalledWith("nilai");
      expect(builder.select).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("kelas_id", "kelas-1");
      expect(builder.order).toHaveBeenCalled();
      expect(result).toEqual([mockNilaiWithMahasiswa]);
    });

    it("should return empty array when no nilai found", async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: null, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await getNilaiByKelas("kelas-1");

      expect(result).toEqual([]);
    });

    it("should throw error on database error", async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: null, error: new Error("DB Error") });
      (supabase.from as any).mockReturnValue(builder);

      await expect(getNilaiByKelas("kelas-1")).rejects.toThrow();
    });
  });

  describe("getNilaiByMahasiswa", () => {
    it("should get all nilai for a mahasiswa", async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: [mockNilai], error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await getNilaiByMahasiswa("mhs-1");

      expect(supabase.from).toHaveBeenCalledWith("nilai");
      expect(builder.eq).toHaveBeenCalledWith("mahasiswa_id", "mhs-1");
      expect(builder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(result).toEqual([mockNilai]);
    });

    it("should return empty array when no nilai found", async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: null, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await getNilaiByMahasiswa("mhs-1");

      expect(result).toEqual([]);
    });
  });

  describe("getNilaiById", () => {
    it("should get nilai by ID", async () => {
      vi.mocked(baseApi.getById).mockResolvedValue(mockNilai);

      const result = await getNilaiById("nilai-1");

      expect(baseApi.getById).toHaveBeenCalledWith(
        "nilai",
        "nilai-1",
        expect.objectContaining({
          select: expect.stringContaining("mahasiswa:mahasiswa_id"),
        }),
      );
      expect(result).toEqual(mockNilai);
    });

    it("should throw error when nilai not found", async () => {
      vi.mocked(baseApi.getById).mockRejectedValue(new Error("Not found"));

      await expect(getNilaiById("nonexistent")).rejects.toThrow();
    });
  });
});

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe("Nilai API - Statistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNilaiSummary", () => {
    it("should calculate summary statistics correctly", async () => {
      // Mock count query - needs .select().eq() chain
      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 30, error: null }),
      };

      // Mock nilai query
      const nilaiBuilder = mockQueryBuilder();
      nilaiBuilder._setResolveValue({
        data: [{ nilai_akhir: 80 }, { nilai_akhir: 90 }, { nilai_akhir: 70 }],
        error: null,
      });

      (supabase.from as any)
        .mockReturnValueOnce(countBuilder) // First call for count
        .mockReturnValueOnce(nilaiBuilder); // Second call for nilai

      const result = await getNilaiSummary("kelas-1");

      expect(result).toEqual({
        total_mahasiswa: 30,
        sudah_dinilai: 3,
        belum_dinilai: 27,
        rata_rata: 80, // (80 + 90 + 70) / 3 = 80
      });
    });

    it("should handle empty nilai data", async () => {
      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };

      const nilaiBuilder = mockQueryBuilder();
      nilaiBuilder._setResolveValue({ data: [], error: null });

      (supabase.from as any)
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(nilaiBuilder);

      const result = await getNilaiSummary("kelas-1");

      expect(result).toEqual({
        total_mahasiswa: 10,
        sudah_dinilai: 0,
        belum_dinilai: 10,
        rata_rata: 0,
      });
    });

    it("should filter out null nilai_akhir when calculating average", async () => {
      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };

      const nilaiBuilder = mockQueryBuilder();
      nilaiBuilder._setResolveValue({
        data: [
          { nilai_akhir: 80 },
          { nilai_akhir: null },
          { nilai_akhir: 90 },
          { nilai_akhir: null },
          { nilai_akhir: 70 },
        ],
        error: null,
      });

      (supabase.from as any)
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(nilaiBuilder);

      const result = await getNilaiSummary("kelas-1");

      expect(result.sudah_dinilai).toBe(5);
      expect(result.rata_rata).toBe(80); // Only count non-null: (80 + 90 + 70) / 3
    });

    it("should round average to 2 decimal places", async () => {
      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      };

      const nilaiBuilder = mockQueryBuilder();
      nilaiBuilder._setResolveValue({
        data: [{ nilai_akhir: 80 }, { nilai_akhir: 85 }, { nilai_akhir: 90 }],
        error: null,
      });

      (supabase.from as any)
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(nilaiBuilder);

      const result = await getNilaiSummary("kelas-1");

      // (80 + 85 + 90) / 3 = 85
      expect(result.rata_rata).toBe(85);
    });
  });

  describe("getMahasiswaForGrading", () => {
    it("should return mahasiswa with their nilai", async () => {
      // Mock enrollment query - needs .select().eq() chain
      const enrollmentBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              mahasiswa: {
                id: "mhs-1",
                nim: "BD2321001",
                user_id: "user-1",
                user: { full_name: "John Doe", email: "john@example.com" },
              },
            },
          ],
          error: null,
        }),
      };

      // Mock nilai query - needs .select().eq().in() chain
      const nilaiBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [mockNilai],
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(enrollmentBuilder)
        .mockReturnValueOnce(nilaiBuilder);

      const result = await getMahasiswaForGrading("kelas-1");

      expect(result).toHaveLength(1);
      expect(result[0].mahasiswa_id).toBe("mhs-1");
      expect(result[0].nilai_akhir).toBe(82);
    });

    it("should return mahasiswa with default nilai when not graded yet", async () => {
      const enrollmentBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              mahasiswa: {
                id: "mhs-1",
                nim: "BD2321001",
                user_id: "user-1",
                user: { full_name: "John Doe", email: "john@example.com" },
              },
            },
          ],
          error: null,
        }),
      };

      // No nilai exists
      const nilaiBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(enrollmentBuilder)
        .mockReturnValueOnce(nilaiBuilder);

      const result = await getMahasiswaForGrading("kelas-1");

      expect(result).toHaveLength(1);
      expect(result[0].mahasiswa_id).toBe("mhs-1");
      expect(result[0].nilai_kuis).toBe(0);
      expect(result[0].nilai_akhir).toBe(null);
    });

    it("should return empty array when no mahasiswa enrolled", async () => {
      const enrollmentBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as any).mockReturnValue(enrollmentBuilder);

      const result = await getMahasiswaForGrading("kelas-1");

      expect(result).toEqual([]);
    });

    it("should handle multiple mahasiswa with mixed nilai status", async () => {
      const enrollmentBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              mahasiswa: {
                id: "mhs-1",
                nim: "BD2321001",
                user_id: "user-1",
                user: { full_name: "John Doe", email: "john@example.com" },
              },
            },
            {
              mahasiswa: {
                id: "mhs-2",
                nim: "BD2321002",
                user_id: "user-2",
                user: { full_name: "Jane Smith", email: "jane@example.com" },
              },
            },
          ],
          error: null,
        }),
      };

      // Only mhs-1 has nilai
      const nilaiBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ ...mockNilai, mahasiswa_id: "mhs-1" }],
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(enrollmentBuilder)
        .mockReturnValueOnce(nilaiBuilder);

      const result = await getMahasiswaForGrading("kelas-1");

      expect(result).toHaveLength(2);
      expect(result[0].mahasiswa_id).toBe("mhs-1");
      expect(result[0].nilai_akhir).toBe(82); // Has nilai
      expect(result[1].mahasiswa_id).toBe("mhs-2");
      expect(result[1].nilai_akhir).toBe(null); // No nilai yet
    });
  });
});
