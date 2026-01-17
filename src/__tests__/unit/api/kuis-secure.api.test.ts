import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../../../lib/supabase/client";
import { getSoalForAttempt } from "../../../lib/api/kuis-secure.api";

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
});
