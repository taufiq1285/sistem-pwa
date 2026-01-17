/**
 * QuizTypeSelector
 *
 * Purpose: Let dosen choose quiz type before creating quiz
 * Used by: KuisCreatePage
 * Features: Select Pilihan Ganda, Essay, or Campuran
 */

import { CheckCircle2, FileText, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIPE_KUIS, TIPE_KUIS_LABELS } from "@/types/kuis.types";
import type { TipeKuis } from "@/types/kuis.types";

// ============================================================================
// TYPES
// ============================================================================

interface QuizTypeSelectorProps {
  /**
   * Callback when quiz type is selected
   */
  onSelect: (type: TipeKuis) => void;

  /**
   * Currently selected type (if any)
   */
  selectedType?: TipeKuis;

  /**
   * Callback when cancel
   */
}

interface QuizTypeOption {
  type: TipeKuis;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  questionTypes: string[];
  color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUIZ_TYPE_OPTIONS: QuizTypeOption[] = [
  {
    type: TIPE_KUIS.PILIHAN_GANDA,
    label: TIPE_KUIS_LABELS.pilihan_ganda,
    description:
      "Tugas dengan soal pilihan ganda dan benar/salah. Penilaian otomatis.",
    icon: CheckCircle2,
    questionTypes: ["Pilihan Ganda (A, B, C, D...)", "Benar/Salah"],
    color: "blue",
  },
  {
    type: TIPE_KUIS.ESSAY,
    label: TIPE_KUIS_LABELS.essay,
    description:
      "Tugas dengan soal essay (laporan praktikum). Dosen menilai secara manual.",
    icon: FileText,
    questionTypes: ["Essay (jawaban panjang)"],
    color: "purple",
  },
  {
    type: TIPE_KUIS.CAMPURAN,
    label: TIPE_KUIS_LABELS.campuran,
    description: "Tugas dengan berbagai tipe soal (pilihan ganda, essay, dll).",
    icon: Layers,
    questionTypes: ["Pilihan Ganda", "Benar/Salah", "Essay", "Jawaban Singkat"],
    color: "green",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function QuizTypeSelector({
  onSelect,
  selectedType,
}: QuizTypeSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Pilih Tipe Tugas</h2>
        <p className="text-muted-foreground">
          Pilih jenis tugas praktikum yang ingin Anda buat
        </p>
      </div>

      {/* Quiz Type Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUIZ_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;

          return (
            <Card
              key={option.type}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                isSelected && "ring-2 ring-primary",
              )}
              onClick={() => onSelect(option.type)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      option.color === "blue" && "bg-blue-100 dark:bg-blue-900",
                      option.color === "purple" &&
                        "bg-purple-100 dark:bg-purple-900",
                      option.color === "green" &&
                        "bg-green-100 dark:bg-green-900",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        option.color === "blue" &&
                          "text-blue-600 dark:text-blue-400",
                        option.color === "purple" &&
                          "text-purple-600 dark:text-purple-400",
                        option.color === "green" &&
                          "text-green-600 dark:text-green-400",
                      )}
                    />
                  </div>

                  {isSelected && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Dipilih
                    </Badge>
                  )}
                </div>

                <CardTitle className="mt-4">{option.label}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipe Soal:</p>
                  <ul className="space-y-1">
                    {option.questionTypes.map((type, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {type}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground">
        Anda dapat mengubah tipe kuis nanti jika diperlukan
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get allowed question types for a quiz type
 */
export function getAllowedQuestionTypes(quizType: TipeKuis): string[] {
  const option = QUIZ_TYPE_OPTIONS.find((opt) => opt.type === quizType);
  return option?.questionTypes || [];
}

/**
 * Check if a question type is allowed for a quiz type
 */
export function isQuestionTypeAllowed(
  quizType: TipeKuis,
  questionType: string,
): boolean {
  if (quizType === TIPE_KUIS.CAMPURAN) {
    return true; // All types allowed
  }

  if (quizType === TIPE_KUIS.PILIHAN_GANDA) {
    return questionType === "pilihan_ganda" || questionType === "benar_salah";
  }

  if (quizType === TIPE_KUIS.ESSAY) {
    return questionType === "essay";
  }

  return false;
}
