import React from "react";
import type { QuizCardProps } from "./quiz-card.types";
import { QuizCardCBT } from "./QuizCardCBT";
import { QuizCardLaporan } from "./QuizCardLaporan";

export function QuizCard(props: QuizCardProps) {
  const quizType = (props.quiz as any).tipe_kuis || "campuran";
  const isLaporan = quizType === "essay";

  return isLaporan ? (
    <QuizCardLaporan {...props} />
  ) : (
    <QuizCardCBT {...props} />
  );
}
