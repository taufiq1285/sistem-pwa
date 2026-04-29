import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PeminjamanAktifPage from "@/pages/laboran/PeminjamanAktifPage";

const {
  mockCacheAPI,
  mockInvalidateCache,
  mockGetPendingApprovals,
  mockApprovePeminjaman,
  mockRejectPeminjaman,
  mockGetActiveBorrowings,
  mockGetReturnedBorrowings,
  mockMarkBorrowingReturned,
  mockToast,
} = vi.hoisted(() => ({
  mockCacheAPI: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockGetPendingApprovals: vi.fn(),
  mockApprovePeminjaman: vi.fn(),
  mockRejectPeminjaman: vi.fn(),
  mockGetActiveBorrowings: vi.fn(),
  mockGetReturnedBorrowings: vi.fn(),
  mockMarkBorrowingReturned: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: vi.fn().mockResolvedValue(null),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getPendingApprovals: (...args: unknown[]) => mockGetPendingApprovals(...args),
  approvePeminjaman: (...args: unknown[]) => mockApprovePeminjaman(...args),
  rejectPeminjaman: (...args: unknown[]) => mockRejectPeminjaman(...args),
  getActiveBorrowings: (...args: unknown[]) => mockGetActiveBorrowings(...args),
  getReturnedBorrowings: (...args: unknown[]) =>
    mockGetReturnedBorrowings(...args),
  markBorrowingReturned: (...args: unknown[]) =>
    mockMarkBorrowingReturned(...args),
}));

vi.mock("@/lib/errors/permission.errors", () => ({
  getRBACErrorMessage: vi.fn(() => "RBAC error"),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/laboran/peminjaman" }),
}));

describe("Laboran PeminjamanAktifPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCacheAPI.mockImplementation(
      async (_key: string, fn: () => Promise<any>) => {
        return await fn();
      },
    );

    mockGetActiveBorrowings.mockResolvedValue([
      {
        id: "b1",
        peminjam_nama: "Andi",
        peminjam_nim: "001",
        inventaris_nama: "Mikroskop",
        inventaris_kode: "MKR-01",
        laboratorium_nama: "Lab Anatomi",
        jumlah_pinjam: 1,
        tanggal_pinjam: "2025-01-10",
        tanggal_kembali_rencana: "2025-01-12",
        kondisi_pinjam: "baik",
        is_overdue: false,
        days_overdue: 0,
      },
    ]);

    mockGetPendingApprovals.mockResolvedValue([]);
    mockGetReturnedBorrowings.mockResolvedValue([]);
    mockMarkBorrowingReturned.mockResolvedValue(undefined);
    mockApprovePeminjaman.mockResolvedValue(undefined);
    mockRejectPeminjaman.mockResolvedValue(undefined);
    mockInvalidateCache.mockResolvedValue(undefined);
  });

  it("menampilkan heading dan data peminjaman aktif", async () => {
    render(<PeminjamanAktifPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Peminjaman Alat/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: /Masih Dipinjam/i }));

    expect(screen.getByText("Andi")).toBeInTheDocument();
    expect(screen.getByText("Mikroskop")).toBeInTheDocument();
  });

  it("buka dialog pengembalian dan submit return", async () => {
    render(<PeminjamanAktifPage />);

    fireEvent.click(screen.getByRole("tab", { name: /Masih Dipinjam/i }));

    await waitFor(() => {
      expect(screen.getByText("Andi")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Terima Pengembalian/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Simpan Pengembalian/i }),
    );

    await waitFor(() => {
      expect(mockMarkBorrowingReturned).toHaveBeenCalled();
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        "laboran_active_borrowings",
      );
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it("menampilkan error toast saat load gagal", async () => {
    mockGetActiveBorrowings.mockRejectedValue(
      new Error("gagal load peminjaman"),
    );

    render(<PeminjamanAktifPage />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
