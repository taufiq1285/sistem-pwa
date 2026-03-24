import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PersetujuanPage from "@/pages/laboran/PersetujuanPage";

const {
  mockGetPendingApprovals,
  mockApprovePeminjaman,
  mockRejectPeminjaman,
  mockToast,
} = vi.hoisted(() => ({
  mockGetPendingApprovals: vi.fn(),
  mockApprovePeminjaman: vi.fn(),
  mockRejectPeminjaman: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getPendingApprovals: (...args: unknown[]) => mockGetPendingApprovals(...args),
  approvePeminjaman: (...args: unknown[]) => mockApprovePeminjaman(...args),
  rejectPeminjaman: (...args: unknown[]) => mockRejectPeminjaman(...args),
}));

vi.mock("@/lib/api/notification.api", () => ({
  notifyDosenPeminjamanDisetujui: vi.fn(() => Promise.resolve()),
  notifyDosenPeminjamanDitolak: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/utils/format", () => ({
  formatDate: (value: string) => value,
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("Laboran PersetujuanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetPendingApprovals.mockResolvedValue([
      {
        id: "req-1",
        peminjam_nama: "Andi",
        peminjam_nim: "001",
        inventaris_nama: "Mikroskop",
        inventaris_kode: "MKR-001",
        laboratorium_nama: "Lab Anatomi",
        jumlah_pinjam: 2,
        tanggal_pinjam: "2025-01-10",
        tanggal_kembali_rencana: "2025-01-12",
        keperluan: "Praktikum",
      },
    ]);

    mockApprovePeminjaman.mockResolvedValue(undefined);
    mockRejectPeminjaman.mockResolvedValue(undefined);
  });

  it("menampilkan judul dan data pending approval", async () => {
    render(<PersetujuanPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Persetujuan Peminjaman Alat/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Andi")).toBeInTheDocument();
      expect(screen.getByText("Mikroskop")).toBeInTheDocument();
    });
  });

  it("menampilkan loading state saat request belum selesai", () => {
    mockGetPendingApprovals.mockReturnValue(new Promise(() => {}));

    const { container } = render(<PersetujuanPage />);

    expect(
      container.querySelectorAll('[data-slot="card"]').length,
    ).toBeGreaterThan(0);
  });

  it("membuka dialog approve dan memproses persetujuan", async () => {
    render(<PersetujuanPage />);

    await waitFor(() => {
      expect(screen.getByText("Andi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Setujui/i }));

    await waitFor(() => {
      expect(screen.getByText(/Konfirmasi Persetujuan/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Ya, Setujui/i }));

    await waitFor(() => {
      expect(mockApprovePeminjaman).toHaveBeenCalledWith("req-1");
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
