/**
 * DeleteConfirmDialog Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

describe("DeleteConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: "Hapus Mahasiswa",
    itemName: "Budi Santoso",
    itemType: "Mahasiswa",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering saat open=true", () => {
    it("menampilkan title dialog", () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      expect(screen.getByText("Hapus Mahasiswa")).toBeInTheDocument();
    });

    it("menampilkan nama item yang akan dihapus", () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    });

    it("menampilkan tipe item", () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      expect(
        screen.getByText("Mahasiswa yang akan dihapus:"),
      ).toBeInTheDocument();
    });

    it("menampilkan deskripsi opsional saat diberikan", () => {
      render(
        <DeleteConfirmDialog {...defaultProps} description="NIM: 12345678" />,
      );
      expect(screen.getByText("NIM: 12345678")).toBeInTheDocument();
    });

    it("menampilkan konsekuensi default", () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      expect(
        screen.getByText("Data Mahasiswa akan dihapus permanent"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Tindakan ini tidak dapat dibatalkan"),
      ).toBeInTheDocument();
    });

    it("menampilkan konsekuensi custom saat diberikan", () => {
      render(
        <DeleteConfirmDialog
          {...defaultProps}
          consequences={[
            "Semua nilai akan terhapus",
            "Akun akan dinonaktifkan",
          ]}
        />,
      );
      expect(screen.getByText("Semua nilai akan terhapus")).toBeInTheDocument();
      expect(screen.getByText("Akun akan dinonaktifkan")).toBeInTheDocument();
    });
  });

  describe("tidak ditampilkan saat open=false", () => {
    it("tidak merender konten saat open=false", () => {
      render(<DeleteConfirmDialog {...defaultProps} open={false} />);
      expect(screen.queryByText("Hapus Mahasiswa")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("menampilkan 'Menghapus...' saat isLoading=true", () => {
      render(<DeleteConfirmDialog {...defaultProps} isLoading={true} />);
      expect(screen.getByText("Menghapus...")).toBeInTheDocument();
    });

    it("tombol-tombol disabled saat isLoading=true", () => {
      render(<DeleteConfirmDialog {...defaultProps} isLoading={true} />);
      expect(screen.getByText("Batal")).toBeDisabled();
      expect(screen.getByText("Menghapus...")).toBeDisabled();
    });
  });

  describe("interaksi", () => {
    it("memanggil onConfirm saat tombol hapus diklik", async () => {
      const onConfirm = vi.fn();
      render(<DeleteConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await userEvent.click(screen.getByText("Ya, Hapus"));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("memanggil onOpenChange(false) saat tombol Batal diklik", async () => {
      const onOpenChange = vi.fn();
      render(
        <DeleteConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />,
      );

      await userEvent.click(screen.getByText("Batal"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
