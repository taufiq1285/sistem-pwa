import type { OpsiJawaban } from "@/types/kuis.types";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export function validateMultipleChoice(options: OpsiJawaban[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.length < 2) {
    errors.push("Minimal 2 opsi jawaban diperlukan");
  }

  if (options.length > 6) {
    errors.push("Maksimal 6 opsi jawaban");
  }

  const hasEmptyOptions = options.some((opt) => !opt.text.trim());
  if (hasEmptyOptions) {
    errors.push("Semua opsi harus diisi");
  }

  const correctAnswers = options.filter((opt) => opt.is_correct);
  if (correctAnswers.length === 0) {
    errors.push("Harus ada satu jawaban yang benar");
  }
  if (correctAnswers.length > 1) {
    errors.push("Hanya boleh ada satu jawaban yang benar");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateDefaultOptions(count: number = 4): OpsiJawaban[] {
  return Array.from({ length: count }, (_, i) => ({
    id: (i + 1).toString(),
    label: OPTION_LABELS[i] || `Option ${i + 1}`,
    text: "",
    is_correct: false,
  }));
}
