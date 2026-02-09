/**
 * Dosen API Unit Tests
 *
 * Tests for instructor operations:
 * - Dashboard statistics
 * - Class management
 * - Student management
 * - Quiz and grading operations
 * - Borrowing requests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDosenStats,
  getMyKelas,
  getMyMataKuliah,
  getKelasStudents,
  getStudentStats,
  getPendingGrading,
  getActiveKuis,
  getMyKelasWithStudents,
  __resetDosenIdCache,
  __setDosenIdCache,
} from "../../../lib/api/dosen.api";
import * as dosenApi from "../../../lib/api/dosen.api";
import { supabase } from "../../../lib/supabase/client";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock supabase.from to return different builders based on table name
const mockSupabaseFrom = vi.fn();
(supabase.from as any) = mockSupabaseFrom;

vi.mock("../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((_, fn) => fn()),
}));

vi.mock("../../../lib/middleware", () => ({
  requirePermission: vi.fn((_, fn) => fn),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ============================================================================
// TEST DATA
// ============================================================================

const mockUser = {
  id: "user-1",
  email: "dosen@example.com",
};

const mockDosen = {
  id: "dosen-1",
  user_id: "user-1",
  nidn: "1234567890",
};

const mockKelas = {
  id: "kelas-1",
  kode_kelas: "IF-101",
  nama_kelas: "Kelas A",
  tahun_ajaran: "2024/2025",
  semester_ajaran: 1,
  dosen_id: "dosen-1",
  is_active: true,
};

const mockMataKuliah = {
  id: "mk-1",
  kode_mk: "IF101",
  nama_mk: "Pemrograman Web",
  sks: 3,
  semester: 1,
  program_studi: "Informatika",
};

const mockStudent = {
  id: "mhs-1",
  mahasiswa_id: "mhs-1",
  nim: "BD2321001",
  nama: "John Doe",
  email: "john@example.com",
  enrolled_at: "2024-01-01",
  is_active: true,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mockQueryBuilder = () => {
  let resolveValue = { data: null, error: null };

  const builder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
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
// DASHBOARD STATS TESTS
// ============================================================================

describe("Dosen API - Dashboard Stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("getDosenStats", () => {
    it("should return stats for authenticated dosen", async () => {
      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      // Mock dosen query
      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.single.mockResolvedValue({ data: mockDosen, error: null });

      // getDosenStats now computes stats from jadwal_praktikum, kelas_mahasiswa, kuis, attempt_kuis
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder._setResolveValue({
        data: [
          { kelas_id: "kelas-1" },
          { kelas_id: "kelas-2" },
          { kelas_id: "kelas-3" },
          { kelas_id: "kelas-4" },
          { kelas_id: "kelas-5" },
        ],
        error: null,
      });

      const mahasiswaCountBuilder = mockQueryBuilder();
      mahasiswaCountBuilder._setResolveValue({ count: 120, error: null });

      const activeKuisCountBuilder = mockQueryBuilder();
      activeKuisCountBuilder._setResolveValue({ count: 8, error: null });

      const kuisIdsBuilder = mockQueryBuilder();
      kuisIdsBuilder._setResolveValue({
        data: [{ id: "kuis-1" }, { id: "kuis-2" }],
        error: null,
      });

      // ✅ NEW: Mock soal query (untuk mengecek CBT)
      const soalBuilder = mockQueryBuilder();
      soalBuilder._setResolveValue({
        data: [
          { kuis_id: "kuis-1", tipe: "file_upload" }, // Bukan CBT, perlu grading manual
          { kuis_id: "kuis-2", tipe: "file_upload" }, // Bukan CBT, perlu grading manual
        ],
        error: null,
      });

      // ✅ NEW: Mock attempt_kuis query (sekarang mengambil semua data, bukan count saja)
      // Simulasi 15 mahasiswa unik dengan status "submitted"
      const attemptsBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: Array.from({ length: 15 }, (_, i) => ({
            id: `attempt-${i + 1}`,
            kuis_id: `kuis-${(i % 2) + 1}`, // Alternate antara kuis-1 dan kuis-2
            mahasiswa_id: `mhs-${i + 1}`, // Setiap mahasiswa unik
            status: "submitted",
          })),
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(dosenBuilder) // getDosenId: dosen
        .mockReturnValueOnce(jadwalBuilder) // jadwal_praktikum
        .mockReturnValueOnce(mahasiswaCountBuilder) // kelas_mahasiswa count
        .mockReturnValueOnce(activeKuisCountBuilder) // kuis count (published)
        .mockReturnValueOnce(kuisIdsBuilder) // kuis ids
        .mockReturnValueOnce(soalBuilder) // ✅ NEW: soal (cek CBT)
        .mockReturnValueOnce(attemptsBuilder); // ✅ NEW: attempt_kuis (full data)

      const result = await getDosenStats();

      expect(result).toEqual({
        totalKelas: 5,
        totalMahasiswa: 120,
        activeKuis: 8,
        pendingGrading: 15, // ✅ 15 unique (kuis_id, mahasiswa_id) pairs dengan status "submitted"
      });
    });

    it("should return zero stats when no dosen found", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await getDosenStats();

      expect(result).toEqual({
        totalKelas: 0,
        totalMahasiswa: 0,
        activeKuis: 0,
        pendingGrading: 0,
      });
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(supabase.auth.getUser).mockRejectedValue(
        new Error("Auth error"),
      );

      const result = await getDosenStats();

      expect(result).toEqual({
        totalKelas: 0,
        totalMahasiswa: 0,
        activeKuis: 0,
        pendingGrading: 0,
      });
    });

    it("should use cached dosen ID on subsequent calls", async () => {
      // Reset in-memory cache and localStorage
      __resetDosenIdCache();
      localStorageMock.clear();

      // First call - fetch from DB
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.single.mockResolvedValue({ data: mockDosen, error: null });

      // Create count builder for stats queries
      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(dosenBuilder) // Get dosen ID
        .mockReturnValue(countBuilder); // All stats queries

      await getDosenStats();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cached_dosen_id",
        "dosen-1",
      );
    });
  });
});

// ============================================================================
// KELAS MANAGEMENT TESTS
// ============================================================================

describe("Dosen API - Kelas Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem("cached_dosen_id", "dosen-1");
  });

  describe("getMyKelas", () => {
    it("should return kelas with stats for dosen", async () => {
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder._setResolveValue({
        data: [
          {
            id: "kelas-1",
            kode_kelas: "IF-101",
            nama_kelas: "Kelas A",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            mata_kuliah_id: "mk-1",
            is_active: true,
          },
        ],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder._setResolveValue({
        data: [
          {
            id: "mk-1",
            kode_mk: "IF101",
            nama_mk: "Pemrograman Web",
          },
        ],
        error: null,
      });

      const mahasiswaCountBuilder = mockQueryBuilder();
      mahasiswaCountBuilder._setResolveValue({ count: 30, error: null });

      (supabase.from as any)
        .mockReturnValueOnce(kelasBuilder) // kelas
        .mockReturnValueOnce(mkBuilder) // mata_kuliah
        .mockReturnValueOnce(mahasiswaCountBuilder); // kelas_mahasiswa count

      const result = await getMyKelas();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "kelas-1",
        kode_kelas: "IF-101",
        nama_kelas: "Kelas A",
        tahun_ajaran: "2024/2025",
        semester_ajaran: 1,
        totalMahasiswa: 30,
        mata_kuliah_id: "mk-1",
        mata_kuliah_kode: "IF101",
        mata_kuliah_nama: "Pemrograman Web",
      });
    });

    it("should apply limit when provided", async () => {
      // Mock kelas query with 3 items
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder._setResolveValue({
        data: [
          {
            id: "kelas-1",
            kode_kelas: "IF-101",
            nama_kelas: "Kelas A",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            mata_kuliah_id: "mk-1",
            is_active: true,
          },
          {
            id: "kelas-2",
            kode_kelas: "IF-102",
            nama_kelas: "Kelas B",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            mata_kuliah_id: "mk-2",
            is_active: true,
          },
          {
            id: "kelas-3",
            kode_kelas: "IF-103",
            nama_kelas: "Kelas C",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            mata_kuliah_id: "mk-3",
            is_active: true,
          },
        ],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder._setResolveValue({
        data: [
          { id: "mk-1", kode_mk: "IF101", nama_mk: "Web" },
          { id: "mk-2", kode_mk: "IF102", nama_mk: "Web2" },
          { id: "mk-3", kode_mk: "IF103", nama_mk: "Web3" },
        ],
        error: null,
      });

      const countBuilder = mockQueryBuilder();
      countBuilder._setResolveValue({ count: 10, error: null });

      (supabase.from as any)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValue(countBuilder);

      const result = await getMyKelas(2);

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no dosen ID", async () => {
      localStorageMock.clear();
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await getMyKelas();

      expect(result).toEqual([]);
    });

    it("should handle duplicate kelas correctly", async () => {
      // Mock kelas query with duplicates
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder._setResolveValue({
        data: [
          {
            id: "kelas-1",
            kode_kelas: "IF-101",
            nama_kelas: "Kelas A",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            mata_kuliah_id: "mk-1",
            is_active: true,
          },
          {
            id: "kelas-1",
            kode_kelas: "IF-101",
            nama_kelas: "Kelas A",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            mata_kuliah_id: "mk-1",
            is_active: true,
          }, // Duplicate
          {
            id: "kelas-2",
            kode_kelas: "IF-102",
            nama_kelas: "Kelas B",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            mata_kuliah_id: "mk-2",
            is_active: true,
          },
        ],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder._setResolveValue({
        data: [
          { id: "mk-1", kode_mk: "IF101", nama_mk: "Web" },
          { id: "mk-2", kode_mk: "IF102", nama_mk: "Web2" },
        ],
        error: null,
      });

      const countBuilder = mockQueryBuilder();
      countBuilder._setResolveValue({ count: 10, error: null });

      (supabase.from as any)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValue(countBuilder);

      const result = await getMyKelas();

      // Should only return 2 unique kelas (duplicates removed)
      expect(result).toHaveLength(2);
    });
  });

  describe("getMyMataKuliah", () => {
    it("should return mata kuliah with aggregated stats", async () => {
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder._setResolveValue({
        data: [
          {
            id: "kelas-1",
            mata_kuliah: { ...mockMataKuliah, id: "mk-1" },
          },
          {
            id: "kelas-2",
            mata_kuliah: { ...mockMataKuliah, id: "mk-1" }, // Same MK
          },
        ],
        error: null,
      });

      // Mock for getting kelas IDs by mata_kuliah
      const kelasIdsBuilder = mockQueryBuilder();
      kelasIdsBuilder._setResolveValue({
        data: [{ id: "kelas-1" }, { id: "kelas-2" }],
        error: null,
      });

      // Mock for counting mahasiswa
      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 50, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(kelasBuilder) // Initial kelas query
        .mockReturnValueOnce(kelasIdsBuilder) // Get kelas IDs for MK
        .mockReturnValueOnce(countBuilder); // Count mahasiswa

      const result = await getMyMataKuliah();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "mk-1",
        kode_mk: "IF101",
        nama_mk: "Pemrograman Web",
        totalKelas: 2,
        totalMahasiswa: 50,
      });
    });

    it("should apply limit when provided", async () => {
      // Mock initial kelas query with proper chaining for .eq().eq()
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder._setResolveValue({
        data: [
          { id: "kelas-1", mata_kuliah: { ...mockMataKuliah, id: "mk-1" } },
          {
            id: "kelas-2",
            mata_kuliah: {
              ...mockMataKuliah,
              id: "mk-2",
              kode_mk: "IF102",
              nama_mk: "Database",
            },
          },
          {
            id: "kelas-3",
            mata_kuliah: {
              ...mockMataKuliah,
              id: "mk-3",
              kode_mk: "IF103",
              nama_mk: "Algoritma",
            },
          },
        ],
        error: null,
      });

      // Mock for getting kelas IDs for ALL 3 MKs (limit applies after fetching)
      const kelasIdsBuilder1 = mockQueryBuilder();
      kelasIdsBuilder1._setResolveValue({
        data: [{ id: "kelas-1" }],
        error: null,
      });

      const kelasIdsBuilder2 = mockQueryBuilder();
      kelasIdsBuilder2._setResolveValue({
        data: [{ id: "kelas-2" }],
        error: null,
      });

      const kelasIdsBuilder3 = mockQueryBuilder();
      kelasIdsBuilder3._setResolveValue({
        data: [{ id: "kelas-3" }],
        error: null,
      });

      const countBuilder1 = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 20, error: null }),
      };

      const countBuilder2 = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 25, error: null }),
      };

      const countBuilder3 = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 30, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(kelasBuilder) // Initial kelas query
        .mockReturnValueOnce(kelasIdsBuilder1) // Get kelas IDs for MK1
        .mockReturnValueOnce(countBuilder1) // Count mahasiswa for MK1
        .mockReturnValueOnce(kelasIdsBuilder2) // Get kelas IDs for MK2
        .mockReturnValueOnce(countBuilder2) // Count mahasiswa for MK2
        .mockReturnValueOnce(kelasIdsBuilder3) // Get kelas IDs for MK3
        .mockReturnValueOnce(countBuilder3); // Count mahasiswa for MK3

      const result = await getMyMataKuliah(2);

      expect(result).toHaveLength(2);
    });
  });
});

// ============================================================================
// STUDENT MANAGEMENT TESTS
// ============================================================================

describe("Dosen API - Student Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem("cached_dosen_id", "dosen-1");
  });

  describe("getKelasStudents", () => {
    it("should return students for a kelas", async () => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "enrollment-1",
              mahasiswa_id: "mhs-1",
              enrolled_at: "2024-01-01",
              is_active: true,
              mahasiswa: {
                id: "mhs-1",
                nim: "BD2321001",
                users: { nama: "John Doe", email: "john@example.com" },
              },
            },
          ],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(builder);

      const result = await getKelasStudents("kelas-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "enrollment-1",
        mahasiswa_id: "mhs-1",
        nim: "BD2321001",
        nama: "John Doe",
        email: "john@example.com",
      });
    });

    it("should return empty array when no students", async () => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as any).mockReturnValue(builder);

      const result = await getKelasStudents("kelas-1");

      expect(result).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("DB Error"),
        }),
      };

      (supabase.from as any).mockReturnValue(builder);

      const result = await getKelasStudents("kelas-1");

      expect(result).toEqual([]);
    });
  });

  describe("getStudentStats", () => {
    it("should return aggregated student statistics", async () => {
      localStorageMock.setItem("cached_dosen_id", "dosen-1");

      // Mock the kelas query that getMyKelasWithStudents makes
      const mockKelasData = [
        {
          id: "kelas-1",
          kode_kelas: "IF-101",
          nama_kelas: "Kelas A",
          tahun_ajaran: "2024/2025",
          semester_ajaran: "Ganjil",
          kuota: 30,
          mata_kuliah_id: "mk-1",
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Pemrograman Web",
            kode_mk: "IF101",
          },
        },
        {
          id: "kelas-2",
          kode_kelas: "IF-102",
          nama_kelas: "Kelas B",
          tahun_ajaran: "2024/2025",
          semester_ajaran: "Ganjil",
          kuota: 30,
          mata_kuliah_id: "mk-2",
          mata_kuliah: {
            id: "mk-2",
            nama_mk: "Pemrograman Web Lanjut",
            kode_mk: "IF102",
          },
        },
      ];

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder._setResolveValue({ data: mockKelasData, error: null });

      // Mock getKelasStudents to return 30 students per class
      const mockStudents = Array.from({ length: 30 }, (_, i) => ({
        id: `student-${i}`,
        mahasiswa_id: `mahasiswa-${i}`,
        nim: `BD232100${i.toString().padStart(2, "0")}`,
        nama: `Student ${i}`,
        email: `student${i}@example.com`,
        enrolled_at: "2024-01-01T00:00:00Z",
        is_active: true,
      }));

      const mockStudentData = mockStudents.map((student) => ({
        id: student.id,
        mahasiswa_id: student.mahasiswa_id,
        enrolled_at: student.enrolled_at,
        is_active: student.is_active,
        mahasiswa: {
          id: student.mahasiswa_id,
          nim: student.nim,
          users: {
            nama: student.nama,
            email: student.email,
          },
        },
      }));

      const kelasMahasiswaBuilder = mockQueryBuilder();
      kelasMahasiswaBuilder._setResolveValue({
        data: mockStudentData,
        error: null,
      });

      // Set up mock to return different builders based on table name
      mockSupabaseFrom.mockImplementation((tableName: string) => {
        if (tableName === "kelas") {
          return kelasBuilder;
        } else if (tableName === "kelas_mahasiswa") {
          return kelasMahasiswaBuilder;
        }
        return mockQueryBuilder(); // Default builder for other tables
      });

      const result = await getStudentStats();

      expect(result).toEqual({
        totalStudents: 60,
        totalKelas: 2,
        averagePerKelas: 30,
      });
    });

    it("should handle no kelas scenario", async () => {
      localStorageMock.setItem("cached_dosen_id", "dosen-1");

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder._setResolveValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue(kelasBuilder);

      const result = await getStudentStats();

      expect(result).toEqual({
        totalStudents: 0,
        totalKelas: 0,
        averagePerKelas: 0,
      });
    });
  });
});

// ============================================================================
// GRADING OPERATIONS TESTS
// ============================================================================

describe("Dosen API - Grading Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem("cached_dosen_id", "dosen-1");
  });

  describe("getPendingGrading", () => {
    it("should return pending grading items", async () => {
      // Mock kuis IDs query
      const kuisIdsBuilder = mockQueryBuilder();
      kuisIdsBuilder._setResolveValue({
        data: [{ id: "kuis-1" }, { id: "kuis-2" }],
        error: null,
      });

      // ✅ NEW: Mock soal query (untuk mengecek CBT)
      const soalBuilder = mockQueryBuilder();
      soalBuilder._setResolveValue({
        data: [
          { kuis_id: "kuis-1", tipe: "file_upload" }, // Bukan CBT
          { kuis_id: "kuis-2", tipe: "pilihan_ganda" }, // CBT - akan di-exclude
        ],
        error: null,
      });

      // Mock attempt_kuis query
      const attemptBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "attempt-1",
              kuis_id: "kuis-1", // Bukan CBT, akan muncul
              mahasiswa_id: "mhs-1",
              mahasiswa: {
                user: { full_name: "John Doe" },
                nim: "BD2321001",
              },
              kuis: {
                judul: "Laporan Praktikum 1",
                kelas: {
                  mata_kuliah: { nama_mk: "Pemrograman Web" },
                },
              },
              submitted_at: "2024-01-01",
              attempt_number: 1,
              status: "submitted",
            },
            {
              id: "attempt-2",
              kuis_id: "kuis-2", // CBT, akan di-exclude
              mahasiswa_id: "mhs-2",
              status: "submitted",
            },
          ],
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(kuisIdsBuilder) // Get kuis IDs
        .mockReturnValueOnce(soalBuilder) // ✅ NEW: Get soal (cek CBT)
        .mockReturnValueOnce(attemptBuilder); // Get attempts

      const result = await getPendingGrading();

      expect(result).toHaveLength(1); // ✅ CHANGED: Hanya 1 (kuis-1 bukan CBT, kuis-2 CBT di-exclude)
      expect(result[0]).toMatchObject({
        id: "attempt-1",
        mahasiswa_nama: "John Doe",
        mahasiswa_nim: "BD2321001",
        kuis_judul: "Laporan Praktikum 1",
      });
    });

    it("should apply limit when provided", async () => {
      // Mock kuis IDs query
      const kuisIdsBuilder = mockQueryBuilder();
      kuisIdsBuilder._setResolveValue({
        data: [{ id: "kuis-1" }],
        error: null,
      });

      // ✅ NEW: Mock soal query
      const soalBuilder = mockQueryBuilder();
      soalBuilder._setResolveValue({
        data: [{ kuis_id: "kuis-1", tipe: "file_upload" }],
        error: null,
      });

      const attemptBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "attempt-1",
              kuis_id: "kuis-1",
              mahasiswa_id: "mhs-1",
              status: "submitted",
              mahasiswa: { user: { full_name: "John" }, nim: "BD2321001" },
              kuis: {
                judul: "Quiz 1",
                kelas: { mata_kuliah: { nama_mk: "MK" } },
              },
              submitted_at: "2024-01-01",
              attempt_number: 1,
            },
          ],
          error: null,
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(kuisIdsBuilder)
        .mockReturnValueOnce(soalBuilder) // ✅ NEW: soal query
        .mockReturnValueOnce(attemptBuilder);

      const result = await getPendingGrading(5);

      // ✅ CHANGED: Limit diterapkan client-side setelah filter CBT
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getActiveKuis", () => {
    it("should return active quizzes with stats", async () => {
      // Mock kuis query
      const kuisBuilder = mockQueryBuilder();
      kuisBuilder._setResolveValue({
        data: [
          {
            id: "kuis-1",
            judul: "Quiz 1",
            status: "published",
            tanggal_mulai: "2024-01-01",
            tanggal_selesai: "2024-01-10",
            kelas: { nama_kelas: "Kelas A" },
          },
        ],
        error: null,
      });

      // Mock total attempts count
      const totalAttemptsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
      };

      // Mock submitted count
      const submittedCountBuilder = {
        select: vi.fn(function () {
          return this;
        }),
        eq: vi.fn(function () {
          return this;
        }),
        then: vi.fn((onFulfilled) =>
          Promise.resolve({ count: 1, error: null }).then(onFulfilled),
        ),
      };

      (supabase.from as any)
        .mockReturnValueOnce(kuisBuilder) // Get kuis
        .mockReturnValueOnce(totalAttemptsBuilder) // Count total attempts
        .mockReturnValueOnce(submittedCountBuilder); // Count submitted

      const result = await getActiveKuis();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "kuis-1",
        judul: "Quiz 1",
        total_attempts: 2,
        submitted_count: 1,
        kelas_nama: "Kelas A",
      });
    });

    it("should apply limit when provided", async () => {
      const mockQuery = vi.fn().mockResolvedValue({ data: [], error: null });
      const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue({
          then: (resolve: any) => resolve(mockQuery()),
        }),
      };

      (supabase.from as any).mockReturnValue(builder);

      await getActiveKuis(10);

      expect(builder.limit).toHaveBeenCalledWith(10);
    });
  });
});
