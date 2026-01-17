/**
 * Quiz Scoring Unit Tests
 *
 * Tests for critical business logic:
 * - Auto-grading algorithms
 * - Score calculation
 * - Grade letter assignment
 * - Statistics generation
 */

import { describe, it, expect } from "vitest";
import {
  gradeAnswer,
  checkAnswerCorrect,
  getCorrectAnswerLabel,
  getAnswerLabel,
  calculateQuizScore,
  calculateGradeLetter,
  getGradeColor,
  gradeAllAnswers,
  canAutoGrade,
  getManualGradingRequired,
  getQuizStats,
} from "../../../lib/utils/quiz-scoring";
import { TIPE_SOAL, type Soal, type Jawaban } from "../../../types/kuis.types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockMultipleChoiceQuestion: Soal = {
  id: "soal-1",
  kuis_id: "kuis-1",
  pertanyaan: "Apa ibukota Indonesia?",
  tipe_soal: TIPE_SOAL.PILIHAN_GANDA,
  opsi_jawaban: [
    { id: "a", label: "A", text: "Bandung" },
    { id: "b", label: "B", text: "Jakarta" },
    { id: "c", label: "C", text: "Surabaya" },
    { id: "d", label: "D", text: "Medan" },
  ],
  jawaban_benar: "b",
  poin: 10,
  urutan: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockTrueFalseQuestion: Soal = {
  id: "soal-2",
  kuis_id: "kuis-1",
  pertanyaan: "Bumi itu bulat",
  tipe_soal: TIPE_SOAL.BENAR_SALAH,
  jawaban_benar: "true",
  poin: 5,
  urutan: 2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockEssayQuestion: Soal = {
  id: "soal-3",
  kuis_id: "kuis-1",
  pertanyaan: "Jelaskan tentang pemrograman",
  tipe_soal: TIPE_SOAL.ESSAY,
  jawaban_benar: null,
  poin: 20,
  urutan: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockShortAnswerQuestion: Soal = {
  id: "soal-4",
  kuis_id: "kuis-1",
  pertanyaan: "Sebutkan 3 bahasa pemrograman",
  tipe_soal: TIPE_SOAL.JAWABAN_SINGKAT,
  jawaban_benar: "JavaScript, Python, Java",
  poin: 15,
  urutan: 4,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================================
// GRADING LOGIC TESTS
// ============================================================================

describe("Quiz Scoring - Grading Logic", () => {
  describe("gradeAnswer", () => {
    it("should correctly grade a correct multiple choice answer", () => {
      const result = gradeAnswer(mockMultipleChoiceQuestion, "b");

      expect(result.is_correct).toBe(true);
      expect(result.poin_diperoleh).toBe(10);
      expect(result.feedback).toBe("Jawaban Anda benar!");
    });

    it("should correctly grade an incorrect multiple choice answer", () => {
      const result = gradeAnswer(mockMultipleChoiceQuestion, "a");

      expect(result.is_correct).toBe(false);
      expect(result.poin_diperoleh).toBe(0);
      expect(result.feedback).toContain("Jawaban yang benar");
    });

    it("should correctly grade a correct true/false answer", () => {
      const result = gradeAnswer(mockTrueFalseQuestion, "true");

      expect(result.is_correct).toBe(true);
      expect(result.poin_diperoleh).toBe(5);
      expect(result.feedback).toBe("Jawaban Anda benar!");
    });

    it("should correctly grade an incorrect true/false answer", () => {
      const result = gradeAnswer(mockTrueFalseQuestion, "false");

      expect(result.is_correct).toBe(false);
      expect(result.poin_diperoleh).toBe(0);
    });

    it("should handle essay questions (manual grading required)", () => {
      const result = gradeAnswer(mockEssayQuestion, "Some essay answer");

      expect(result.is_correct).toBe(false);
      expect(result.poin_diperoleh).toBe(0);
      expect(result.feedback).toContain("dinilai manual");
    });

    it("should auto-grade short answer questions when correct answer is set", () => {
      const result = gradeAnswer(
        mockShortAnswerQuestion,
        "JavaScript, Python, Java"
      );

      // Short answers are now auto-graded
      expect(result.is_correct).toBe(true);
      expect(result.poin_diperoleh).toBe(15);
      expect(result.feedback).toBe("Jawaban Anda benar!");
    });

    it("should handle case-insensitive true/false answers", () => {
      const result1 = gradeAnswer(mockTrueFalseQuestion, "TRUE");
      const result2 = gradeAnswer(mockTrueFalseQuestion, "True");
      const result3 = gradeAnswer(mockTrueFalseQuestion, " true ");

      expect(result1.is_correct).toBe(true);
      expect(result2.is_correct).toBe(true);
      expect(result3.is_correct).toBe(true);
    });

    it("should handle whitespace in multiple choice answers", () => {
      const result = gradeAnswer(mockMultipleChoiceQuestion, " b ");

      expect(result.is_correct).toBe(true);
    });
  });

  describe("checkAnswerCorrect", () => {
    it("should return false for empty answer", () => {
      expect(checkAnswerCorrect(mockMultipleChoiceQuestion, "")).toBe(false);
      expect(checkAnswerCorrect(mockMultipleChoiceQuestion, null as any)).toBe(
        false
      );
    });

    it("should return false when no correct answer defined", () => {
      const questionWithoutAnswer = { ...mockEssayQuestion };
      expect(checkAnswerCorrect(questionWithoutAnswer, "any answer")).toBe(
        false
      );
    });

    it("should correctly check multiple choice answers", () => {
      expect(checkAnswerCorrect(mockMultipleChoiceQuestion, "b")).toBe(true);
      expect(checkAnswerCorrect(mockMultipleChoiceQuestion, "a")).toBe(false);
    });

    it("should correctly check true/false answers", () => {
      expect(checkAnswerCorrect(mockTrueFalseQuestion, "true")).toBe(true);
      expect(checkAnswerCorrect(mockTrueFalseQuestion, "false")).toBe(false);
    });
  });
});

// ============================================================================
// LABEL FORMATTING TESTS
// ============================================================================

describe("Quiz Scoring - Label Formatting", () => {
  describe("getCorrectAnswerLabel", () => {
    it("should return formatted label for multiple choice", () => {
      const label = getCorrectAnswerLabel(mockMultipleChoiceQuestion);

      expect(label).toBe("B. Jakarta");
    });

    it("should return Benar/Salah for true/false", () => {
      expect(getCorrectAnswerLabel(mockTrueFalseQuestion)).toBe("Benar");

      const falseQuestion = {
        ...mockTrueFalseQuestion,
        jawaban_benar: "false",
      };
      expect(getCorrectAnswerLabel(falseQuestion)).toBe("Salah");
    });

    it("should handle missing options gracefully", () => {
      const questionWithoutOptions = {
        ...mockMultipleChoiceQuestion,
        opsi_jawaban: [],
      };
      const label = getCorrectAnswerLabel(questionWithoutOptions);

      expect(label).toBe("b");
    });

    it("should return dash for essay questions without answer", () => {
      const label = getCorrectAnswerLabel(mockEssayQuestion);

      expect(label).toBe("-");
    });
  });

  describe("getAnswerLabel", () => {
    it('should return "Tidak dijawab" for empty answer', () => {
      expect(getAnswerLabel(mockMultipleChoiceQuestion, "")).toBe(
        "Tidak dijawab"
      );
      expect(getAnswerLabel(mockMultipleChoiceQuestion, null as any)).toBe(
        "Tidak dijawab"
      );
    });

    it("should format multiple choice answer", () => {
      const label = getAnswerLabel(mockMultipleChoiceQuestion, "b");

      expect(label).toBe("B. Jakarta");
    });

    it("should format true/false answer", () => {
      expect(getAnswerLabel(mockTrueFalseQuestion, "true")).toBe("Benar");
      expect(getAnswerLabel(mockTrueFalseQuestion, "false")).toBe("Salah");
    });

    it("should return raw text for essay answers", () => {
      const essayAnswer = "This is my essay answer";
      const label = getAnswerLabel(mockEssayQuestion, essayAnswer);

      expect(label).toBe(essayAnswer);
    });
  });
});

// ============================================================================
// SCORE CALCULATION TESTS
// ============================================================================

describe("Quiz Scoring - Score Calculation", () => {
  describe("calculateQuizScore", () => {
    it("should calculate perfect score correctly", () => {
      const questions = [mockMultipleChoiceQuestion, mockTrueFalseQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "jawaban-2",
          attempt_id: "attempt-1",
          soal_id: "soal-2",
          jawaban: "true",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const score = calculateQuizScore(questions, answers);

      expect(score.total_poin).toBe(15);
      expect(score.max_poin).toBe(15);
      expect(score.percentage).toBe(100);
      expect(score.correct_count).toBe(2);
      expect(score.incorrect_count).toBe(0);
      expect(score.unanswered_count).toBe(0);
      expect(score.passed).toBe(true);
      expect(score.grade).toBe("A");
    });

    it("should calculate partial score correctly", () => {
      const questions = [mockMultipleChoiceQuestion, mockTrueFalseQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b", // Correct (10 points)
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "jawaban-2",
          attempt_id: "attempt-1",
          soal_id: "soal-2",
          jawaban: "false", // Incorrect (0 points)
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const score = calculateQuizScore(questions, answers);

      expect(score.total_poin).toBe(10);
      expect(score.max_poin).toBe(15);
      expect(score.percentage).toBeCloseTo(66.67, 1);
      expect(score.correct_count).toBe(1);
      expect(score.incorrect_count).toBe(1);
      expect(score.passed).toBe(false); // Default passing score is 70%
    });

    it("should handle unanswered questions", () => {
      const questions = [mockMultipleChoiceQuestion, mockTrueFalseQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        // soal-2 not answered
      ];

      const score = calculateQuizScore(questions, answers);

      expect(score.total_poin).toBe(10);
      expect(score.unanswered_count).toBe(1);
    });

    it("should handle manual grading for essay questions", () => {
      const questions = [mockMultipleChoiceQuestion, mockEssayQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "jawaban-2",
          attempt_id: "attempt-1",
          soal_id: "soal-3",
          jawaban: "Essay answer",
          poin_diperoleh: 15, // Manually graded
          is_correct: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const score = calculateQuizScore(questions, answers);

      expect(score.total_poin).toBe(25); // 10 + 15
      expect(score.correct_count).toBe(2);
    });

    it("should respect custom passing score", () => {
      const questions = [mockMultipleChoiceQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const score = calculateQuizScore(questions, answers, 100);

      expect(score.passed).toBe(true); // Got 100%

      const score2 = calculateQuizScore(questions, answers, 50);
      expect(score2.passed).toBe(true); // Got 100%, passing is 50%
    });

    it("should handle empty quiz", () => {
      const score = calculateQuizScore([], []);

      expect(score.total_poin).toBe(0);
      expect(score.max_poin).toBe(0);
      expect(score.percentage).toBe(0);
      expect(score.passed).toBe(false);
    });
  });

  describe("calculateGradeLetter", () => {
    it("should assign A for 90-100%", () => {
      expect(calculateGradeLetter(100)).toBe("A");
      expect(calculateGradeLetter(95)).toBe("A");
      expect(calculateGradeLetter(90)).toBe("A");
    });

    it("should assign B for 80-89%", () => {
      expect(calculateGradeLetter(89)).toBe("B");
      expect(calculateGradeLetter(85)).toBe("B");
      expect(calculateGradeLetter(80)).toBe("B");
    });

    it("should assign C for 70-79%", () => {
      expect(calculateGradeLetter(79)).toBe("C");
      expect(calculateGradeLetter(75)).toBe("C");
      expect(calculateGradeLetter(70)).toBe("C");
    });

    it("should assign D for 60-69%", () => {
      expect(calculateGradeLetter(69)).toBe("D");
      expect(calculateGradeLetter(65)).toBe("D");
      expect(calculateGradeLetter(60)).toBe("D");
    });

    it("should assign E for below 60%", () => {
      expect(calculateGradeLetter(59)).toBe("E");
      expect(calculateGradeLetter(30)).toBe("E");
      expect(calculateGradeLetter(0)).toBe("E");
    });
  });

  describe("getGradeColor", () => {
    it("should return correct color for each grade", () => {
      expect(getGradeColor("A")).toContain("green");
      expect(getGradeColor("B")).toContain("blue");
      expect(getGradeColor("C")).toContain("yellow");
      expect(getGradeColor("D")).toContain("orange");
      expect(getGradeColor("E")).toContain("red");
      expect(getGradeColor("X")).toContain("gray");
    });
  });
});

// ============================================================================
// BATCH GRADING TESTS
// ============================================================================

describe("Quiz Scoring - Batch Grading", () => {
  describe("gradeAllAnswers", () => {
    it("should grade all answers in batch", () => {
      const questions = [mockMultipleChoiceQuestion, mockTrueFalseQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "jawaban-2",
          attempt_id: "attempt-1",
          soal_id: "soal-2",
          jawaban: "false",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const graded = gradeAllAnswers(questions, answers);

      expect(graded).toHaveLength(2);
      expect(graded[0].grading.is_correct).toBe(true);
      expect(graded[1].grading.is_correct).toBe(false);
      expect(graded[0].soal).toEqual(mockMultipleChoiceQuestion);
    });

    it("should skip answers without matching question", () => {
      const questions = [mockMultipleChoiceQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "non-existent",
          jawaban: "b",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const graded = gradeAllAnswers(questions, answers);

      expect(graded).toHaveLength(0);
    });
  });

  describe("canAutoGrade", () => {
    it("should return true for all auto-gradable questions", () => {
      const questions = [mockMultipleChoiceQuestion, mockTrueFalseQuestion];

      expect(canAutoGrade(questions)).toBe(true);
    });

    it("should return false if any question requires manual grading", () => {
      const questions = [mockMultipleChoiceQuestion, mockEssayQuestion];

      expect(canAutoGrade(questions)).toBe(false);
    });

    it("should return true for empty array", () => {
      expect(canAutoGrade([])).toBe(true);
    });
  });

  describe("getManualGradingRequired", () => {
    it("should return only manual grading questions (essay only)", () => {
      const questions = [
        mockMultipleChoiceQuestion,
        mockEssayQuestion,
        mockTrueFalseQuestion,
        mockShortAnswerQuestion,
      ];

      const manual = getManualGradingRequired(questions);

      // Only ESSAY requires manual grading now
      // PILIHAN_GANDA, BENAR_SALAH, and JAWABAN_SINGKAT are auto-gradable
      expect(manual).toHaveLength(1);
      expect(manual).toContain(mockEssayQuestion);
    });

    it("should return empty array if all auto-gradable", () => {
      const questions = [mockMultipleChoiceQuestion, mockTrueFalseQuestion];

      const manual = getManualGradingRequired(questions);

      expect(manual).toHaveLength(0);
    });
  });
});

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe("Quiz Scoring - Statistics", () => {
  describe("getQuizStats", () => {
    it("should calculate comprehensive statistics", () => {
      const questions = [
        mockMultipleChoiceQuestion,
        mockTrueFalseQuestion,
        mockEssayQuestion,
      ];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b", // Correct
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "jawaban-2",
          attempt_id: "attempt-1",
          soal_id: "soal-2",
          jawaban: "false", // Incorrect
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        // soal-3 (essay) not answered
      ];

      const stats = getQuizStats(questions, answers);

      expect(stats.total_questions).toBe(3);
      expect(stats.answered).toBe(2);
      expect(stats.unanswered).toBe(1);
      expect(stats.correct).toBe(1);
      expect(stats.incorrect).toBe(1);
      expect(stats.pending_grading).toBe(0);
      expect(stats.accuracy).toBe(50); // 1 correct out of 2 answered
    });

    it("should handle manually graded answers", () => {
      const questions = [mockEssayQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-3",
          jawaban: "Essay answer",
          poin_diperoleh: 18,
          is_correct: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const stats = getQuizStats(questions, answers);

      expect(stats.answered).toBe(1);
      expect(stats.correct).toBe(1);
      expect(stats.pending_grading).toBe(0);
    });

    it("should count pending manual grading", () => {
      const questions = [mockEssayQuestion];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-3",
          jawaban: "Essay answer",
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const stats = getQuizStats(questions, answers);

      expect(stats.answered).toBe(1);
      expect(stats.pending_grading).toBe(1);
    });

    it("should handle empty stats", () => {
      const stats = getQuizStats([], []);

      expect(stats.total_questions).toBe(0);
      expect(stats.answered).toBe(0);
      expect(stats.accuracy).toBe(0);
    });

    it("should calculate accuracy correctly", () => {
      const question3: Soal = {
        id: "soal-5",
        kuis_id: "kuis-1",
        pertanyaan: "Apa bahasa pemrograman?",
        tipe_soal: TIPE_SOAL.PILIHAN_GANDA,
        opsi_jawaban: [
          { id: "a", label: "A", text: "Java" },
          { id: "b", label: "B", text: "HTML" },
        ],
        jawaban_benar: "a",
        poin: 10,
        urutan: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const questions = [
        mockMultipleChoiceQuestion,
        mockTrueFalseQuestion,
        question3,
      ];
      const answers: Jawaban[] = [
        {
          id: "jawaban-1",
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "b", // Correct
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "jawaban-2",
          attempt_id: "attempt-1",
          soal_id: "soal-2",
          jawaban: "true", // Correct
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "jawaban-3",
          attempt_id: "attempt-1",
          soal_id: "soal-5",
          jawaban: "b", // Incorrect (correct answer is 'a')
          poin_diperoleh: null,
          is_correct: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const stats = getQuizStats(questions, answers);

      expect(stats.accuracy).toBeCloseTo(66.67, 1); // 2 out of 3 correct
    });
  });
});
