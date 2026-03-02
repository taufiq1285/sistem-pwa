/**
 * ScoreCard Unit Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreCard } from "@/components/features/kuis/result/ScoreCard";
import type { QuizScore } from "@/lib/utils/quiz-scoring";

function makeScore(overrides: Partial<QuizScore> = {}): QuizScore {
  return {
    total_poin: 75,
    max_poin: 100,
    percentage: 75,
    grade: "B",
    passed: true,
    correct_count: 15,
    incorrect_count: 4,
    unanswered_count: 1,
    ...overrides,
  };
}

describe("ScoreCard", () => {
  describe("mode normal (non-laporan)", () => {
    it("menampilkan grade letter", () => {
      render(<ScoreCard score={makeScore({ grade: "A", percentage: 95 })} />);
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("menampilkan persentase", () => {
      render(<ScoreCard score={makeScore({ percentage: 75 })} />);
      expect(screen.getByText(/75\.0/)).toBeInTheDocument();
    });

    it("menampilkan badge Lulus saat passed=true", () => {
      render(<ScoreCard score={makeScore({ passed: true })} />);
      expect(screen.getByText(/Lulus/)).toBeInTheDocument();
    });

    it("menampilkan badge Tidak Lulus saat passed=false", () => {
      render(<ScoreCard score={makeScore({ passed: false, grade: "D", percentage: 40 })} />);
      expect(screen.getByText(/Tidak Lulus/)).toBeInTheDocument();
    });

    it("menampilkan statistik detail saat showDetails=true (default)", () => {
      render(<ScoreCard score={makeScore({ correct_count: 15, incorrect_count: 4, unanswered_count: 1 })} />);
      expect(screen.getByText("15")).toBeInTheDocument(); // correct
      expect(screen.getByText("4")).toBeInTheDocument();  // incorrect
      expect(screen.getByText("1")).toBeInTheDocument();  // unanswered
    });

    it("tidak menampilkan statistik saat showDetails=false", () => {
      render(<ScoreCard score={makeScore()} showDetails={false} />);
      expect(screen.queryByText("Statistik Jawaban")).not.toBeInTheDocument();
    });

    it("menampilkan pesan Luar Biasa saat percentage >= 90", () => {
      render(<ScoreCard score={makeScore({ percentage: 95, grade: "A" })} />);
      expect(screen.getByText("Luar Biasa!")).toBeInTheDocument();
    });

    it("menampilkan pesan Bagus saat 70 <= percentage < 90", () => {
      render(<ScoreCard score={makeScore({ percentage: 80, grade: "B" })} />);
      expect(screen.getByText("Bagus!")).toBeInTheDocument();
    });

    it("menampilkan judul kuis jika diberikan", () => {
      render(<ScoreCard score={makeScore()} quizTitle="Pre-Test Praktikum" />);
      expect(screen.getByText("Pre-Test Praktikum")).toBeInTheDocument();
    });
  });

  describe("mode laporan (isLaporanMode=true)", () => {
    it("menampilkan badge Menunggu Penilaian saat total_poin=0", () => {
      render(
        <ScoreCard
          score={makeScore({ total_poin: 0, max_poin: 100, percentage: 0 })}
          isLaporanMode={true}
        />,
      );
      // Muncul di badge header DAN di body — gunakan getAllByText
      const elements = screen.getAllByText("Menunggu Penilaian");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it("menampilkan poin diperoleh saat sudah dinilai", () => {
      render(
        <ScoreCard
          score={makeScore({ total_poin: 85, max_poin: 100 })}
          isLaporanMode={true}
        />,
      );
      expect(screen.getByText("85")).toBeInTheDocument();
    });

    it("tidak menampilkan statistik Benar/Salah di laporan mode", () => {
      render(
        <ScoreCard score={makeScore()} isLaporanMode={true} />,
      );
      expect(screen.queryByText("Benar")).not.toBeInTheDocument();
    });
  });
});
