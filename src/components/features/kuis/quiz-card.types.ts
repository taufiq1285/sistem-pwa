import type { Kuis } from "@/types/kuis.types";

export interface QuizCardProps {
  quiz: Kuis;
  onUpdate?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  showActions?: boolean;
}
