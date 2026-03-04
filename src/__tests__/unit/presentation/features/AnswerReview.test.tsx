/**
 * AnswerReview Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AnswerReview,
  AnswerReviewList,
} from "@/components/features/kuis/result/AnswerReview";
import type { Soal, Jawaban } from "@/types/kuis.types";
import { TIPE_SOAL } from "@/types/kuis.types";

vi.mock("@/lib/utils/quiz-scoring", () => ({
  getAnswerLabel: (_soal: unknown, answer: string) => answer,
  getCorrectAnswerLabel: (soal: any) => soal.jawaban_benar || "A",
}));

function makeSoal(overrides: Partial<Soal> = {}): Soal {
  return {
    id: "soal-1",
    kuis_id: "kuis-1",
    pertanyaan: "Apa itu homeostasis?",
    tipe_soal: TIPE_SOAL.PILIHAN_GANDA,
    poin: 10,
    urutan: 1,
    jawaban_benar: "A",
    opsi_jawaban: [
      { id: "opt-1", label: "A", text: "Keseimbangan tubuh", is_correct: true },
    ],
    ...overrides,
  } as Soal;
}

function makeJawaban(overrides: Partial<Jawaban> = {}): Jawaban {
  return {
    id: "jawaban-1",
    attempt_id: "attempt-1",
    soal_id: "soal-1",
    jawaban_mahasiswa: "A",
    jawaban: "A",
    poin_diperoleh: 10,
    is_correct: true,
    ...overrides,
  } as Jawaban;
}

describe("AnswerReview", () => {
  describe("rendering dasar", () => {
    it("menampilkan nomor soal", () => {
      render(<AnswerReview soal={makeSoal()} number={3} />);
      expect(screen.getByText("Soal 3")).toBeInTheDocument();
    });

    it("menampilkan teks pertanyaan", () => {
      render(<AnswerReview soal={makeSoal()} number={1} />);
      expect(screen.getByText("Apa itu homeostasis?")).toBeInTheDocument();
    });

    it("menampilkan poin soal", () => {
      render(<AnswerReview soal={makeSoal({ poin: 20 })} number={1} />);
      expect(screen.getByText("20 poin")).toBeInTheDocument();
    });

    it("menampilkan badge tipe soal", () => {
      render(<AnswerReview soal={makeSoal()} number={1} />);
      expect(screen.getByText(TIPE_SOAL.PILIHAN_GANDA)).toBeInTheDocument();
    });
  });

  describe("status jawaban", () => {
    it("menampilkan 'Tidak dijawab' saat tidak ada jawaban", () => {
      render(<AnswerReview soal={makeSoal()} number={1} />);
      expect(screen.getByText("Tidak dijawab")).toBeInTheDocument();
    });

    it("menampilkan poin diperoleh vs total poin", () => {
      render(
        <AnswerReview
          soal={makeSoal({ poin: 10 })}
          jawaban={makeJawaban({ poin_diperoleh: 10 })}
          number={1}
        />,
      );
      expect(screen.getByText("10 / 10")).toBeInTheDocument();
    });

    it("menampilkan poin 0 saat jawaban salah", () => {
      render(
        <AnswerReview
          soal={makeSoal({ poin: 10 })}
          jawaban={makeJawaban({ poin_diperoleh: 0, is_correct: false })}
          number={1}
        />,
      );
      expect(screen.getByText("0 / 10")).toBeInTheDocument();
    });
  });

  describe("pilihan ganda auto-graded", () => {
    it("menampilkan alert Benar saat is_correct=true", () => {
      render(
        <AnswerReview
          soal={makeSoal()}
          jawaban={makeJawaban({ is_correct: true })}
          number={1}
        />,
      );
      expect(screen.getByText(/Benar!/)).toBeInTheDocument();
    });

    it("menampilkan jawaban benar saat salah dan showCorrectAnswer=true (default)", () => {
      render(
        <AnswerReview
          soal={makeSoal()}
          jawaban={makeJawaban({ is_correct: false, poin_diperoleh: 0 })}
          number={1}
        />,
      );
      expect(screen.getByText("Jawaban yang Benar:")).toBeInTheDocument();
    });

    it("tidak menampilkan jawaban benar saat showCorrectAnswer=false", () => {
      render(
        <AnswerReview
          soal={makeSoal()}
          jawaban={makeJawaban({ is_correct: false })}
          number={1}
          showCorrectAnswer={false}
        />,
      );
      expect(screen.queryByText("Jawaban yang Benar:")).not.toBeInTheDocument();
    });
  });

  describe("essay / needs manual grading", () => {
    it("menampilkan notifikasi menunggu penilaian saat essay belum dinilai", () => {
      const essaySoal = makeSoal({
        tipe_soal: TIPE_SOAL.ESSAY,
        jawaban_benar: null,
      });
      const essayJawaban = makeJawaban({
        jawaban_mahasiswa: "Jawaban essay saya",
        jawaban: "Jawaban essay saya",
        poin_diperoleh: null,
        is_correct: null,
      });
      render(
        <AnswerReview soal={essaySoal} jawaban={essayJawaban} number={1} />,
      );
      expect(
        screen.getByText(/menunggu penilaian dari dosen/),
      ).toBeInTheDocument();
    });

    it("tidak menampilkan 'Jawaban yang Benar' untuk essay", () => {
      const essaySoal = makeSoal({
        tipe_soal: TIPE_SOAL.ESSAY,
        jawaban_benar: null,
      });
      const essayJawaban = makeJawaban({
        jawaban: "Ini jawaban",
        is_correct: false,
        poin_diperoleh: 0,
      });
      render(
        <AnswerReview soal={essaySoal} jawaban={essayJawaban} number={1} />,
      );
      expect(screen.queryByText("Jawaban yang Benar:")).not.toBeInTheDocument();
    });
  });

  describe("file upload", () => {
    it("menampilkan link saat jawaban URL file", () => {
      const fileUploadSoal = makeSoal({ tipe_soal: TIPE_SOAL.FILE_UPLOAD });
      const fileJawaban = makeJawaban({
        jawaban: "https://example.com/laporan.pdf",
        jawaban_mahasiswa: "https://example.com/laporan.pdf",
        poin_diperoleh: null,
      });
      render(
        <AnswerReview soal={fileUploadSoal} jawaban={fileJawaban} number={1} />,
      );
      expect(screen.getByText("Lihat File Laporan")).toBeInTheDocument();
    });
  });

  describe("penjelasan dan feedback", () => {
    it("menampilkan penjelasan soal jika ada", () => {
      const soalDenganPenjelasan = makeSoal({
        penjelasan: "Homeostasis adalah keseimbangan internal tubuh.",
      });
      render(
        <AnswerReview
          soal={soalDenganPenjelasan}
          jawaban={makeJawaban()}
          number={1}
        />,
      );
      expect(
        screen.getByText("Homeostasis adalah keseimbangan internal tubuh."),
      ).toBeInTheDocument();
    });

    it("menampilkan feedback dari dosen jika ada", () => {
      render(
        <AnswerReview
          soal={makeSoal()}
          jawaban={makeJawaban({ feedback: "Jawaban sudah bagus!" })}
          number={1}
        />,
      );
      expect(screen.getByText("Jawaban sudah bagus!")).toBeInTheDocument();
    });
  });
});

describe("AnswerReviewList", () => {
  it("merender semua soal dalam list", () => {
    const questions = [
      makeSoal({ id: "s1", pertanyaan: "Pertanyaan 1" }),
      makeSoal({ id: "s2", pertanyaan: "Pertanyaan 2" }),
    ];
    const answers = [
      makeJawaban({ soal_id: "s1" }),
      makeJawaban({ soal_id: "s2" }),
    ];
    render(<AnswerReviewList questions={questions} answers={answers} />);
    expect(screen.getByText("Pertanyaan 1")).toBeInTheDocument();
    expect(screen.getByText("Pertanyaan 2")).toBeInTheDocument();
  });

  it("merender tanpa crash jika answers kosong", () => {
    const questions = [makeSoal({ id: "s1" })];
    expect(() =>
      render(<AnswerReviewList questions={questions} answers={[]} />),
    ).not.toThrow();
  });

  it("merender nomor soal secara berurutan", () => {
    const questions = [
      makeSoal({ id: "s1" }),
      makeSoal({ id: "s2" }),
      makeSoal({ id: "s3" }),
    ];
    render(<AnswerReviewList questions={questions} answers={[]} />);
    expect(screen.getByText("Soal 1")).toBeInTheDocument();
    expect(screen.getByText("Soal 2")).toBeInTheDocument();
    expect(screen.getByText("Soal 3")).toBeInTheDocument();
  });
});
