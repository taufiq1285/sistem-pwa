/**
 * ConfirmDialog Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Hapus Data",
    description: "Apakah Anda yakin ingin menghapus data ini?",
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering saat open=true", () => {
    it("menampilkan title", () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText("Hapus Data")).toBeInTheDocument();
    });

    it("menampilkan description", () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(
        screen.getByText("Apakah Anda yakin ingin menghapus data ini?"),
      ).toBeInTheDocument();
    });

    it("menampilkan label confirm default 'Konfirmasi'", () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText("Konfirmasi")).toBeInTheDocument();
    });

    it("menampilkan label cancel default 'Batal'", () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByText("Batal")).toBeInTheDocument();
    });
  });

  describe("tidak ditampilkan saat open=false", () => {
    it("tidak merender konten saat open=false", () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);
      expect(screen.queryByText("Hapus Data")).not.toBeInTheDocument();
    });
  });

  describe("custom labels", () => {
    it("menampilkan custom confirmLabel", () => {
      render(<ConfirmDialog {...defaultProps} confirmLabel="Ya, Hapus" />);
      expect(screen.getByText("Ya, Hapus")).toBeInTheDocument();
    });

    it("menampilkan custom cancelLabel", () => {
      render(<ConfirmDialog {...defaultProps} cancelLabel="Tidak" />);
      expect(screen.getByText("Tidak")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("menampilkan 'Memproses...' saat isLoading=true", () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);
      expect(screen.getByText("Memproses...")).toBeInTheDocument();
    });

    it("tombol disabled saat isLoading=true", () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);
      const cancelBtn = screen.getByText("Batal");
      expect(cancelBtn).toBeDisabled();
    });
  });

  describe("interaksi", () => {
    it("memanggil onConfirm saat tombol konfirmasi diklik", async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await userEvent.click(screen.getByText("Konfirmasi"));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("memanggil onOpenChange(false) setelah konfirmasi berhasil", async () => {
      const onOpenChange = vi.fn();
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />,
      );

      await userEvent.click(screen.getByText("Konfirmasi"));
      // wait for promise
      await vi.waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("variant", () => {
    it("variant danger (default) merender tanpa error", () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);
      expect(screen.getByText("Hapus Data")).toBeInTheDocument();
    });

    it("variant warning merender tanpa error", () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);
      expect(screen.getByText("Hapus Data")).toBeInTheDocument();
    });

    it("variant info merender tanpa error", () => {
      render(<ConfirmDialog {...defaultProps} variant="info" />);
      expect(screen.getByText("Hapus Data")).toBeInTheDocument();
    });
  });
});
