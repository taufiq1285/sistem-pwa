import { TIPE_KUIS } from "@/types/kuis.types";
import type { TipeKuis } from "@/types/kuis.types";

export function getAllowedQuestionTypes(quizType: TipeKuis): string[] {
  if (quizType === TIPE_KUIS.PILIHAN_GANDA) {
    return ["Pilihan Ganda (A, B, C, D...)", "Benar/Salah"];
  }

  if (quizType === TIPE_KUIS.ESSAY) {
    return ["Essay (jawaban panjang)", "File Upload (Laporan)"];
  }

  return ["Pilihan Ganda", "Benar/Salah", "Essay", "Jawaban Singkat"];
}

export function isQuestionTypeAllowed(
  quizType: TipeKuis,
  questionType: string,
): boolean {
  if (quizType === TIPE_KUIS.CAMPURAN) {
    return true;
  }

  if (quizType === TIPE_KUIS.PILIHAN_GANDA) {
    return questionType === "pilihan_ganda" || questionType === "benar_salah";
  }

  if (quizType === TIPE_KUIS.ESSAY) {
    return questionType === "essay" || questionType === "file_upload";
  }

  return false;
}
