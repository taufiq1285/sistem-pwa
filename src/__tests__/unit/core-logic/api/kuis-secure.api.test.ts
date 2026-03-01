import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/utils/errors", () => ({
  handleError: vi.fn((error) => error),
  logError: vi.fn(),
}));

import { supabase } from "@/lib/supabase/client";
import { handleError, logError } from "@/lib/utils/errors";
import {
  canSeeAnswers,
  getKuisForAttempt,
  getKuisForResult,
  getSoalForAttempt,
  getSoalForResult,
} from "@/lib/api/kuis-secure.api";

describe("kuis-secure.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges FILE_UPLOAD settings from soal table", async () => {
    const soalMahasiswaRows = [
      {
        id: "q1",
        kuis_id: "k1",
        tipe: "file_upload",
        jawaban_benar: null,
        urutan: 1,
      },
      {
        id: "q2",
        kuis_id: "k1",
        tipe: "pilihan_ganda",
        jawaban_benar: null,
        urutan: 2,
      },
    ];

    const soalConfigRows = [
      {
        id: "q1",
        jawaban_benar: JSON.stringify({
          instructions: "Upload laporan praktikum Anda.",
          acceptedTypes: { pdf: true },
          maxSizeMB: 10,
        }),
      },
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "soal_mahasiswa") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi
            .fn()
            .mockResolvedValue({ data: soalMahasiswaRows, error: null }),
        };
      }

      if (table === "soal") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: soalConfigRows, error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await getSoalForAttempt("k1");

    expect(result).toHaveLength(2);

    const q1 = result.find((q: any) => q.id === "q1") as any;
    const q2 = result.find((q: any) => q.id === "q2") as any;

    expect(q1.tipe_soal).toBe("file_upload");
    expect(q1.jawaban_benar).toBe(soalConfigRows[0].jawaban_benar);

    expect(q2.tipe_soal).toBe("pilihan_ganda");
    expect(q2.jawaban_benar).toBeNull();
  });

  it("getSoalForResult returns mapped tipe_soal and jawaban_benar", async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table !== "soal") throw new Error("Unexpected table");

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "s1",
              kuis_id: "k1",
              pertanyaan: "2 + 2 = ?",
              tipe: "pilihan_ganda",
              poin: 10,
              urutan: 1,
              pilihan_jawaban: ["3", "4"],
              jawaban_benar: "4",
              pembahasan: "Dasar aritmetika",
            },
          ],
          error: null,
        }),
      };
    });

    const result = await getSoalForResult("k1");

    expect(result).toHaveLength(1);
    expect(result[0].tipe_soal).toBe("pilihan_ganda");
    expect(result[0].opsi_jawaban).toEqual(["3", "4"]);
    expect(result[0].jawaban_benar).toBe("4");
  });

  it("getKuisForAttempt builds fallback kelas/dosen relation", async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "kuis") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "k1",
              kelas_id: "kelas-1",
              dosen_id: "dosen-1",
              judul: "Kuis 1",
            },
            error: null,
          }),
        };
      }

      if (table === "soal_mahasiswa") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "s1",
                kuis_id: "k1",
                pertanyaan: "A",
                tipe: "pilihan_ganda",
                urutan: 1,
              },
            ],
            error: null,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await getKuisForAttempt("k1");

    expect(result.id).toBe("k1");
    expect(result.soal).toHaveLength(1);
    expect((result as any).kelas?.nama_kelas).toBe("Unknown");
    expect((result as any).dosen?.users?.full_name).toBe("Dosen");
  });

  it("getKuisForResult includes soal from result endpoint", async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "kuis") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "k-result",
              judul: "Kuis Result",
              kelas_id: "kelas-1",
              dosen_id: "dosen-1",
            },
            error: null,
          }),
        };
      }

      if (table === "soal") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "s-result-1",
                kuis_id: "k-result",
                pertanyaan: "Q",
                tipe: "pilihan_ganda",
                urutan: 1,
                jawaban_benar: "A",
              },
            ],
            error: null,
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await getKuisForResult("k-result");

    expect(result.id).toBe("k-result");
    expect(result.soal?.[0]?.id).toBe("s-result-1");
    expect(result.soal?.[0]?.jawaban_benar).toBe("A");
  });

  it("falls back when FILE_UPLOAD config query fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "soal_mahasiswa") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "q1",
                kuis_id: "k1",
                pertanyaan: "Upload",
                tipe: "file_upload",
                jawaban_benar: null,
                urutan: 1,
              },
            ],
            error: null,
          }),
        };
      }

      if (table === "soal") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockRejectedValue(new Error("config fail")),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await getSoalForAttempt("k1");

    expect(result).toHaveLength(1);
    expect(result[0].jawaban_benar).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("throws mapped error when secure attempt query fails", async () => {
    const rawError = new Error("secure fetch failed");
    vi.mocked(handleError).mockImplementation((error: any) => error);

    (supabase.from as any).mockImplementation((table: string) => {
      if (table !== "soal_mahasiswa") throw new Error("Unexpected table");
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: rawError }),
      };
    });

    await expect(getSoalForAttempt("k-fail")).rejects.toThrow("secure fetch failed");
    expect(handleError).toHaveBeenCalledWith(rawError);
    expect(logError).toHaveBeenCalled();
  });

  it("throws when kuis attempt target not found", async () => {
    vi.mocked(handleError).mockImplementation((error: any) => error);

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "kuis") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(getKuisForAttempt("missing")).rejects.toThrow("Kuis tidak ditemukan");
    expect(logError).toHaveBeenCalled();
  });

  it("throws mapped error when result soal query fails", async () => {
    const rawError = new Error("result fail");
    vi.mocked(handleError).mockImplementation((error: any) => error);

    (supabase.from as any).mockImplementation((table: string) => {
      if (table !== "soal") throw new Error("Unexpected table");
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: rawError }),
      };
    });

    await expect(getSoalForResult("k1")).rejects.toThrow("result fail");
    expect(handleError).toHaveBeenCalledWith(rawError);
    expect(logError).toHaveBeenCalled();
  });

  it("canSeeAnswers enforces role + attempt status rules", () => {
    expect(canSeeAnswers("dosen", "in_progress")).toBe(true);
    expect(canSeeAnswers("admin", "in_progress")).toBe(true);

    expect(canSeeAnswers("mahasiswa", "in_progress")).toBe(false);
    expect(canSeeAnswers("mahasiswa", "submitted")).toBe(true);
    expect(canSeeAnswers("mahasiswa", "graded")).toBe(true);

    expect(canSeeAnswers("guest", "graded")).toBe(false);
  });
});
