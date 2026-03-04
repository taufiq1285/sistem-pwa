/**
 * MateriViewer Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MateriViewer } from "@/components/features/materi/MateriViewer";
import type { Materi } from "@/types/materi.types";

// Mock supabase storage utilities
vi.mock("@/lib/supabase/storage", () => ({
  getFileTypeCategory: (type: string) => {
    if (type === "application/pdf") return "pdf";
    if (type?.startsWith("image/")) return "image";
    if (type?.startsWith("video/")) return "video";
    return "document";
  },
  formatFileSize: (bytes: number) => `${bytes} B`,
}));

// Mock usePdfBlobUrl hook
vi.mock("@/lib/hooks/usePdfBlobUrl", () => ({
  usePdfBlobUrl: vi.fn(() => ({
    blobUrl: null,
    loading: false,
    error: null,
  })),
}));

function makeMateri(overrides: Partial<Materi> = {}): Materi {
  return {
    id: "materi-1",
    judul: "Materi Anatomi",
    deskripsi: "Pengenalan anatomi",
    tipe_file: "application/pdf",
    file_url: "https://example.com/materi.pdf",
    file_size: 1024000,
    minggu_ke: 1,
    kelas_id: "kelas-1",
    dosen_id: "dosen-1",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  } as Materi;
}

describe("MateriViewer", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("tidak dirender saat closed", () => {
    it("tidak merender apapun saat open=false", () => {
      const { container } = render(
        <MateriViewer materi={makeMateri()} open={false} onClose={vi.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("tidak merender apapun saat materi=null", () => {
      const { container } = render(
        <MateriViewer materi={null} open={true} onClose={vi.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("unsupported file type", () => {
    it("menampilkan pesan tidak dapat ditampilkan untuk file non-PDF/image/video", () => {
      const wordMateri = makeMateri({ tipe_file: "application/msword" });
      render(
        <MateriViewer materi={wordMateri} open={true} onClose={vi.fn()} />,
      );
      expect(
        screen.getByText(/File ini tidak dapat ditampilkan/),
      ).toBeInTheDocument();
    });

    it("menampilkan tombol Download untuk unsupported file", () => {
      const wordMateri = makeMateri({ tipe_file: "application/msword" });
      const onDownload = vi.fn();
      render(
        <MateriViewer
          materi={wordMateri}
          open={true}
          onClose={vi.fn()}
          onDownload={onDownload}
        />,
      );
      expect(screen.getByText("Download")).toBeInTheDocument();
    });

    it("menampilkan tombol Tutup untuk unsupported file", () => {
      const wordMateri = makeMateri({ tipe_file: "application/msword" });
      render(
        <MateriViewer materi={wordMateri} open={true} onClose={vi.fn()} />,
      );
      expect(screen.getByText("Tutup")).toBeInTheDocument();
    });

    it("memanggil onClose saat tombol Tutup diklik", async () => {
      const wordMateri = makeMateri({ tipe_file: "application/msword" });
      const onClose = vi.fn();
      render(
        <MateriViewer materi={wordMateri} open={true} onClose={onClose} />,
      );
      await userEvent.click(screen.getByText("Tutup"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("PDF viewer", () => {
    it("menampilkan judul materi", () => {
      render(
        <MateriViewer materi={makeMateri()} open={true} onClose={vi.fn()} />,
      );
      expect(
        screen.getAllByText("Materi Anatomi").length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("menampilkan deskripsi materi", () => {
      render(
        <MateriViewer materi={makeMateri()} open={true} onClose={vi.fn()} />,
      );
      expect(screen.getByText("Pengenalan anatomi")).toBeInTheDocument();
    });

    it("menampilkan tombol Download saat onDownload diberikan", () => {
      render(
        <MateriViewer
          materi={makeMateri()}
          open={true}
          onClose={vi.fn()}
          onDownload={vi.fn()}
        />,
      );
      expect(screen.getByText("Download")).toBeInTheDocument();
    });

    it("menampilkan tombol Buka Tab Baru untuk PDF", () => {
      render(
        <MateriViewer materi={makeMateri()} open={true} onClose={vi.fn()} />,
      );
      expect(screen.getByText("Buka Tab Baru")).toBeInTheDocument();
    });

    it("menampilkan loading saat PDF sedang dimuat", async () => {
      const { usePdfBlobUrl } = await import("@/lib/hooks/usePdfBlobUrl");
      (usePdfBlobUrl as ReturnType<typeof vi.fn>).mockReturnValue({
        blobUrl: null,
        loading: true,
        error: null,
      });
      render(
        <MateriViewer materi={makeMateri()} open={true} onClose={vi.fn()} />,
      );
      expect(screen.getByText("Memuat PDF...")).toBeInTheDocument();
    });

    it("menampilkan error saat PDF gagal dimuat", async () => {
      const { usePdfBlobUrl } = await import("@/lib/hooks/usePdfBlobUrl");
      (usePdfBlobUrl as ReturnType<typeof vi.fn>).mockReturnValue({
        blobUrl: null,
        loading: false,
        error: new Error("Network Error"),
      });
      render(
        <MateriViewer materi={makeMateri()} open={true} onClose={vi.fn()} />,
      );
      expect(screen.getByText("Gagal memuat PDF")).toBeInTheDocument();
    });
  });

  describe("image viewer", () => {
    it("merender image viewer tanpa crash untuk tipe file image", () => {
      const imageMateri = makeMateri({
        tipe_file: "image/jpeg",
        file_url: "https://example.com/image.jpg",
      });
      expect(() =>
        render(
          <MateriViewer materi={imageMateri} open={true} onClose={vi.fn()} />,
        ),
      ).not.toThrow();
    });

    it("menampilkan tombol Buka Tab Baru untuk image", () => {
      const imageMateri = makeMateri({
        tipe_file: "image/jpeg",
        file_url: "https://example.com/image.jpg",
      });
      render(
        <MateriViewer materi={imageMateri} open={true} onClose={vi.fn()} />,
      );
      expect(screen.getByText("Buka Tab Baru")).toBeInTheDocument();
    });
  });

  describe("video viewer", () => {
    it("merender video viewer tanpa crash untuk tipe file video", () => {
      const videoMateri = makeMateri({
        tipe_file: "video/mp4",
        file_url: "https://example.com/video.mp4",
      });
      expect(() =>
        render(
          <MateriViewer materi={videoMateri} open={true} onClose={vi.fn()} />,
        ),
      ).not.toThrow();
    });

    it("menampilkan tombol Buka Tab Baru untuk video", () => {
      const videoMateri = makeMateri({
        tipe_file: "video/mp4",
        file_url: "https://example.com/video.mp4",
      });
      render(
        <MateriViewer materi={videoMateri} open={true} onClose={vi.fn()} />,
      );
      expect(screen.getByText("Buka Tab Baru")).toBeInTheDocument();
    });
  });

  describe("file size display", () => {
    it("menampilkan ukuran file", () => {
      render(
        <MateriViewer
          materi={makeMateri({ file_size: 500 })}
          open={true}
          onClose={vi.fn()}
        />,
      );
      // formatFileSize mock returns "${bytes} B"
      expect(screen.getByText(/500 B/)).toBeInTheDocument();
    });
  });
});
