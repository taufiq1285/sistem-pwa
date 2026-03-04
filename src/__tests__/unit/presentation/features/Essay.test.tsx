/**
 * Essay Question Type Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Essay,
  validateEssay,
  getDefaultEssaySettings,
  countWords,
  countCharacters,
  validateEssayAnswer,
} from "@/components/features/kuis/question-types/Essay";

describe("Essay Component", () => {
  const onChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("merender label Pengaturan Essay", () => {
    render(<Essay onChange={onChange} />);
    expect(screen.getByText("Pengaturan Essay")).toBeInTheDocument();
  });

  it("menampilkan input min dan max kata", () => {
    render(<Essay onChange={onChange} />);
    expect(screen.getByLabelText(/Minimal Kata/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maksimal Kata/)).toBeInTheDocument();
  });

  it("menampilkan textarea rubrik", () => {
    render(<Essay onChange={onChange} />);
    expect(screen.getByLabelText(/Panduan Penilaian/)).toBeInTheDocument();
  });

  it("menampilkan error saat minWords > maxWords dan showErrors=true", () => {
    render(
      <Essay
        onChange={onChange}
        minWords={100}
        maxWords={50}
        showErrors={true}
      />,
    );
    expect(
      screen.getByText(/Maksimal kata harus lebih besar dari minimal kata/),
    ).toBeInTheDocument();
  });

  it("memanggil onChange saat rubrik diubah", async () => {
    render(<Essay onChange={onChange} rubric="" />);
    const textarea = screen.getByLabelText(/Panduan Penilaian/);
    await userEvent.type(textarea, "Rubrik baru");
    expect(onChange).toHaveBeenCalled();
  });

  it("menampilkan info disabled saat disabled=true", () => {
    render(<Essay onChange={onChange} disabled={true} />);
    const inputs = screen.getAllByRole("spinbutton");
    inputs.forEach((input) => expect(input).toBeDisabled());
  });
});

describe("Essay Helper Functions", () => {
  describe("validateEssay", () => {
    it("valid saat minWords < maxWords", () => {
      const result = validateEssay({ minWords: 50, maxWords: 200 });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("invalid saat minWords > maxWords", () => {
      const result = validateEssay({ minWords: 300, maxWords: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("invalid saat minWords terlalu besar (> 5000)", () => {
      const result = validateEssay({ minWords: 6000 });
      expect(result.isValid).toBe(false);
    });

    it("invalid saat characterLimit terlalu besar (> 50000)", () => {
      const result = validateEssay({ characterLimit: 60000 });
      expect(result.isValid).toBe(false);
    });
  });

  describe("getDefaultEssaySettings", () => {
    it("mengembalikan default settings yang valid", () => {
      const defaults = getDefaultEssaySettings();
      expect(defaults.minWords).toBeGreaterThan(0);
      expect(defaults.maxWords).toBeGreaterThan(0);
      expect(defaults.characterLimit).toBeGreaterThan(0);
      expect(defaults.rubric).toBe("");
    });
  });

  describe("countWords", () => {
    it("menghitung kata dengan benar", () => {
      expect(countWords("hello world foo")).toBe(3);
    });

    it("mengembalikan 0 untuk string kosong", () => {
      expect(countWords("")).toBe(0);
      expect(countWords("   ")).toBe(0);
    });

    it("menghitung kata dengan spasi ganda sebagai 1 separator", () => {
      expect(countWords("hello   world")).toBe(2);
    });
  });

  describe("countCharacters", () => {
    it("menghitung karakter dengan benar", () => {
      expect(countCharacters("hello")).toBe(5);
      expect(countCharacters("hello world")).toBe(11);
    });

    it("mengembalikan 0 untuk string kosong", () => {
      expect(countCharacters("")).toBe(0);
    });
  });

  describe("validateEssayAnswer", () => {
    it("valid saat memenuhi semua syarat", () => {
      const result = validateEssayAnswer("satu dua tiga empat lima", {
        minWords: 3,
        maxWords: 100,
        characterLimit: 1000,
      });
      expect(result.isValid).toBe(true);
      expect(result.wordCount).toBe(5);
    });

    it("invalid saat kurang dari minWords", () => {
      const result = validateEssayAnswer("hanya tiga kata", { minWords: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Minimal"))).toBe(true);
    });

    it("invalid saat melebihi maxWords", () => {
      const longText = Array(20).fill("kata").join(" ");
      const result = validateEssayAnswer(longText, { maxWords: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Maksimal"))).toBe(true);
    });

    it("invalid saat melebihi characterLimit", () => {
      const result = validateEssayAnswer("hello", { characterLimit: 3 });
      expect(result.isValid).toBe(false);
    });
  });
});
