/**
 * Unit Tests for Cleanup API (Vitest)
 *
 * Fokus:
 * - [`verifyKuisDataCounts()`](src/lib/api/cleanup.api.ts:250)
 * - [`cleanupAllKuisData()`](src/lib/api/cleanup.api.ts:15)
 * - [`cleanupTugasPraktikumOnly()`](src/lib/api/cleanup.api.ts:115)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/lib/supabase/client";
import { clearAllCacheSync } from "@/lib/offline/api-cache";
import {
  verifyKuisDataCounts,
  cleanupAllKuisData,
  cleanupTugasPraktikumOnly,
} from "@/lib/api/cleanup.api";

// Mock dependencies
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/offline/api-cache", () => ({
  clearAllCacheSync: vi.fn(),
}));

const mockCountQuery = (count: number | null | undefined) => ({ count, error: null });

describe("Cleanup API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(clearAllCacheSync).mockResolvedValue(0);
  });

  describe("verifyKuisDataCounts()", () => {
    it("mengembalikan jumlah count untuk semua tabel", async () => {
      let callIndex = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callIndex += 1;

        const counts = [100, 50, 200, 25, 10, 15];
        const count = counts[callIndex - 1] ?? 0;

        return {
          select: () => ({
            ...mockCountQuery(count),
            eq: () => Promise.resolve(mockCountQuery(count)),
          }),
        } as any;
      });

      const result = await verifyKuisDataCounts();

      expect(result).toEqual({
        jawaban: 100,
        attempt_kuis: 50,
        soal: 200,
        kuis: 25,
        kuis_essay: 10,
        kuis_pilihan_ganda: 15,
      });
      expect(supabase.from).toHaveBeenCalledTimes(6);
    });

    it("fallback ke 0 saat count null/undefined", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({
          ...mockCountQuery(undefined),
          eq: () => Promise.resolve(mockCountQuery(null)),
        }),
      } as any);

      const result = await verifyKuisDataCounts();

      expect(result.jawaban).toBe(0);
      expect(result.attempt_kuis).toBe(0);
      expect(result.soal).toBe(0);
      expect(result.kuis).toBe(0);
      expect(result.kuis_essay).toBe(0);
      expect(result.kuis_pilihan_ganda).toBe(0);
    });
  });

  describe("cleanupAllKuisData()", () => {
    it("hapus data berurutan lalu clear cache", async () => {
      const countsByTable: Record<string, number> = {
        jawaban: 8,
        attempt_kuis: 4,
        soal: 12,
        kuis: 3,
      };

      vi.mocked(clearAllCacheSync).mockResolvedValue(7);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const count = countsByTable[table] ?? 0;

        return {
          delete: () => ({
            neq: () => Promise.resolve({ count, error: null }),
          }),
        } as any;
      });

      const result = await cleanupAllKuisData();

      expect(result.success).toBe(true);
      expect(result.deleted).toEqual({
        jawaban: 8,
        attempt_kuis: 4,
        soal: 12,
        kuis: 3,
      });
      expect(clearAllCacheSync).toHaveBeenCalledTimes(1);
    });

    it("return success false saat delete error", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "jawaban") {
          return {
            delete: () => ({
              neq: () => Promise.resolve({ count: 0, error: { message: "permission denied" } }),
            }),
          } as any;
        }

        return {
          delete: () => ({
            neq: () => Promise.resolve({ count: 0, error: null }),
          }),
        } as any;
      });

      const result = await cleanupAllKuisData();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal menghapus jawaban");
      expect(result.deleted).toEqual({
        jawaban: 0,
        attempt_kuis: 0,
        soal: 0,
        kuis: 0,
      });
    });

    it("mengabaikan error contains no rows dan tetap sukses", async () => {
      const responses: Record<string, { count: number; error: any }> = {
        jawaban: { count: 0, error: { message: "contains no rows" } },
        attempt_kuis: { count: 0, error: { message: "contains no rows" } },
        soal: { count: 0, error: { message: "contains no rows" } },
        kuis: { count: 0, error: { message: "contains no rows" } },
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => ({
        delete: () => ({
          neq: () => Promise.resolve(responses[table]),
        }),
      }) as any);

      const result = await cleanupAllKuisData();

      expect(result.success).toBe(true);
      expect(result.deleted).toEqual({
        jawaban: 0,
        attempt_kuis: 0,
        soal: 0,
        kuis: 0,
      });
      expect(clearAllCacheSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanupTugasPraktikumOnly()", () => {
    it("return sukses + 0 jika tidak ada kuis essay", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          } as any;
        }

        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupTugasPraktikumOnly();

      expect(result.success).toBe(true);
      expect(result.deleted).toEqual({
        jawaban: 0,
        attempt_kuis: 0,
        soal: 0,
        kuis: 0,
      });
      expect(clearAllCacheSync).not.toHaveBeenCalled();
    });

    it("hapus kuis essay + data turunannya", async () => {
      vi.mocked(clearAllCacheSync).mockResolvedValue(5);

      let kuisCallCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          kuisCallCount += 1;

          // call #1: fetch essay ids
          if (kuisCallCount === 1) {
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: [{ id: "k1" }, { id: "k2" }], error: null }),
              }),
            } as any;
          }

          // call #2: delete kuis essay
          return {
            delete: () => ({
              eq: () => Promise.resolve({ count: 2, error: null }),
            }),
          } as any;
        }

        if (table === "attempt_kuis") {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [{ id: "a1" }, { id: "a2" }], error: null }),
            }),
            delete: () => ({
              in: () => Promise.resolve({ count: 2, error: null }),
            }),
          } as any;
        }

        if (table === "jawaban") {
          return {
            delete: () => ({
              in: () => Promise.resolve({ count: 9, error: null }),
            }),
          } as any;
        }

        if (table === "soal") {
          return {
            delete: () => ({
              in: () => Promise.resolve({ count: 6, error: null }),
            }),
          } as any;
        }

        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupTugasPraktikumOnly();

      expect(result.success).toBe(true);
      expect(result.deleted).toEqual({
        jawaban: 9,
        attempt_kuis: 2,
        soal: 6,
        kuis: 2,
      });
      expect(clearAllCacheSync).toHaveBeenCalledTimes(1);
    });

    it("return gagal saat fetch kuis essay error", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: null, error: { message: "fetch failed" } }),
            }),
          } as any;
        }

        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupTugasPraktikumOnly();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal mengambil data kuis essay");
    });

    it("tetap sukses saat delete turunan mengandung contains no rows", async () => {
      let kuisCallCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          kuisCallCount += 1;
          if (kuisCallCount === 1) {
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: [{ id: "k1" }], error: null }),
              }),
            } as any;
          }

          return {
            delete: () => ({
              eq: () => Promise.resolve({ count: 0, error: { message: "contains no rows" } }),
            }),
          } as any;
        }

        if (table === "attempt_kuis") {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [{ id: "a1" }], error: null }),
            }),
            delete: () => ({
              in: () => Promise.resolve({ count: 0, error: { message: "contains no rows" } }),
            }),
          } as any;
        }

        if (table === "jawaban") {
          return {
            delete: () => ({
              in: () => Promise.resolve({ count: 0, error: { message: "contains no rows" } }),
            }),
          } as any;
        }

        if (table === "soal") {
          return {
            delete: () => ({
              in: () => Promise.resolve({ count: 0, error: { message: "contains no rows" } }),
            }),
          } as any;
        }

        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupTugasPraktikumOnly();

      expect(result.success).toBe(true);
      expect(result.deleted).toEqual({
        jawaban: 0,
        attempt_kuis: 0,
        soal: 0,
        kuis: 0,
      });
      expect(clearAllCacheSync).toHaveBeenCalledTimes(1);
    });

    it("return gagal saat delete attempt_kuis error (line 188)", async () => {
      let kuisCallCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          kuisCallCount += 1;
          if (kuisCallCount === 1) {
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: [{ id: "k1" }], error: null }),
              }),
            } as any;
          }
          return {
            delete: () => ({ eq: () => Promise.resolve({ count: 0, error: null }) }),
          } as any;
        }

        if (table === "attempt_kuis") {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [{ id: "a1" }], error: null }),
            }),
            delete: () => ({
              in: () => Promise.resolve({ count: 0, error: { message: "attempt delete failed" } }),
            }),
          } as any;
        }

        if (table === "jawaban") {
          return {
            delete: () => ({
              in: () => Promise.resolve({ count: 0, error: null }),
            }),
          } as any;
        }

        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupTugasPraktikumOnly();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal menghapus attempt_kuis");
    });

    it("return gagal saat delete soal error (line 200)", async () => {
      let kuisCallCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          kuisCallCount += 1;
          if (kuisCallCount === 1) {
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: [{ id: "k1" }], error: null }),
              }),
            } as any;
          }
          return {
            delete: () => ({ eq: () => Promise.resolve({ count: 0, error: null }) }),
          } as any;
        }

        if (table === "attempt_kuis") {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [], error: null }),
            }),
            delete: () => ({
              in: () => Promise.resolve({ count: 0, error: null }),
            }),
          } as any;
        }

        if (table === "soal") {
          return {
            delete: () => ({
              in: () => Promise.resolve({ count: 0, error: { message: "soal delete failed" } }),
            }),
          } as any;
        }

        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupTugasPraktikumOnly();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal menghapus soal");
    });

    it("return gagal saat delete kuis essay error (line 212)", async () => {
      let kuisCallCount = 0;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          kuisCallCount += 1;
          if (kuisCallCount === 1) {
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: [{ id: "k1" }], error: null }),
              }),
            } as any;
          }
          // delete kuis essay - error
          return {
            delete: () => ({ eq: () => Promise.resolve({ count: 0, error: { message: "kuis essay delete failed" } }) }),
          } as any;
        }

        if (table === "attempt_kuis") {
          return {
            select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
            delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
          } as any;
        }

        if (table === "soal") {
          return {
            delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
          } as any;
        }

        return {
          select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
          delete: () => ({ in: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupTugasPraktikumOnly();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal menghapus kuis essay");
    });
  });

  describe("cleanupAllKuisData() - error branches per table", () => {
    it("return gagal saat delete attempt_kuis error (line 52-53)", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "jawaban") {
          return {
            delete: () => ({
              neq: () => Promise.resolve({ count: 0, error: null }),
            }),
          } as any;
        }

        if (table === "attempt_kuis") {
          return {
            delete: () => ({
              neq: () => Promise.resolve({ count: 0, error: { message: "attempt error" } }),
            }),
          } as any;
        }

        return {
          delete: () => ({ neq: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupAllKuisData();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal menghapus attempt_kuis");
    });

    it("return gagal saat delete soal error (line 64-65)", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "soal") {
          return {
            delete: () => ({
              neq: () => Promise.resolve({ count: 0, error: { message: "soal error" } }),
            }),
          } as any;
        }

        return {
          delete: () => ({ neq: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupAllKuisData();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal menghapus soal");
    });

    it("return gagal saat delete kuis error (line 76-77)", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kuis") {
          return {
            delete: () => ({
              neq: () => Promise.resolve({ count: 0, error: { message: "kuis error" } }),
            }),
          } as any;
        }

        return {
          delete: () => ({ neq: () => Promise.resolve({ count: 0, error: null }) }),
        } as any;
      });

      const result = await cleanupAllKuisData();

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal menghapus kuis");
    });
  });
});
