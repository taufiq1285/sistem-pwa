import React from "react";
import { CheckCircle2, Clock, EyeOff, XCircle } from "lucide-react";
import type { Kuis } from "@/types/kuis.types";

export function getQuizStatus(quiz: Kuis): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<{ className?: string }>;
} {
  const isActive = (quiz as any).is_active ?? (quiz as any).status === "active";
  const now = new Date();
  const startDate = quiz.tanggal_mulai ? new Date(quiz.tanggal_mulai) : null;
  const endDate = quiz.tanggal_selesai ? new Date(quiz.tanggal_selesai) : null;

  if (!isActive) {
    return {
      label: "Draft",
      variant: "secondary",
      icon: EyeOff,
    };
  }

  if (startDate && endDate) {
    if (now < startDate) {
      return {
        label: "Terjadwal",
        variant: "outline",
        icon: Clock,
      };
    }

    if (now >= startDate && now <= endDate) {
      return {
        label: "Aktif",
        variant: "default",
        icon: CheckCircle2,
      };
    }
  } else {
    return {
      label: "Aktif",
      variant: "default",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Selesai",
    variant: "secondary",
    icon: XCircle,
  };
}
