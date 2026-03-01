/**
 * Kuis API Unit Tests - CORE LOGIC
 * Target: src/lib/api/kuis.api.ts
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as kuisApi from "@/lib/api/kuis.api";
import {
  getById,
  queryWithFilters,
  query,
  insert,
  withApiResponse,
} from "@/lib/api/base.api";
import { handleError, logError } from "@/lib/utils/errors";
import { indexedDBManager } from "@/lib/offline/indexeddb";
import { submitAnswerWithVersion } from "@/lib/api/kuis-versioned-simple.api";

vi.mock("@/lib/api/base.api", () => ({
  query: vi.fn(),
  queryWithFilters: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  withApiResponse: vi.fn((fn: () => unknown) => fn()),
}));

vi.mock("@/lib/utils/errors", () => ({
  handleError: vi.fn((e) => e),
  logError: vi.fn(),
}));

vi.mock("@/lib/offline/indexeddb", () => ({
  indexedDBManager: {
    getById: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/api/kuis-versioned-simple.api", () => ({
  submitAnswerWithVersion: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/middleware/permission.middleware", () => ({
  requirePermission: vi.fn((_perm: string, fn: unknown) => fn),
  requirePermissionAndOwnership: vi.fn(
    (_perm: string, _cfg: unknown, _argIndex: number, fn: unknown) => fn,
  ),
  getCurrentDosenId: vi.fn(),
  getCurrentMahasiswaId: vi.fn(),
}));

vi.mock("@/lib/api/notification.api", () => ({
  notifyMahasiswaTugasBaru: vi.fn(),
  notifyMahasiswaKuisPublished: vi.fn(),
}));

vi.mock("@/lib/offline/conflict-resolver", () => ({
  conflictResolver: {},
}));

vi.mock("@/lib/offline/api-cache", () => ({
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  invalidateCachePatternSync: vi.fn(),
  clearAllCacheSync: vi.fn(async () => 0),
}));

describe("kuis.api - CORE LOGIC", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (withApiResponse as any).mockImplementation(async (fn: () => Promise<unknown>) => fn());
    vi.mocked(handleError).mockImplementation((e) => e as any);
  });

  describe("getKuis", () => {
    it("menerapkan filter default status != archived dan search", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([
        { id: "k1", judul: "Algoritma", deskripsi: "Dasar" },
        { id: "k2", judul: "Basis Data", deskripsi: "SQL" },
      ] as any);

      const result = await kuisApi.getKuis({ search: "algo", dosen_id: "d1" });

      expect(queryWithFilters).toHaveBeenCalledTimes(1);
      const call = vi.mocked(queryWithFilters).mock.calls[0];
      expect(call[0]).toBe("kuis");
      expect(call[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            column: "dosen_id",
            operator: "eq",
            value: "d1",
          }),
          expect.objectContaining({
            column: "status",
            operator: "neq",
            value: "archived",
          }),
        ]),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("k1");
    });

    it("mematikan cache saat forceRefresh=true", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([] as any);

      await kuisApi.getKuis(undefined, { forceRefresh: true });

      const call = vi.mocked(queryWithFilters).mock.calls[0];
      expect(call[2]).toEqual(
        expect.objectContaining({
          enableCache: false,
          staleWhileRevalidate: false,
        }),
      );
    });

    it("melempar apiError saat query gagal", async () => {
      const sourceError = new Error("db fail");
      const mappedError = new Error("mapped error");
      vi.mocked(queryWithFilters).mockRejectedValueOnce(sourceError);
      vi.mocked(handleError).mockReturnValue(mappedError as any);

      await expect(kuisApi.getKuis()).rejects.toThrow("mapped error");
      expect(handleError).toHaveBeenCalledWith(sourceError);
      expect(logError).toHaveBeenCalled();
    });
  });

  describe("getKuisById & getKuisByKelas", () => {
    it("getKuisById mengambil data via base.getById", async () => {
      vi.mocked(getById).mockResolvedValue({ id: "k100", judul: "Kuis 100" } as any);

      const result = await kuisApi.getKuisById("k100");

      expect(result.id).toBe("k100");
      expect(getById).toHaveBeenCalledWith(
        "kuis",
        "k100",
        expect.objectContaining({
          enableCache: true,
          staleWhileRevalidate: true,
        }),
      );
    });

    it("getKuisByKelas mendelegasikan ke getKuis", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([
        { id: "k1", kelas_id: "kelas-1", judul: "Kuis A" },
      ] as any);

      const result = await kuisApi.getKuisByKelas("kelas-1");

      expect(result).toHaveLength(1);
      expect(result[0].kelas_id).toBe("kelas-1");
    });
  });

  describe("offline cache helpers", () => {
    it("cacheQuizOffline: create saat belum ada cache", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(null as any);

      await kuisApi.cacheQuizOffline({ id: "k-off", judul: "Offline" } as any);

      expect(indexedDBManager.create).toHaveBeenCalledWith(
        "offline_quiz",
        expect.objectContaining({ id: "k-off" }),
      );
      expect(indexedDBManager.update).not.toHaveBeenCalled();
    });

    it("cacheQuizOffline: update saat cache sudah ada", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue({ id: "k-off" } as any);

      await kuisApi.cacheQuizOffline({ id: "k-off", judul: "Offline" } as any);

      expect(indexedDBManager.update).toHaveBeenCalledWith(
        "offline_quiz",
        expect.objectContaining({ id: "k-off" }),
      );
    });

    it("getCachedQuiz/getCachedQuestions/getCachedAttempt mengembalikan data cache", async () => {
      vi.mocked(indexedDBManager.getById)
        .mockResolvedValueOnce({ data: { id: "k1" } } as any)
        .mockResolvedValueOnce({ data: [{ id: "s1" }] } as any)
        .mockResolvedValueOnce({ data: { id: "a1" } } as any);

      await expect(kuisApi.getCachedQuiz("k1")).resolves.toEqual({ id: "k1" });
      await expect(kuisApi.getCachedQuestions("k1")).resolves.toEqual([{ id: "s1" }]);
      await expect(kuisApi.getCachedAttempt("a1")).resolves.toEqual({ id: "a1" });
    });

    it("saveAnswerOffline menyimpan jawaban dengan key attempt_soal", async () => {
      await kuisApi.saveAnswerOffline("attempt-1", "soal-2", "B");

      expect(indexedDBManager.create).toHaveBeenCalledWith(
        "offline_answers",
        expect.objectContaining({
          id: "attempt-1_soal-2",
          attempt_id: "attempt-1",
          soal_id: "soal-2",
          jawaban: "B",
          synced: false,
        }),
      );
    });

    it("getOfflineAnswers memetakan jawaban sesuai attempt_id", async () => {
      vi.mocked(indexedDBManager.getAll).mockResolvedValue([
        { attempt_id: "att-1", soal_id: "s1", jawaban: "A" },
        { attempt_id: "att-1", soal_id: "s2", jawaban: "C" },
        { attempt_id: "att-2", soal_id: "s1", jawaban: "D" },
      ] as any);

      const answers = await kuisApi.getOfflineAnswers("att-1");

      expect(answers).toEqual({ s1: "A", s2: "C" });
    });
  });

  describe("offline-first flow", () => {
    it("getKuisByIdOffline fallback ke cache saat API gagal", async () => {
      vi.mocked(getById).mockRejectedValueOnce(new Error("network down"));
      vi.mocked(indexedDBManager.getById).mockResolvedValueOnce({
        data: { id: "k-cache", judul: "Cached" },
      } as any);

      const result = await kuisApi.getKuisByIdOffline("k-cache");

      expect(result).toEqual({ id: "k-cache", judul: "Cached" });
    });

    it("getSoalByKuisOffline fallback ke cache saat API gagal", async () => {
      vi.mocked(queryWithFilters).mockRejectedValueOnce(new Error("offline"));
      vi.mocked(indexedDBManager.getById).mockResolvedValueOnce({
        data: [{ id: "s1" }, { id: "s2" }],
      } as any);

      const result = await kuisApi.getSoalByKuisOffline("kuis-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("s1");
    });

    it("syncOfflineAnswers: hapus jawaban lokal setelah sync sukses", async () => {
      vi.mocked(indexedDBManager.getAll).mockResolvedValue([
        { attempt_id: "att-1", soal_id: "s1", jawaban: "A" },
      ] as any);
      vi.mocked(indexedDBManager.getById).mockResolvedValue({ id: "att-1_s1" } as any);
      vi.mocked(submitAnswerWithVersion).mockResolvedValue({ success: true } as any);

      await expect(kuisApi.syncOfflineAnswers("att-1")).resolves.toBeUndefined();

      expect(submitAnswerWithVersion).toHaveBeenCalledWith({
        attempt_id: "att-1",
        soal_id: "s1",
        jawaban: "A",
      });
      expect(indexedDBManager.delete).toHaveBeenCalledWith(
        "offline_answers",
        "att-1_s1",
      );
    });

    it("syncOfflineAnswers: no-op jika tidak ada data offline", async () => {
      vi.mocked(indexedDBManager.getAll).mockResolvedValue([] as any);

      await expect(kuisApi.syncOfflineAnswers("att-empty")).resolves.toBeUndefined();
      expect(submitAnswerWithVersion).not.toHaveBeenCalled();
    });

    it("getKuisByIdOffline memakai API lalu cache saat online", async () => {
      vi.mocked(getById).mockResolvedValueOnce({ id: "k-online", judul: "Online" } as any);
      vi.mocked(indexedDBManager.getById).mockResolvedValueOnce(null as any);

      const result = await kuisApi.getKuisByIdOffline("k-online");

      expect(result).toEqual({ id: "k-online", judul: "Online" });
      expect(indexedDBManager.create).toHaveBeenCalledWith(
        "offline_quiz",
        expect.objectContaining({ id: "k-online" }),
      );
    });

    it("submitAnswerOffline menyimpan fallback jawaban saat submit online gagal", async () => {
      const sourceError = new Error("network down");
      vi.mocked(queryWithFilters).mockRejectedValueOnce(sourceError);

      const result = await kuisApi.submitAnswerOffline({
        attempt_id: "att-9",
        soal_id: "soal-7",
        jawaban: "B",
      } as any);

      expect(indexedDBManager.create).toHaveBeenCalledWith(
        "offline_answers",
        expect.objectContaining({
          id: "att-9_soal-7",
          attempt_id: "att-9",
          soal_id: "soal-7",
          jawaban: "B",
        }),
      );
      expect(result).toMatchObject({
        attempt_id: "att-9",
        soal_id: "soal-7",
        jawaban: "B",
        is_synced: false,
      });
    });
  });

  describe("attempt and validation branches", () => {
    it("getAttempts menggunakan query saat tanpa filter", async () => {
      vi.mocked(query).mockResolvedValue([{ id: "a1", status: "graded" }] as any);

      const result = await kuisApi.getAttempts();

      expect(query).toHaveBeenCalledWith(
        "attempt_kuis",
        expect.objectContaining({
          order: expect.objectContaining({ column: "started_at" }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it("getAttempts menggunakan queryWithFilters saat ada filter", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([{ id: "a2", status: "submitted" }] as any);

      const result = await kuisApi.getAttempts({ kuis_id: "k1", mahasiswa_id: "m1", status: "submitted" });

      expect(queryWithFilters).toHaveBeenCalledWith(
        "attempt_kuis",
        expect.arrayContaining([
          expect.objectContaining({ column: "kuis_id", value: "k1" }),
          expect.objectContaining({ column: "mahasiswa_id", value: "m1" }),
          expect.objectContaining({ column: "status", value: "submitted" }),
        ]),
        expect.any(Object),
      );
      expect(result[0].id).toBe("a2");
    });

    it("getAttemptById & getJawabanByAttempt mendelegasikan ke base api", async () => {
      vi.mocked(getById).mockResolvedValueOnce({ id: "att-1" } as any);
      vi.mocked(queryWithFilters).mockResolvedValueOnce([{ id: "j-1" }] as any);

      const attempt = await kuisApi.getAttemptById("att-1");
      const jawaban = await kuisApi.getJawabanByAttempt("att-1");

      expect(attempt.id).toBe("att-1");
      expect(jawaban).toHaveLength(1);
      expect(getById).toHaveBeenCalledWith(
        "attempt_kuis",
        "att-1",
        expect.objectContaining({ select: expect.stringContaining("jawaban:jawaban") }),
      );
    });

    it("canAttemptQuiz mengembalikan fallback false saat ownership gagal", async () => {
      const permission = await import("@/lib/middleware/permission.middleware");
      vi.mocked(permission.getCurrentMahasiswaId).mockResolvedValue("mhs-login");

      const result = await kuisApi.canAttemptQuiz("kuis-1", "mhs-lain");

      expect(result).toEqual({
        canAttempt: false,
        reason: "Error checking attempt eligibility",
      });
    });

    it("startAttempt me-resume attempt in_progress yang sudah ada", async () => {
      const permission = await import("@/lib/middleware/permission.middleware");
      vi.mocked(permission.getCurrentMahasiswaId).mockResolvedValue("mhs-1");

      const kuisBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "k1", kelas_id: "kelas-1", max_attempts: 2 },
          error: null,
        }),
      };
      const enrollBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: "en1" }], error: null }),
      };
      const { supabase } = await import("@/lib/supabase/client");
      (supabase.from as any)
        .mockReturnValueOnce(kuisBuilder)
        .mockReturnValueOnce(enrollBuilder);

      vi.mocked(queryWithFilters).mockResolvedValueOnce([
        { id: "att-existing", status: "in_progress" },
      ] as any);

      const result = await kuisApi.startAttempt({ kuis_id: "k1", mahasiswa_id: "mhs-1" } as any);

      expect(result.id).toBe("att-existing");
      expect(insert).not.toHaveBeenCalled();
    });

    it("startAttempt menangani conflict insert dengan fetch ulang attempt", async () => {
      const permission = await import("@/lib/middleware/permission.middleware");
      vi.mocked(permission.getCurrentMahasiswaId).mockResolvedValue("mhs-1");

      const kuisBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "k1", kelas_id: "kelas-1", max_attempts: 3 },
          error: null,
        }),
      };
      const enrollBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: "en1" }], error: null }),
      };
      const { supabase } = await import("@/lib/supabase/client");
      (supabase.from as any)
        .mockReturnValueOnce(kuisBuilder)
        .mockReturnValueOnce(enrollBuilder);

      vi.mocked(queryWithFilters)
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([{ id: "att-after-conflict", status: "in_progress" }] as any);
      vi.mocked(insert).mockRejectedValueOnce({ code: "23505" } as any);

      const result = await kuisApi.startAttempt({ kuis_id: "k1", mahasiswa_id: "mhs-1" } as any);

      expect(result.id).toBe("att-after-conflict");
      expect(insert).toHaveBeenCalledTimes(1);
    });

    it("getAttemptsByKuis mengembalikan error saat query supabase gagal", async () => {
      const attemptsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "rls denied" },
        }),
      };
      const { supabase } = await import("@/lib/supabase/client");
      (supabase.from as any).mockReturnValueOnce(attemptsBuilder);

      vi.mocked(handleError).mockImplementation((e: any) => e);
      await expect(kuisApi.getAttemptsByKuis("k1")).rejects.toThrow("rls denied");
    });
  });

  describe("dashboard, cache edge cases, and wrappers", () => {
    it("cacheQuestionsOffline melakukan create dan update", async () => {
      vi.mocked(indexedDBManager.getById)
        .mockResolvedValueOnce(null as any)
        .mockResolvedValueOnce({ id: "kuis-1" } as any);

      await kuisApi.cacheQuestionsOffline("kuis-1", [{ id: "s1" }] as any);
      await kuisApi.cacheQuestionsOffline("kuis-1", [{ id: "s2" }] as any);

      expect(indexedDBManager.create).toHaveBeenCalledWith(
        "offline_questions",
        expect.objectContaining({ id: "kuis-1" }),
      );
      expect(indexedDBManager.update).toHaveBeenCalledWith(
        "offline_questions",
        expect.objectContaining({ id: "kuis-1" }),
      );
    });

    it("getCachedQuiz/getCachedQuestions/getCachedAttempt mengembalikan null saat indexeddb gagal", async () => {
      vi.mocked(indexedDBManager.getById).mockRejectedValue(new Error("idb fail"));

      await expect(kuisApi.getCachedQuiz("k1")).resolves.toBeNull();
      await expect(kuisApi.getCachedQuestions("k1")).resolves.toBeNull();
      await expect(kuisApi.getCachedAttempt("a1")).resolves.toBeNull();
    });

    it("getOfflineAnswers mengembalikan object kosong saat indexeddb gagal", async () => {
      vi.mocked(indexedDBManager.getAll).mockRejectedValue(new Error("idb fail"));

      await expect(kuisApi.getOfflineAnswers("att-err")).resolves.toEqual({});
    });

    it("getUpcomingQuizzes mengembalikan kosong saat mahasiswa tidak punya enrollment", async () => {
      const permission = await import("@/lib/middleware/permission.middleware");
      vi.mocked(permission.getCurrentMahasiswaId).mockResolvedValue("mhs-1");

      const enrollBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const { supabase } = await import("@/lib/supabase/client");
      (enrollBuilder.eq as any)
        .mockReturnValueOnce(enrollBuilder)
        .mockResolvedValueOnce({ data: [], error: null });
      (supabase.from as any).mockReturnValueOnce(enrollBuilder);

      const result = await kuisApi.getUpcomingQuizzes("mhs-1");

      expect(result).toEqual([]);
    });

    it("getQuizStats dan getRecentQuizResults menghitung ringkasan dashboard", async () => {
      const permission = await import("@/lib/middleware/permission.middleware");
      vi.mocked(permission.getCurrentMahasiswaId).mockResolvedValue("mhs-1");

      vi.mocked(queryWithFilters).mockResolvedValue([
        {
          id: "att-1",
          kuis_id: "k1",
          status: "graded",
          total_poin: 80,
          started_at: "2025-01-01T10:00:00.000Z",
          submitted_at: "2025-01-01T11:00:00.000Z",
          kuis: { judul: "Kuis 1", passing_grade: 70 },
        },
        {
          id: "att-2",
          kuis_id: "k2",
          status: "graded",
          total_poin: 60,
          started_at: "2025-01-02T10:00:00.000Z",
          submitted_at: "2025-01-02T11:00:00.000Z",
          kuis: { judul: "Kuis 2", passing_grade: 70 },
        },
      ] as any);

      const enrollBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const quizzesBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "uq-1",
              kelas_id: "kelas-1",
              judul: "Upcoming Quiz",
              tanggal_mulai: "2999-01-01T10:00:00.000Z",
              tanggal_selesai: "2999-01-02T10:00:00.000Z",
              soal: [{ id: "s1" }],
              kelas: {
                nama_kelas: "A",
                mata_kuliah: { nama_mk: "Algoritma", kode_mk: "ALG" },
              },
              dosen: { users: { full_name: "Dosen A" } },
              max_attempts: 2,
            },
          ],
          error: null,
        }),
      };
      (enrollBuilder.eq as any)
        .mockReturnValueOnce(enrollBuilder)
        .mockResolvedValueOnce({ data: [{ kelas_id: "kelas-1" }], error: null });
      const { supabase } = await import("@/lib/supabase/client");
      (supabase.from as any)
        .mockReturnValueOnce(enrollBuilder)
        .mockReturnValueOnce(quizzesBuilder);

      const stats = await kuisApi.getQuizStats("mhs-1");
      const recent = await kuisApi.getRecentQuizResults("mhs-1", 1);

      expect(stats).toEqual({
        total_quiz: 2,
        completed_quiz: 2,
        average_score: 70,
        upcoming_quiz: 1,
      });
      expect(recent).toHaveLength(1);
      expect(recent[0]).toMatchObject({
        id: "k2",
        attempt_id: "att-2",
        judul: "Kuis 2",
        passed: false,
      });
    });

    it("kuisApi wrappers untuk dashboard menggunakan withApiResponse", async () => {
      const permission = await import("@/lib/middleware/permission.middleware");
      vi.mocked(permission.getCurrentMahasiswaId).mockResolvedValue("mhs-1");

      const enrollBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      const quizzesBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const kuisMetaBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "k1",
            kelas_id: "kelas-1",
            status: "published",
            tanggal_mulai: null,
            tanggal_selesai: null,
            max_attempts: 2,
          },
          error: null,
        }),
      };
      const enrollForKuisBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: "en2" }], error: null }),
      };
      (enrollBuilder.eq as any)
        .mockReturnValueOnce(enrollBuilder)
        .mockResolvedValueOnce({ data: [{ kelas_id: "kelas-1" }], error: null });

      const { supabase } = await import("@/lib/supabase/client");
      (supabase.from as any)
        .mockReturnValueOnce(enrollBuilder)
        .mockReturnValueOnce(quizzesBuilder)
        .mockReturnValueOnce(kuisMetaBuilder)
        .mockReturnValueOnce(enrollForKuisBuilder);

      vi.mocked(queryWithFilters).mockResolvedValue([] as any);

      await kuisApi.kuisApi.getUpcomingQuizzes("mhs-1");
      await kuisApi.kuisApi.getQuizStats("mhs-1");
      await kuisApi.kuisApi.getRecentResults("mhs-1", 3);
      await kuisApi.kuisApi.canAttemptQuiz("k1", "mhs-1");

      expect(withApiResponse).toHaveBeenCalledTimes(4);
    });

    it("kuisApi.getById menggunakan withApiResponse", async () => {
      vi.mocked(getById).mockResolvedValue({ id: "k-w1" } as any);

      const result = await kuisApi.kuisApi.getById("k-w1");

      expect(result).toEqual({ id: "k-w1" });
      expect(withApiResponse).toHaveBeenCalled();
    });

    it("compatibility alias submitKuisAttempt tersedia", () => {
      expect(kuisApi.submitKuisAttempt).toBe(kuisApi.submitQuiz);
    });
  });

  // memastikan mock dipakai agar tidak dianggap unused oleh linter strict
  it("query mock tersedia", () => {
    expect(typeof query).toBe("function");
  });
});
