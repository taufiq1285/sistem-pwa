import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ApprovalPage from "@/pages/laboran/ApprovalPage";

const {
  mockCacheAPI,
  mockApprovePeminjaman,
  mockRejectPeminjaman,
  mockInvalidateCache,
  mockToast,
} = vi.hoisted(() => ({
  mockCacheAPI: vi.fn(),
  mockApprovePeminjaman: vi.fn(),
  mockRejectPeminjaman: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: vi.fn().mockResolvedValue(null),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getPendingApprovals: vi.fn(),
  approvePeminjaman: (...args: unknown[]) => mockApprovePeminjaman(...args),
  rejectPeminjaman: (...args: unknown[]) => mockRejectPeminjaman(...args),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("Laboran ApprovalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCacheAPI.mockImplementation(
      async (_key: string, fn: () => Promise<any>) => {
        return await fn();
      },
    );

    mockApprovePeminjaman.mockResolvedValue(undefined);
    mockRejectPeminjaman.mockResolvedValue(undefined);
    mockInvalidateCache.mockResolvedValue(undefined);
  });

  it("menampilkan daftar request pending", async () => {
    mockCacheAPI.mockResolvedValue([
      {
        id: "req-1",
        peminjam_nama: "Andi",
        peminjam_nim: "001",
        inventaris_nama: "Mikroskop",
        inventaris_kode: "MKR-01",
        laboratorium_nama: "Lab Anatomi",
        jumlah_pinjam: 2,
        keperluan: "Praktikum",
        tanggal_pinjam: "2025-01-10",
        tanggal_kembali_rencana: "2025-01-12",
        created_at: "2025-01-09",
      },
    ]);

    render(<ApprovalPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Persetujuan Peminjaman/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Andi")).toBeInTheDocument();
    expect(screen.getByText("Mikroskop")).toBeInTheDocument();
  });

  it("approve request memanggil API dan invalidate cache", async () => {
    mockCacheAPI.mockResolvedValue([
      {
        id: "req-1",
        peminjam_nama: "Andi",
        peminjam_nim: "001",
        inventaris_nama: "Mikroskop",
        inventaris_kode: "MKR-01",
        laboratorium_nama: "Lab Anatomi",
        jumlah_pinjam: 2,
        keperluan: "Praktikum",
        tanggal_pinjam: "2025-01-10",
        tanggal_kembali_rencana: "2025-01-12",
        created_at: "2025-01-09",
      },
    ]);

    render(<ApprovalPage />);

    await waitFor(() => {
      expect(screen.getByText("Andi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));

    await waitFor(() => {
      expect(mockApprovePeminjaman).toHaveBeenCalledWith("req-1");
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        "laboran_pending_approvals",
      );
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it("reject request validasi alasan wajib diisi", async () => {
    mockCacheAPI.mockResolvedValue([
      {
        id: "req-1",
        peminjam_nama: "Andi",
        peminjam_nim: "001",
        inventaris_nama: "Mikroskop",
        inventaris_kode: "MKR-01",
        laboratorium_nama: "Lab Anatomi",
        jumlah_pinjam: 2,
        keperluan: "Praktikum",
        tanggal_pinjam: "2025-01-10",
        tanggal_kembali_rencana: "2025-01-12",
        created_at: "2025-01-09",
      },
    ]);

    render(<ApprovalPage />);

    await waitFor(() => {
      expect(screen.getByText("Andi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Reject/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Tolak Permintaan Peminjaman/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Tolak$/i }));

    expect(mockToast.error).toHaveBeenCalledWith(
      "Alasan penolakan harus diisi",
    );
  });
});
