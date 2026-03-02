/**
 * ErrorFallback Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorFallback } from "@/components/common/ErrorFallback";

describe("ErrorFallback", () => {
  const mockError = new Error("Something went wrong");

  beforeEach(() => {
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
      reload: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("menampilkan heading error", () => {
      render(<ErrorFallback error={mockError} />);
      expect(screen.getByText("Oops! Terjadi Kesalahan")).toBeInTheDocument();
    });

    it("menampilkan pesan error dari objek Error", () => {
      render(<ErrorFallback error={mockError} />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("menampilkan pesan default saat error null", () => {
      render(<ErrorFallback error={null} />);
      expect(
        screen.getByText("Terjadi kesalahan yang tidak terduga"),
      ).toBeInTheDocument();
    });

    it("menampilkan tombol Refresh Halaman", () => {
      render(<ErrorFallback error={mockError} />);
      expect(screen.getByText("Refresh Halaman")).toBeInTheDocument();
    });

    it("menampilkan tombol Ke Beranda", () => {
      render(<ErrorFallback error={mockError} />);
      expect(screen.getByText("Ke Beranda")).toBeInTheDocument();
    });
  });

  describe("tombol Coba Lagi", () => {
    it("tidak menampilkan tombol Coba Lagi jika resetError tidak diberikan", () => {
      render(<ErrorFallback error={mockError} />);
      expect(screen.queryByText("Coba Lagi")).not.toBeInTheDocument();
    });

    it("menampilkan dan memanggil resetError saat tombol diklik", async () => {
      const resetError = vi.fn();
      render(<ErrorFallback error={mockError} resetError={resetError} />);

      await userEvent.click(screen.getByText("Coba Lagi"));
      expect(resetError).toHaveBeenCalledTimes(1);
    });
  });

  describe("detail error", () => {
    it("tidak menampilkan detail error secara default (showDetails=false)", () => {
      render(<ErrorFallback error={mockError} showDetails={false} />);
      expect(
        screen.queryByText("Detail Error (Development Mode)"),
      ).not.toBeInTheDocument();
    });

    it("menampilkan detail error saat showDetails=true dan ada stack", () => {
      const errorWithStack = new Error("Test error");
      errorWithStack.stack = "Error: Test error\n  at test.ts:1:1";

      render(<ErrorFallback error={errorWithStack} showDetails={true} />);
      expect(
        screen.getByText("Detail Error (Development Mode)"),
      ).toBeInTheDocument();
    });
  });

  describe("navigasi", () => {
    it("memanggil window.location.reload saat tombol Refresh diklik", async () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { ...window.location, reload: reloadMock },
        writable: true,
      });

      render(<ErrorFallback error={mockError} />);
      await userEvent.click(screen.getByText("Refresh Halaman"));
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });
});
