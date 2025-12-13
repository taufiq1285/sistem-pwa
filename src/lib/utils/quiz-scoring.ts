/**
 * Quiz Scoring Utilities
 *
 * Purpose: Auto-grading logic for quiz answers
 * Features:
 * - Auto-grade Multiple Choice questions
 * - Calculate total score
 * - Determine pass/fail status
 * - Generate feedback
 */

import type { Soal, Jawaban } from "@/types/kuis.types";
import { TIPE_SOAL } from "@/types/kuis.types";

// ============================================================================
// TYPES
// ============================================================================

export interface GradingResult {
  /**
   * Points earned for this answer
   */
  poin_diperoleh: number;

  /**
   * Is the answer correct?
   */
  is_correct: boolean;

  /**
   * Feedback message (optional)
   */
  feedback?: string;
}

export interface QuizScore {
  /**
   * Total points earned
   */
  total_poin: number;

  /**
   * Maximum possible points
   */
  max_poin: number;

  /**
   * Percentage score (0-100)
   */
  percentage: number;

  /**
   * Number of correct answers
   */
  correct_count: number;

  /**
   * Number of incorrect answers
   */
  incorrect_count: number;

  /**
   * Number of unanswered questions
   */
  unanswered_count: number;

  /**
   * Did the student pass?
   */
  passed: boolean;

  /**
   * Grade letter (A, B, C, D, E)
   */
  grade: string;
}

export interface GradedAnswer extends Jawaban {
  /**
   * The question data
   */
  soal: Soal;

  /**
   * Grading result
   */
  grading: GradingResult;
}

// ============================================================================
// AUTO-GRADING FUNCTIONS
// ============================================================================

/**
 * Auto-grade a single answer based on question type
 */
export function gradeAnswer(soal: Soal, jawaban: string): GradingResult {
  const tipeSoal = soal.tipe_soal;

  // Only auto-grade Multiple Choice
  if (tipeSoal !== TIPE_SOAL.PILIHAN_GANDA) {
    return {
      poin_diperoleh: 0,
      is_correct: false,
      feedback: "Jawaban perlu dinilai manual oleh dosen",
    };
  }

  // Check if answer is correct
  const isCorrect = checkAnswerCorrect(soal, jawaban);
  const poinDiperoleh = isCorrect ? soal.poin : 0;

  return {
    poin_diperoleh: poinDiperoleh,
    is_correct: isCorrect,
    feedback: isCorrect
      ? "Jawaban Anda benar!"
      : `Jawaban yang benar: ${getCorrectAnswerLabel(soal)}`,
  };
}

/**
 * Check if an answer is correct
 */
export function checkAnswerCorrect(soal: Soal, jawaban: string): boolean {
  if (!jawaban || !soal.jawaban_benar) return false;

  const tipeSoal = soal.tipe_soal;

  if (tipeSoal === TIPE_SOAL.PILIHAN_GANDA) {
    // For multiple choice, compare option IDs
    return jawaban.trim() === soal.jawaban_benar.trim();
  }

  return false;
}

/**
 * Get correct answer label for display
 */
export function getCorrectAnswerLabel(soal: Soal): string {
  const tipeSoal = soal.tipe_soal;

  if (tipeSoal === TIPE_SOAL.PILIHAN_GANDA && soal.opsi_jawaban) {
    const correctOption = soal.opsi_jawaban.find(
      (opt) => opt.id === soal.jawaban_benar,
    );
    return correctOption
      ? `${correctOption.label}. ${correctOption.text}`
      : soal.jawaban_benar || "-";
  }

  return soal.jawaban_benar || "-";
}

/**
 * Get student's answer label for display
 */
