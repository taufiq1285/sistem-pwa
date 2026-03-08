import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PeminjamanAktifPage from "@/pages/laboran/PeminjamanAktifPage";

const {
  mockCacheAPI,
  mockInvalidateCache,
  mockGetActiveBorrowings,
  mockGetReturnedBorrowings,
  mockMarkBorrowingReturned,
  mockToast,
} = vi.hoisted(() => ({
  mockCacheAPI: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockGetActiveBorrowings: vi.fn(),
  mockGetReturnedBorrowings: vi.fn(),
  mockMarkBorrowingReturned: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/api/laboran.api", () => ({
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

    mockGetReturnedBorrowings.mockResolvedValue([]);
    mockMarkBorrowingReturned.mockResolvedValue(undefined);
    mockInvalidateCache.mockResolvedValue(undefined);
  });

  it("menampilkan heading dan data peminjaman aktif", async () => {
    render(<PeminjamanAktifPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Kelola Peminjaman Aktif/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Andi")).toBeInTheDocument();
    expect(screen.getByText("Mikroskop")).toBeInTheDocument();
  });

  it("buka dialog pengembalian dan submit return", async () => {
    render(<PeminjamanAktifPage />);

    await waitFor(() => {
      expect(screen.getByText("Andi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Sudah Kembali/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Tandai Sudah Kembali/i }),
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
