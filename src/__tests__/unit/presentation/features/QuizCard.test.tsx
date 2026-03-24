/**
 * QuizCard Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QuizCard, getQuizStatus } from "@/components/features/kuis/QuizCard";
import type { Kuis } from "@/types/kuis.types";

vi.mock("@/lib/api/kuis.api", () => ({
  deleteKuis: vi.fn(),
  duplicateKuis: vi.fn(),
  publishKuis: vi.fn(),
  unpublishKuis: vi.fn(),
  cacheAttemptOffline: vi.fn(),
  syncOfflineAnswers: vi.fn(),
  getCachedAttempt: vi.fn().mockResolvedValue(null),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function makeKuis(overrides: Partial<Kuis> = {}): Kuis {
  return {
    id: "kuis-1",
    kelas_id: "kelas-1",
    dosen_id: "dosen-1",
    judul: "Pre-Test Anatomi",
    deskripsi: "Tes awal sebelum praktikum",
    status: "draft",
    tipe_kuis: "pilihan_ganda",
    kelas: {
      nama_kelas: "Kelas A",
      mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi" },
    },
    ...overrides,
  } as Kuis;
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("QuizCard", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("rendering dasar", () => {
    it("menampilkan judul kuis", () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} />);
      expect(screen.getByText("Pre-Test Anatomi")).toBeInTheDocument();
    });

    it("menampilkan deskripsi kuis", () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} />);
      expect(
        screen.getByText("Tes awal sebelum praktikum"),
      ).toBeInTheDocument();
    });

    it("menampilkan badge Draft saat status=draft", () => {
      renderWithRouter(<QuizCard quiz={makeKuis({ status: "draft" })} />);
      expect(screen.getByText(/Draft/)).toBeInTheDocument();
    });

    it("menampilkan badge Aktif saat status=published", () => {
      renderWithRouter(<QuizCard quiz={makeKuis({ status: "published" })} />);
      expect(screen.getByText(/Aktif/)).toBeInTheDocument();
    });

    it("menampilkan badge Tes CBT untuk tipe pilihan_ganda", () => {
      renderWithRouter(
        <QuizCard quiz={makeKuis({ tipe_kuis: "pilihan_ganda" })} />,
      );
      expect(screen.getByText("Tes CBT")).toBeInTheDocument();
    });

    it("menampilkan badge Laporan Praktikum untuk tipe essay", () => {
      renderWithRouter(<QuizCard quiz={makeKuis({ tipe_kuis: "essay" })} />);
      expect(screen.getByText("Laporan Praktikum")).toBeInTheDocument();
    });

    it("menampilkan nama mata kuliah dan kelas", () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} />);
      expect(screen.getByText(/ANT101/)).toBeInTheDocument();
      // Anatomi dapat muncul lebih dari sekali (badge tipe + nama MK)
      expect(screen.getAllByText(/Anatomi/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Kelas A/)).toBeInTheDocument();
    });

    it("menampilkan Tanggal fleksibel jika tidak ada tanggal", () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} />);
      expect(screen.getByText("Tanggal fleksibel")).toBeInTheDocument();
    });

    it("tidak menampilkan menu actions saat showActions=false", () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} showActions={false} />);
      // No MoreVertical button
      expect(
        screen.queryByRole("button", { name: "" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("compact mode", () => {
    it("merender tanpa crash di compact mode", () => {
      expect(() =>
        renderWithRouter(<QuizCard quiz={makeKuis()} compact={true} />),
      ).not.toThrow();
    });

    it("tidak menampilkan tombol Edit dan Hasil di compact mode", () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} compact={true} />);
      // Quick action buttons in footer are hidden in compact mode
      expect(
        screen.queryByRole("button", { name: /Edit/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Hasil/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("actions menu", () => {
    // Gunakan compact=true agar tombol footer (Edit/Hasil) tersembunyi,
    // sehingga teks "Edit" hanya muncul sekali dari dropdown item.
    it("membuka menu dropdown saat MoreVertical diklik", async () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} compact={true} />);
      const iconBtns = screen.getAllByRole("button");
      const triggerBtn = iconBtns.find((b) => !b.textContent?.trim());
      if (triggerBtn) {
        await userEvent.click(triggerBtn);
        expect(screen.getByText("Edit")).toBeInTheDocument();
        expect(screen.getByText("Lihat Hasil")).toBeInTheDocument();
        expect(screen.getByText("Duplikasi")).toBeInTheDocument();
        expect(screen.getByText("Hapus")).toBeInTheDocument();
      }
    });

    it("menampilkan 'Publish / Mulai' saat kuis masih draft", async () => {
      renderWithRouter(
        <QuizCard quiz={makeKuis({ status: "draft" })} compact={true} />,
      );
      const iconBtns = screen.getAllByRole("button");
      const triggerBtn = iconBtns.find((b) => !b.textContent?.trim());
      if (triggerBtn) {
        await userEvent.click(triggerBtn);
        expect(screen.getByText("Publish / Mulai")).toBeInTheDocument();
      }
    });

    it("menampilkan 'Unpublish' saat kuis sudah published", async () => {
      renderWithRouter(
        <QuizCard quiz={makeKuis({ status: "published" })} compact={true} />,
      );
      const iconBtns = screen.getAllByRole("button");
      const triggerBtn = iconBtns.find((b) => !b.textContent?.trim());
      if (triggerBtn) {
        await userEvent.click(triggerBtn);
        expect(screen.getByText("Unpublish")).toBeInTheDocument();
      }
    });
  });

  describe("delete dialog", () => {
    it("menampilkan dialog konfirmasi hapus", async () => {
      renderWithRouter(<QuizCard quiz={makeKuis()} compact={true} />);
      const iconBtns = screen.getAllByRole("button");
      const triggerBtn = iconBtns.find((b) => !b.textContent?.trim());
      if (triggerBtn) {
        await userEvent.click(triggerBtn);
        await userEvent.click(screen.getByText("Hapus"));
        expect(screen.getByText("Hapus Tugas?")).toBeInTheDocument();
        expect(screen.getByText("Ya, Hapus")).toBeInTheDocument();
        expect(screen.getByText("Batal")).toBeInTheDocument();
      }
    });
  });

  describe("publish action", () => {
    it("memanggil publishKuis dan onUpdate saat publish berhasil", async () => {
      const { publishKuis } = await import("@/lib/api/kuis.api");
      (publishKuis as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      const onUpdate = vi.fn();

      renderWithRouter(
        <QuizCard quiz={makeKuis({ status: "draft" })} onUpdate={onUpdate} />,
      );
      const iconBtns = screen.getAllByRole("button");
      const triggerBtn = iconBtns.find((b) => !b.textContent?.trim());
      if (triggerBtn) {
        await userEvent.click(triggerBtn);
        await userEvent.click(screen.getByText("Publish / Mulai"));
        await waitFor(() => expect(onUpdate).toHaveBeenCalled());
      }
    });
  });
});

describe("getQuizStatus", () => {
  it("mengembalikan Draft saat is_active=false", () => {
    const quiz = makeKuis({ status: "draft" }) as any;
    quiz.is_active = false;
    const result = getQuizStatus(quiz);
    expect(result.label).toBe("Draft");
    expect(result.variant).toBe("secondary");
  });

  it("mengembalikan Aktif saat is_active=true dan tidak ada tanggal", () => {
    const quiz = makeKuis() as any;
    quiz.is_active = true;
    const result = getQuizStatus(quiz);
    expect(result.label).toBe("Aktif");
    expect(result.variant).toBe("default");
  });

  it("mengembalikan Terjadwal saat belum mulai", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const quiz = makeKuis({
      tanggal_mulai: future,
      tanggal_selesai: new Date(Date.now() + 2 * 86400000).toISOString(),
    }) as any;
    quiz.is_active = true;
    const result = getQuizStatus(quiz);
    expect(result.label).toBe("Terjadwal");
  });

  it("mengembalikan Aktif saat dalam rentang tanggal", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    const quiz = makeKuis({
      tanggal_mulai: past,
      tanggal_selesai: future,
    }) as any;
    quiz.is_active = true;
    const result = getQuizStatus(quiz);
    expect(result.label).toBe("Aktif");
  });

  it("mengembalikan Selesai saat sudah lewat tanggal selesai", () => {
    const past1 = new Date(Date.now() - 2 * 86400000).toISOString();
    const past2 = new Date(Date.now() - 86400000).toISOString();
    const quiz = makeKuis({
      tanggal_mulai: past1,
      tanggal_selesai: past2,
    }) as any;
    quiz.is_active = true;
    const result = getQuizStatus(quiz);
    expect(result.label).toBe("Selesai");
  });
});
