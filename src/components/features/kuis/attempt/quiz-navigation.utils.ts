import type { QuestionStatus } from "./QuizNavigation";

export function createQuestionStatusList(
  questions: Array<{ id: string }>,
  answers: Record<string, any>,
): QuestionStatus[] {
  return questions.map((question, index) => ({
    number: index + 1,
    id: question.id,
    isAnswered: !!answers[question.id],
    isFlagged: false,
  }));
}

export function getNavigationSummary(questions: QuestionStatus[]) {
  const total = questions.length;
  const answered = questions.filter((q) => q.isAnswered).length;
  const flagged = questions.filter((q) => q.isFlagged).length;

  return {
    total,
    answered,
    unanswered: total - answered,
    flagged,
    percentage: total > 0 ? (answered / total) * 100 : 0,
  };
}

export function findNextUnanswered(
  questions: QuestionStatus[],
  currentNumber: number,
): number | null {
  const forward = questions.find(
    (q) => q.number > currentNumber && !q.isAnswered,
  );
  if (forward) return forward.number;

  const backward = questions.find(
    (q) => q.number < currentNumber && !q.isAnswered,
  );
  if (backward) return backward.number;

  return null;
}

export function areAllQuestionsAnswered(questions: QuestionStatus[]): boolean {
  return questions.every((q) => q.isAnswered);
}

export function getUnansweredQuestions(questions: QuestionStatus[]): number[] {
  return questions.filter((q) => !q.isAnswered).map((q) => q.number);
}