export function getAnswerLabel(soal: Soal, jawaban: string): string {
  if (!jawaban) return "Tidak dijawab";

  const tipeSoal = soal.tipe_soal;

  if (tipeSoal === TIPE_SOAL.PILIHAN_GANDA && soal.opsi_jawaban) {
    const selectedOption = soal.opsi_jawaban.find((opt) => opt.id === jawaban);
    return selectedOption
      ? `${selectedOption.label}. ${selectedOption.text}`
      : jawaban;
  }

  // For essay, return the text directly
  return jawaban;
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Calculate total quiz score from graded answers
 */
export function calculateQuizScore(
  questions: Soal[],
  answers: Jawaban[],
  passingScore: number = 70,
): QuizScore {
  // Create a map of answers by soal_id for quick lookup
  const answerMap = new Map<string, Jawaban>();
  answers.forEach((answer) => {
    answerMap.set(answer.soal_id, answer);
  });

  let totalPoin = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  // Calculate max possible points
  const maxPoin = questions.reduce((sum, q) => sum + q.poin, 0);

  // Grade each question
  questions.forEach((soal) => {
    const jawaban = answerMap.get(soal.id);

    if (!jawaban || !jawaban.jawaban) {
      unansweredCount++;
      return;
    }

    // Only auto-grade Multiple Choice questions
    if (soal.tipe_soal === TIPE_SOAL.PILIHAN_GANDA) {
      const result = gradeAnswer(soal, jawaban.jawaban);
      totalPoin += result.poin_diperoleh;

      if (result.is_correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    } else {
      // For essay, use manual grading if available
      if (
        jawaban.poin_diperoleh !== null &&
        jawaban.poin_diperoleh !== undefined
      ) {
        totalPoin += jawaban.poin_diperoleh;
        if (jawaban.is_correct) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      } else {
        // Not graded yet
        unansweredCount++;
      }
    }
  });

  // Calculate percentage
  const percentage = maxPoin > 0 ? (totalPoin / maxPoin) * 100 : 0;

  // Determine pass/fail
  const passed = percentage >= passingScore;

  // Calculate grade letter
  const grade = calculateGradeLetter(percentage);

  return {
    total_poin: totalPoin,
    max_poin: maxPoin,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unanswered_count: unansweredCount,
    passed,
    grade,
  };
}

/**
 * Calculate grade letter based on percentage
 */
export function calculateGradeLetter(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "E";
}

/**
 * Get grade color based on grade letter
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-green-600 bg-green-100 border-green-300";
    case "B":
      return "text-blue-600 bg-blue-100 border-blue-300";
    case "C":
      return "text-yellow-600 bg-yellow-100 border-yellow-300";
    case "D":
      return "text-orange-600 bg-orange-100 border-orange-300";
    case "E":
      return "text-red-600 bg-red-100 border-red-300";
    default:
      return "text-gray-600 bg-gray-100 border-gray-300";
  }
}

// ============================================================================
// BATCH GRADING
// ============================================================================

/**
 * Grade all answers in an attempt and return graded answers
 */
export function gradeAllAnswers(
  questions: Soal[],
  answers: Jawaban[],
): GradedAnswer[] {
  const gradedAnswers: GradedAnswer[] = [];

  // Create a map of questions by ID
  const questionMap = new Map<string, Soal>();
  questions.forEach((q) => questionMap.set(q.id, q));

  answers.forEach((jawaban) => {
    const soal = questionMap.get(jawaban.soal_id);
    if (!soal) return;

    const grading = gradeAnswer(soal, jawaban.jawaban);

    gradedAnswers.push({
      ...jawaban,
      soal,
      grading,
    });
  });

  return gradedAnswers;
}

/**
 * Check if all questions can be auto-graded
 */
export function canAutoGrade(questions: Soal[]): boolean {
  return questions.every((q) => q.tipe_soal === TIPE_SOAL.PILIHAN_GANDA);
}

/**
 * Get list of questions that need manual grading
 */
export function getManualGradingRequired(questions: Soal[]): Soal[] {
  return questions.filter((q) => q.tipe_soal !== TIPE_SOAL.PILIHAN_GANDA);
}

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

/**
 * Get quiz attempt statistics
 */
export interface QuizStats {
  total_questions: number;
  answered: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  pending_grading: number;
  accuracy: number; // Percentage of correct answers out of answered questions
}

export function getQuizStats(questions: Soal[], answers: Jawaban[]): QuizStats {
  const answerMap = new Map<string, Jawaban>();
  answers.forEach((a) => answerMap.set(a.soal_id, a));

  let answered = 0;
  let correct = 0;
  let incorrect = 0;
  let pendingGrading = 0;

  questions.forEach((soal) => {
    const jawaban = answerMap.get(soal.id);

    if (!jawaban || !jawaban.jawaban) {
      return; // Unanswered
    }

    answered++;

    // Check if already graded
    if (jawaban.is_correct !== null && jawaban.is_correct !== undefined) {
      if (jawaban.is_correct) {
        correct++;
      } else {
        incorrect++;
      }
    } else if (soal.tipe_soal === TIPE_SOAL.PILIHAN_GANDA) {
      // Can auto-grade
      const result = gradeAnswer(soal, jawaban.jawaban);
      if (result.is_correct) {
        correct++;
      } else {
        incorrect++;
      }
    } else {
      // Needs manual grading
      pendingGrading++;
    }
  });

  const unanswered = questions.length - answered;
  const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

  return {
    total_questions: questions.length,
    answered,
    unanswered,
    correct,
    incorrect,
    pending_grading: pendingGrading,
    accuracy: Math.round(accuracy * 100) / 100,
  };
}
