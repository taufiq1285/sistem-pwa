/**
 * Mahasiswa API Unit Tests
 * Comprehensive tests for mahasiswa-specific API functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as mahasiswaAPI from "../../../lib/api/mahasiswa.api";
import { supabase } from "../../../lib/supabase/client";

// Mock Supabase
vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock cache API
vi.mock("../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((key, fn) => fn()),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Helper untuk membuat Mock Query Builder yang aman
const createSafeMockBuilder = (overrides = {}) => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    // Default resolve untuk await
    then: (resolve: any) => resolve({ data: [], error: null, count: null }),
    ...overrides,
  };
  return builder;
};

describe("Mahasiswa API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mahasiswaAPI.clearMahasiswaCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ... (Test getMahasiswaStats tetap sama) ...
  describe("getMahasiswaStats", () => {
    it("should return mahasiswa statistics successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockMahasiswaId = "mhs-123";

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockKelasMahasiswa = [
        { kelas_id: "kelas-1" },
        { kelas_id: "kelas-2" },
      ];

      const mockJadwal = [{ id: "jadwal-1" }];
      const mockKuis = [{ id: "kuis-1" }, { id: "kuis-2" }];
      const mockNilai = [{ total_score: 80 }, { total_score: 90 }];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: mockMahasiswaId },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: mockKelasMahasiswa,
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "jadwal_praktikum") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    data: mockJadwal,
                    error: null,
                  }),
                }),
              }),
            }),
          });
        }
        if (table === "kuis") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    gte: vi.fn().mockReturnValue({
                      data: mockKuis,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          });
        }
        if (table === "attempt_kuis") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  data: mockNilai,
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result).toEqual({
        totalKelasPraktikum: 2,
        totalKuis: 2,
        rataRataNilai: 85,
        jadwalHariIni: 1,
      });
    });

    it("should return zero stats when mahasiswa not found", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result).toEqual({
        totalKelasPraktikum: 0,
        totalKuis: 0,
        rataRataNilai: null,
        jadwalHariIni: 0,
      });
    });

    it("should calculate average score correctly", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockNilai = [
        { total_score: 70 },
        { total_score: 80 },
        { total_score: 90 },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "attempt_kuis") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  data: mockNilai,
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result.rataRataNilai).toBe(80);
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result).toEqual({
        totalKelasPraktikum: 0,
        totalKuis: 0,
        rataRataNilai: null,
        jadwalHariIni: 0,
      });
    });
  });

  // ... (Test getAvailableKelas) ...
  describe("getAvailableKelas", () => {
    it("should return available kelas for enrollment", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockKelas = [
        {
          id: "kelas-1",
          kode_kelas: "K001",
          nama_kelas: "Kelas A",
          tahun_ajaran: "2024/2025",
          semester_ajaran: 1,
          kuota: 30,
          mata_kuliah_id: "mk-1",
        },
      ];

      const mockMataKuliah = {
        id: "mk-1",
        kode_mk: "MK001",
        nama_mk: "Mata Kuliah 1",
        sks: 3,
        semester: 1,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockKelas,
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  count: 5,
                }),
              }),
            }),
          });
        }
        if (table === "mata_kuliah") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMataKuliah,
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.getAvailableKelas();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when mahasiswa not found", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.getAvailableKelas();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("Database error");
      });

      const result = await mahasiswaAPI.getAvailableKelas();

      expect(result).toEqual([]);
    });
  });

  describe("enrollToKelas", () => {
    it("should enroll mahasiswa to kelas successfully", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [],
                      count: 5,
                      error: null,
                    }),
                    // Handle await directly if needed
                    then: (resolve: any) =>
                      resolve({ data: [], count: 5, error: null }),
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({
              error: null,
            }),
          });
        }
        if (table === "kelas") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { kuota: 30 },
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.enrollToKelas("kelas-1");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Berhasil mendaftar ke kelas");
    });

    it("should fail when mahasiswa not found", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          // Return builder lengkap untuk memastikan error ter-deliver
          return createSafeMockBuilder({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Row not found" },
            }),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Row not found" },
            }),
          });
        }
        // Mock table lain untuk default sukses agar isolasi test jelas:
        // Jika kode lanjut (bug), dia akan sukses di step berikutnya.
        // Tapi kita ekspektasi dia gagal di step awal (mahasiswa).
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.enrollToKelas("kelas-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Mahasiswa tidak ditemukan");
    });

    it("should fail when already enrolled", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ id: "existing" }],
                      error: null,
                    }),
                    // Handle case where limit is not used but await is
                    then: (resolve: any) =>
                      resolve({ data: [{ id: "existing" }], error: null }),
                  }),
                }),
              }),
            }),
          });
        }
        if (table === "kelas") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { kuota: 30 },
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.enrollToKelas("kelas-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Anda sudah terdaftar di kelas ini");
    });

    it("should fail when kelas is full", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }

        // PERBAIKAN: Mock yang lebih robust untuk menangani limit() maupun await (.then)
        if (table === "kelas_mahasiswa") {
          const appliedFilters: string[] = [];

          // Hasil jika sedang cek enrollment (user belum terdaftar)
          const notEnrolledResponse = { data: [], count: 0, error: null };
          // Hasil jika sedang cek kapasitas (kelas penuh = 30)
          const fullClassResponse = {
            data: new Array(30).fill({ id: "dummy" }),
            count: 30,
            error: null,
          };

          const mockBuilder: any = createSafeMockBuilder({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col, val) => {
              appliedFilters.push(col);
              return mockBuilder; // Chaining
            }),
            // Handle jika API menggunakan .limit()
            limit: vi.fn().mockImplementation(() => {
              if (appliedFilters.includes("mahasiswa_id")) {
                return Promise.resolve(notEnrolledResponse);
              }
              return Promise.resolve(fullClassResponse);
            }),
            // Handle jika API menggunakan await langsung (tanpa limit)
            then: (resolve: any) => {
              if (appliedFilters.includes("mahasiswa_id")) {
                return resolve(notEnrolledResponse);
              }
              return resolve(fullClassResponse);
            },
            insert: vi.fn().mockResolvedValue({ error: null }),
          });
          return mockBuilder;
        }

        if (table === "kelas") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { kuota: 30 },
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.enrollToKelas("kelas-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Kelas sudah penuh");
    });
  });

  describe("unenrollFromKelas", () => {
    it("should unenroll mahasiswa from kelas successfully", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.unenrollFromKelas("kelas-1");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Berhasil keluar dari kelas");
    });

    it("should fail when mahasiswa not found", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          // PERBAIKAN: Gunakan builder lengkap agar chain tidak putus
          return createSafeMockBuilder({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.unenrollFromKelas("kelas-1");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Mahasiswa tidak ditemukan");
    });

    it("should handle database errors", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          const errorMock = {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: new Error("Database error"),
              }),
            }),
          };
          return createSafeMockBuilder({
            delete: vi.fn().mockReturnValue(errorMock),
            update: vi.fn().mockReturnValue(errorMock),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.unenrollFromKelas("kelas-1");

      expect(result.success).toBe(false);
    });
  });

  // ... (Test getMyKelas dan getMyJadwal tetap sama) ...
  describe("getMyKelas", () => {
    it("should return enrolled kelas list", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockEnrolled = [{ kelas_id: "kelas-1", enrolled_at: "2024-01-01" }];

      const mockKelas = {
        id: "kelas-1",
        kode_kelas: "K001",
        nama_kelas: "Kelas A",
        tahun_ajaran: "2024/2025",
        semester_ajaran: 1,
        mata_kuliah_id: "mk-1",
      };

      const mockMataKuliah = {
        kode_mk: "MK001",
        nama_mk: "Mata Kuliah 1",
        sks: 3,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    data: mockEnrolled,
                    error: null,
                  }),
                }),
              }),
            }),
          });
        }
        if (table === "kelas") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockKelas,
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "mata_kuliah") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMataKuliah,
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.getMyKelas();

      expect(result).toHaveLength(1);
      expect(result[0].kode_kelas).toBe("K001");
    });

    it("should return empty array when mahasiswa not found", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.getMyKelas();

      expect(result).toEqual([]);
    });
  });

  describe("getMyJadwal", () => {
    it("should return jadwal for next 7 days", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const today = new Date();
      const mockJadwal = [
        {
          id: "jadwal-1",
          tanggal_praktikum: today.toISOString().split("T")[0],
          hari: "Senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Topik 1",
          kelas_id: "kelas-1",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174001",
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [{ kelas_id: "kelas-1" }],
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "jadwal_praktikum") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          data: mockJadwal,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          });
        }
        if (table === "kelas") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    nama_kelas: "Kelas A",
                    mata_kuliah_id: "mk-1",
                  },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "mata_kuliah") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { nama_mk: "Mata Kuliah 1" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "laboratorium") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    nama_lab: "Lab 1",
                    kode_lab: "L1",
                  },
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.getMyJadwal();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when not enrolled in any kelas", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      const result = await mahasiswaAPI.getMyJadwal();

      expect(result).toEqual([]);
    });

    it("should respect limit parameter", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "mhs-123" },
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "kelas_mahasiswa") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [{ kelas_id: "kelas-1" }],
                  error: null,
                }),
              }),
            }),
          });
        }
        if (table === "jadwal_praktikum") {
          return createSafeMockBuilder({
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: limitMock,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          });
        }
        return createSafeMockBuilder();
      });

      await mahasiswaAPI.getMyJadwal(5);

      expect(limitMock).toHaveBeenCalledWith(5);
    });
  });
});

