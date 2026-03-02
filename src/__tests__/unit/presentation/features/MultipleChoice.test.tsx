/**
 * MultipleChoice Question Type Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MultipleChoice,
  validateMultipleChoice,
  generateDefaultOptions,
} from "@/components/features/kuis/question-types/MultipleChoice";
import type { OpsiJawaban } from "@/types/kuis.types";

function makeOptions(count = 4, correctIndex = 0): OpsiJawaban[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `opt-${i + 1}`,
    label: ["A", "B", "C", "D", "E", "F"][i],
    text: `Opsi ${["A", "B", "C", "D"][i] ?? i + 1}`,
    is_correct: i === correctIndex,
  }));
}

describe("MultipleChoice Component", () => {
  const onChange = vi.fn();
  const onCorrectAnswerChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("merender label Pilihan Jawaban", () => {
    render(
      <MultipleChoice
        options={makeOptions()}
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
      />,
    );
    expect(screen.getByText("Pilihan Jawaban")).toBeInTheDocument();
  });

  it("merender semua opsi yang diberikan", () => {
    render(
      <MultipleChoice
        options={makeOptions(4)}
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
      />,
    );
    expect(screen.getByDisplayValue("Opsi A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Opsi B")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Opsi C")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Opsi D")).toBeInTheDocument();
  });

  it("merender tombol Tambah Opsi", () => {
    render(
      <MultipleChoice
        options={makeOptions(2)}
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
      />,
    );
    expect(screen.getByText("Tambah Opsi")).toBeInTheDocument();
  });

  it("tombol Tambah Opsi disabled saat mencapai maxOptions", () => {
    render(
      <MultipleChoice
        options={makeOptions(6)}
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
        maxOptions={6}
      />,
    );
    expect(screen.getByText("Tambah Opsi")).toBeDisabled();
  });

  it("memanggil onChange saat teks opsi diubah", async () => {
    render(
      <MultipleChoice
        options={makeOptions(2)}
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], "Jawaban baru");
    expect(onChange).toHaveBeenCalled();
  });

  it("menampilkan error validation saat showErrors=true dan tidak ada jawaban benar", () => {
    const noCorrectOptions = makeOptions(2).map((o) => ({ ...o, is_correct: false }));
    render(
      <MultipleChoice
        options={noCorrectOptions}
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
        showErrors={true}
      />,
    );
    // Teks error muncul di elemen destructive (bukan helper text biasa)
    const errorEl = screen.getAllByText(/Pilih satu jawaban yang benar/);
    const destructiveEl = errorEl.find(
      (el) => el.className?.includes("destructive"),
    );
    expect(destructiveEl).toBeDefined();
  });

  it("menampilkan info jawaban benar saat ada opsi is_correct=true", () => {
    render(
      <MultipleChoice
        options={makeOptions(4, 1)} // opsi B benar
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
        correctAnswerId="opt-2"
      />,
    );
    expect(screen.getByText(/Jawaban benar: Opsi B/)).toBeInTheDocument();
  });

  it("semua input disabled saat disabled=true", () => {
    render(
      <MultipleChoice
        options={makeOptions(2)}
        onChange={onChange}
        onCorrectAnswerChange={onCorrectAnswerChange}
        disabled={true}
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => expect(input).toBeDisabled());
  });
});

describe("MultipleChoice Helper Functions", () => {
  describe("validateMultipleChoice", () => {
    it("valid dengan 4 opsi, semua diisi, 1 jawaban benar", () => {
      const options = makeOptions(4, 0);
      const result = validateMultipleChoice(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("invalid saat kurang dari 2 opsi", () => {
      const result = validateMultipleChoice([makeOptions(1)[0]]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Minimal 2 opsi"))).toBe(true);
    });

    it("invalid saat lebih dari 6 opsi", () => {
      const result = validateMultipleChoice(makeOptions(7));
      expect(result.isValid).toBe(false);
    });

    it("invalid saat ada opsi kosong", () => {
      const options = makeOptions(3);
      options[1].text = "";
      const result = validateMultipleChoice(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("harus diisi"))).toBe(true);
    });

    it("invalid saat tidak ada jawaban benar", () => {
      const options = makeOptions(4).map((o) => ({ ...o, is_correct: false }));
      const result = validateMultipleChoice(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("satu jawaban yang benar"))).toBe(true);
    });

    it("invalid saat lebih dari 1 jawaban benar", () => {
      const options = makeOptions(4).map((o) => ({ ...o, is_correct: true }));
      const result = validateMultipleChoice(options);
      expect(result.isValid).toBe(false);
    });
  });

  describe("generateDefaultOptions", () => {
    it("menghasilkan 4 opsi secara default", () => {
      const options = generateDefaultOptions();
      expect(options).toHaveLength(4);
    });

    it("menghasilkan opsi dengan label A, B, C, D", () => {
      const options = generateDefaultOptions(4);
      expect(options[0].label).toBe("A");
      expect(options[1].label).toBe("B");
      expect(options[2].label).toBe("C");
      expect(options[3].label).toBe("D");
    });

    it("semua opsi awal is_correct=false", () => {
      const options = generateDefaultOptions(4);
      options.forEach((opt) => expect(opt.is_correct).toBe(false));
    });

    it("menghasilkan jumlah opsi sesuai parameter", () => {
      expect(generateDefaultOptions(2)).toHaveLength(2);
      expect(generateDefaultOptions(6)).toHaveLength(6);
    });
  });
});
