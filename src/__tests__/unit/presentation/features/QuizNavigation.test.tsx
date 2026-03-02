/**
 * QuizNavigation Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QuizNavigation,
  createQuestionStatusList,
  getNavigationSummary,
  findNextUnanswered,
  areAllQuestionsAnswered,
  getUnansweredQuestions,
} from "@/components/features/kuis/attempt/QuizNavigation";
import type { QuestionStatus } from "@/components/features/kuis/attempt/QuizNavigation";

function makeQuestions(count: number, answeredUntil = 0): QuestionStatus[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    id: `soal-${i + 1}`,
    isAnswered: i < answeredUntil,
    isFlagged: false,
  }));
}

describe("QuizNavigation Component", () => {
  const onQuestionClick = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  describe("rendering", () => {
    it("menampilkan judul Navigasi Soal", () => {
      render(
        <QuizNavigation
          questions={makeQuestions(5)}
          currentQuestion={1}
          onQuestionClick={onQuestionClick}
        />,
      );
      expect(screen.getByText("Navigasi Soal")).toBeInTheDocument();
    });

    it("menampilkan badge jumlah soal terjawab", () => {
      render(
        <QuizNavigation
          questions={makeQuestions(5, 2)}
          currentQuestion={1}
          onQuestionClick={onQuestionClick}
        />,
      );
      expect(screen.getByText("2/5")).toBeInTheDocument();
    });

    it("menampilkan semua tombol soal", () => {
      render(
        <QuizNavigation
          questions={makeQuestions(3)}
          currentQuestion={1}
          onQuestionClick={onQuestionClick}
        />,
      );
      const buttons = screen.getAllByRole("button");
      // Tombol soal ada di antara semua button — verifikasi jumlahnya minimal 3
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("menampilkan progress bar di full mode", () => {
      render(
        <QuizNavigation
          questions={makeQuestions(5, 3)}
          currentQuestion={1}
          onQuestionClick={onQuestionClick}
        />,
      );
      expect(screen.getByText("60%")).toBeInTheDocument();
    });

    it("tidak menampilkan progress bar di compact mode", () => {
      render(
        <QuizNavigation
          questions={makeQuestions(5)}
          currentQuestion={1}
          onQuestionClick={onQuestionClick}
          compact={true}
        />,
      );
      expect(screen.queryByText(/Progress/)).not.toBeInTheDocument();
    });

    it("menampilkan total poin jika diberikan", () => {
      render(
        <QuizNavigation
          questions={makeQuestions(5)}
          currentQuestion={1}
          onQuestionClick={onQuestionClick}
          totalPoints={100}
        />,
      );
      expect(screen.getByText("100 poin")).toBeInTheDocument();
    });
  });

  describe("interaksi", () => {
    it("memanggil onQuestionClick saat nomor soal diklik", async () => {
      render(
        <QuizNavigation
          questions={makeQuestions(3)}
          currentQuestion={1}
          onQuestionClick={onQuestionClick}
        />,
      );
      await userEvent.click(screen.getByText("2"));
      expect(onQuestionClick).toHaveBeenCalledWith(2);
    });
  });
});

describe("QuizNavigation Helper Functions", () => {
  describe("createQuestionStatusList", () => {
    it("membuat status list dari array soal dan answers", () => {
      const soal = [{ id: "s1" }, { id: "s2" }, { id: "s3" }];
      const answers = { s1: "jawaban A" };
      const result = createQuestionStatusList(soal, answers);

      expect(result).toHaveLength(3);
      expect(result[0].isAnswered).toBe(true);
      expect(result[1].isAnswered).toBe(false);
      expect(result[2].isAnswered).toBe(false);
      expect(result[0].number).toBe(1);
    });
  });

  describe("getNavigationSummary", () => {
    it("menghitung summary dengan benar", () => {
      const questions = makeQuestions(5, 3);
      const summary = getNavigationSummary(questions);

      expect(summary.total).toBe(5);
      expect(summary.answered).toBe(3);
      expect(summary.unanswered).toBe(2);
      expect(summary.flagged).toBe(0);
      expect(summary.percentage).toBe(60);
    });

    it("mengembalikan 0% saat tidak ada soal", () => {
      const summary = getNavigationSummary([]);
      expect(summary.percentage).toBe(0);
    });
  });

  describe("findNextUnanswered", () => {
    it("menemukan soal unanswered berikutnya ke depan", () => {
      const questions = makeQuestions(5, 2); // soal 1-2 sudah dijawab
      expect(findNextUnanswered(questions, 2)).toBe(3);
    });

    it("menemukan soal unanswered ke belakang jika depan tidak ada", () => {
      const questions: QuestionStatus[] = [
        { number: 1, id: "s1", isAnswered: false },
        { number: 2, id: "s2", isAnswered: true },
        { number: 3, id: "s3", isAnswered: true },
      ];
      expect(findNextUnanswered(questions, 3)).toBe(1);
    });

    it("mengembalikan null jika semua sudah dijawab", () => {
      const questions = makeQuestions(3, 3);
      expect(findNextUnanswered(questions, 2)).toBeNull();
    });
  });

  describe("areAllQuestionsAnswered", () => {
    it("mengembalikan true jika semua soal dijawab", () => {
      expect(areAllQuestionsAnswered(makeQuestions(3, 3))).toBe(true);
    });

    it("mengembalikan false jika ada soal belum dijawab", () => {
      expect(areAllQuestionsAnswered(makeQuestions(3, 2))).toBe(false);
    });
  });

  describe("getUnansweredQuestions", () => {
    it("mengembalikan nomor soal yang belum dijawab", () => {
      const questions = makeQuestions(4, 2); // soal 1-2 dijawab, 3-4 belum
      expect(getUnansweredQuestions(questions)).toEqual([3, 4]);
    });

    it("mengembalikan array kosong jika semua dijawab", () => {
      expect(getUnansweredQuestions(makeQuestions(3, 3))).toEqual([]);
    });
  });
});
