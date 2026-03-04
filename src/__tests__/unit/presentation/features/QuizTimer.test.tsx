/**
 * QuizTimer Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  QuizTimer,
  clearTimerData,
  getStoredTimeRemaining,
  calculateTimeRemaining,
} from "@/components/features/kuis/attempt/QuizTimer";

vi.useFakeTimers();

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("QuizTimer Component", () => {
  const onTimeUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("rendering", () => {
    it("menampilkan waktu awal dengan benar (full mode)", () => {
      render(
        <QuizTimer
          durationMinutes={30}
          attemptId="attempt-1"
          onTimeUp={onTimeUp}
        />,
      );
      expect(screen.getByText("30:00")).toBeInTheDocument();
    });

    it("menampilkan label 'Waktu Tersisa'", () => {
      render(
        <QuizTimer
          durationMinutes={10}
          attemptId="attempt-2"
          onTimeUp={onTimeUp}
        />,
      );
      expect(screen.getByText("Waktu Tersisa")).toBeInTheDocument();
    });

    it("menampilkan dalam mode compact", () => {
      render(
        <QuizTimer
          durationMinutes={10}
          attemptId="attempt-3"
          onTimeUp={onTimeUp}
          compact={true}
        />,
      );
      expect(screen.getByText("10:00")).toBeInTheDocument();
      // compact tidak tampilkan "Waktu Tersisa"
      expect(screen.queryByText("Waktu Tersisa")).not.toBeInTheDocument();
    });
  });

  describe("countdown", () => {
    it("mengurangi waktu setiap detik", () => {
      render(
        <QuizTimer
          durationMinutes={1}
          attemptId="attempt-4"
          onTimeUp={onTimeUp}
        />,
      );
      expect(screen.getByText("01:00")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByText("00:55")).toBeInTheDocument();
    });

    it("memanggil onTimeUp saat waktu habis", () => {
      render(
        <QuizTimer
          durationMinutes={1}
          attemptId="attempt-5"
          onTimeUp={onTimeUp}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(onTimeUp).toHaveBeenCalledTimes(1);
    });

    it("menampilkan '00:00' saat waktu habis", () => {
      render(
        <QuizTimer
          durationMinutes={1}
          attemptId="attempt-6"
          onTimeUp={onTimeUp}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(screen.getByText("00:00")).toBeInTheDocument();
    });
  });

  describe("warning states", () => {
    it("menampilkan warning saat waktu < 5 menit", () => {
      render(
        <QuizTimer
          durationMinutes={4}
          attemptId="attempt-7"
          onTimeUp={onTimeUp}
        />,
      );
      // Sudah di bawah 5 menit dari awal
      expect(screen.getByText(/Perhatian! Waktu tinggal/)).toBeInTheDocument();
    });

    it("menampilkan critical alert saat waktu < 1 menit", () => {
      render(
        <QuizTimer
          durationMinutes={0.5}
          attemptId="attempt-8"
          onTimeUp={onTimeUp}
        />,
      );
      expect(screen.getByText(/Waktu hampir habis!/)).toBeInTheDocument();
    });
  });
});

describe("QuizTimer Helper Functions", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("clearTimerData", () => {
    it("menghapus data timer dari localStorage", () => {
      localStorageMock.setItem(
        "quiz_timer_abc",
        JSON.stringify({ timeRemaining: 100 }),
      );
      clearTimerData("abc");
      expect(localStorageMock.getItem("quiz_timer_abc")).toBeNull();
    });
  });

  describe("getStoredTimeRemaining", () => {
    it("mengembalikan null saat tidak ada data tersimpan", () => {
      expect(getStoredTimeRemaining("no-exist")).toBeNull();
    });

    it("mengembalikan nilai timeRemaining yang tersimpan", () => {
      localStorageMock.setItem(
        "quiz_timer_test",
        JSON.stringify({ timeRemaining: 250 }),
      );
      expect(getStoredTimeRemaining("test")).toBe(250);
    });

    it("mengembalikan null saat data tidak valid (JSON corrupt)", () => {
      localStorageMock.setItem("quiz_timer_bad", "not-json");
      expect(getStoredTimeRemaining("bad")).toBeNull();
    });
  });

  describe("calculateTimeRemaining", () => {
    it("menghitung sisa waktu dari startTime", () => {
      const startTime = new Date(Date.now() - 5000); // 5 detik lalu
      const result = calculateTimeRemaining(startTime, 1); // 1 menit
      expect(result).toBeCloseTo(55, 0); // 60 - 5 = 55
    });

    it("mengembalikan 0 jika waktu sudah habis", () => {
      const startTime = new Date(Date.now() - 200000); // 200 detik lalu
      const result = calculateTimeRemaining(startTime, 1); // hanya 1 menit
      expect(result).toBe(0);
    });
  });
});
