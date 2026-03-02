/**
 * MateriCard Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MateriCard, MateriList } from "@/components/features/materi/MateriCard";
import type { Materi } from "@/types/materi.types";

vi.mock("@/lib/supabase/storage", () => ({
  formatFileSize: (bytes: number) => `${bytes} B`,
  getFileTypeCategory: (type: string) => {
    if (type === "application/pdf") return "pdf";
    if (type?.startsWith("image/")) return "image";
    return "document";
  },
}));

vi.mock("date-fns", () => ({
  format: () => "01 Jan 2025",
}));

vi.mock("date-fns/locale", () => ({ id: {} }));

function makeMateiri(overrides: Partial<Materi> = {}): Materi {
  return {
    id: "materi-1",
    judul: "Materi Anatomi Tubuh",
    deskripsi: "Pengenalan anatomi dasar",
    tipe_file: "application/pdf",
    file_url: "https://example.com/file.pdf",
    file_size: 1024000,
    minggu_ke: 1,
    kelas_id: "kelas-1",
    dosen_id: "dosen-1",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    kelas: {
      id: "kelas-1",
      nama_kelas: "Kelas A",
      mata_kuliah: { id: "mk-1", nama_mk: "Anatomi" },
    } as any,
    dosen: {
      gelar_depan: "Dr.",
      gelar_belakang: "M.Kes",
      users: { full_name: "Budi Santoso" },
    } as any,
    ...overrides,
  } as Materi;
}

describe("MateriCard", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("rendering", () => {
    it("menampilkan judul materi", () => {
      render(<MateriCard materi={makeMateiri()} />);
      expect(screen.getByText("Materi Anatomi Tubuh")).toBeInTheDocument();
    });

    it("menampilkan deskripsi materi", () => {
      render(<MateriCard materi={makeMateiri()} />);
      expect(screen.getByText("Pengenalan anatomi dasar")).toBeInTheDocument();
    });

    it("menampilkan badge Published", () => {
      render(<MateriCard materi={makeMateiri()} />);
      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it("menampilkan nama mata kuliah", () => {
      render(<MateriCard materi={makeMateiri()} />);
      // "Anatomi" muncul di badge DAN di CardContent — gunakan getAllByText
      const elements = screen.getAllByText("Anatomi");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it("menampilkan minggu ke", () => {
      render(<MateriCard materi={makeMateiri({ minggu_ke: 3 })} />);
      expect(screen.getByText("Minggu 3")).toBeInTheDocument();
    });

    it("menampilkan nama kelas", () => {
      render(<MateriCard materi={makeMateiri()} />);
      expect(screen.getByText("Kelas A")).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("menampilkan tombol Lihat untuk PDF", () => {
      const onView = vi.fn();
      render(<MateriCard materi={makeMateiri()} onView={onView} />);
      expect(screen.getByText("Lihat")).toBeInTheDocument();
    });

    it("memanggil onView saat tombol Lihat diklik", async () => {
      const onView = vi.fn();
      const materi = makeMateiri();
      render(<MateriCard materi={materi} onView={onView} />);
      await userEvent.click(screen.getByText("Lihat"));
      expect(onView).toHaveBeenCalledWith(materi);
    });

    it("menampilkan tombol Download jika onDownload diberikan", () => {
      const onDownload = vi.fn();
      render(<MateriCard materi={makeMateiri()} onDownload={onDownload} />);
      expect(screen.getByText("Download")).toBeInTheDocument();
    });

    it("memanggil onDownload saat tombol Download diklik", async () => {
      const onDownload = vi.fn().mockResolvedValue(undefined);
      const materi = makeMateiri();
      render(<MateriCard materi={materi} onDownload={onDownload} />);
      await userEvent.click(screen.getByText("Download"));
      await waitFor(() => expect(onDownload).toHaveBeenCalledWith(materi));
    });

    it("tidak menampilkan actions saat showActions=false", () => {
      render(<MateriCard materi={makeMateiri()} showActions={false} />);
      expect(screen.queryByText("Download")).not.toBeInTheDocument();
      expect(screen.queryByText("Lihat")).not.toBeInTheDocument();
    });
  });

  describe("dosen actions", () => {
    it("menampilkan menu dosen saat showDosenActions=true", async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(
        <MateriCard
          materi={makeMateiri()}
          showDosenActions={true}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );
      // Tombol MoreVertical ada
      const triggerBtn = screen.getByRole("button", { name: "" });
      await userEvent.click(triggerBtn);
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Hapus")).toBeInTheDocument();
    });
  });
});

describe("MateriList", () => {
  it("menampilkan pesan kosong saat list kosong", () => {
    render(<MateriList materiList={[]} />);
    expect(screen.getByText("Belum ada materi")).toBeInTheDocument();
  });

  it("menampilkan custom empty message", () => {
    render(<MateriList materiList={[]} emptyMessage="Tidak ada data" />);
    expect(screen.getByText("Tidak ada data")).toBeInTheDocument();
  });

  it("merender semua materi dalam list", () => {
    const list = [
      makeMateiri({ id: "m1", judul: "Materi 1" }),
      makeMateiri({ id: "m2", judul: "Materi 2" }),
    ];
    render(<MateriList materiList={list} />);
    expect(screen.getByText("Materi 1")).toBeInTheDocument();
    expect(screen.getByText("Materi 2")).toBeInTheDocument();
  });
});
