import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QuizTypeSelector,
  getAllowedQuestionTypes,
  isQuestionTypeAllowed,
} from "@/components/features/kuis/QuizTypeSelector";
import { TIPE_KUIS } from "@/types/kuis.types";

describe("QuizTypeSelector", () => {
  it("menampilkan semua opsi tipe kuis dan trigger onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<QuizTypeSelector onSelect={onSelect} selectedType={TIPE_KUIS.ESSAY} />);

    expect(screen.getByText("Pilih Tipe Tugas")).toBeInTheDocument();
    expect(screen.getByText(/dipilih/i)).toBeInTheDocument();

    await user.click(screen.getAllByText(/^Pilihan Ganda$/i)[0]);
    expect(onSelect).toHaveBeenCalledWith(TIPE_KUIS.PILIHAN_GANDA);
  });

  it("helper getAllowedQuestionTypes dan isQuestionTypeAllowed bekerja sesuai tipe", () => {
    const essayAllowed = getAllowedQuestionTypes(TIPE_KUIS.ESSAY);
    expect(essayAllowed).toContain("Essay (jawaban panjang)");

    expect(isQuestionTypeAllowed(TIPE_KUIS.CAMPURAN, "apa-saja")).toBe(true);
    expect(isQuestionTypeAllowed(TIPE_KUIS.PILIHAN_GANDA, "pilihan_ganda")).toBe(
      true,
    );
    expect(isQuestionTypeAllowed(TIPE_KUIS.PILIHAN_GANDA, "essay")).toBe(false);
    expect(isQuestionTypeAllowed(TIPE_KUIS.ESSAY, "file_upload")).toBe(true);
  });
});
