import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PeminjamanAktifPage from "@/pages/laboran/PeminjamanAktifPage";

const {
  mockCacheAPI,
  mockInvalidateCache,
  mockGetPendingApprovals,
  mockApprovePeminjaman,
  mockRejectPeminjaman,
  mockGetActiveBorrowings,
  mockGetReturnRequestedBorrowings,
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
  mockGetReturnRequestedBorrowings: vi.fn(),
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
  getReturnRequestedBorrowings: (...args: unknown[]) =>
    mockGetReturnRequestedBorrowings(...args),
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
    mockGetReturnRequestedBorrowings.mockResolvedValue([
      {
        id: "r1",
        peminjam_nama: "Andi",
        peminjam_nim: "001",
        inventaris_nama: "Mikroskop",
        inventaris_kode: "MKR-01",
        laboratorium_nama: "Lab Anatomi",
        jumlah_pinjam: 1,
        tanggal_pinjam: "2025-01-10",
        tanggal_kembali_rencana: "2025-01-12",
        kondisi_pinjam: "baik",
        keterangan_kembali: null,
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
    const { unmount } = render(<PeminjamanAktifPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Peminjaman Alat/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Pusat Operasional Peminjaman/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Kelola tindak lanjut peminjaman alat dari satu tempat/i,
        ),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: /Sedang Dipinjam/i }));

    await waitFor(() => {
      expect(screen.getByText("Andi")).toBeInTheDocument();
      expect(screen.getByText("Mikroskop")).toBeInTheDocument();
    });

    unmount();

    mockGetPendingApprovals.mockResolvedValue([
      {
        id: "p-1",
        peminjam_nama: "Andi",
        peminjam_nim: "001",
        inventaris_nama: "Tensimeter +2 alat lain",
        inventaris_detail: "1x Tensimeter, 1x Stetoskop, 2x Termometer",
        inventaris_kode: "TEN-01 +2",
        laboratorium_nama: "Lab Anatomi",
        jumlah_pinjam: 4,
        tanggal_pinjam: "2025-01-10",
        tanggal_kembali_rencana: "2025-01-12",
        keperluan: "Praktikum",
      },
    ]);

    render(<PeminjamanAktifPage />);

    await userEvent.click(
      screen.getByRole("tab", {
        name: /Menunggu Persetujuan/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Tensimeter +2 alat lain")).toBeInTheDocument();
      expect(
        screen.getByText("1x Tensimeter, 1x Stetoskop, 2x Termometer"),
      ).toBeInTheDocument();
    });
  });

  it("buka dialog pengembalian dan submit return", async () => {
    const user = userEvent.setup();
    render(<PeminjamanAktifPage />);

    const returnRequestedTab = screen.getByRole("tab", {
      name: /Pengembalian Diajukan/i,
    });
    await user.click(returnRequestedTab);

    await waitFor(() => {
      expect(returnRequestedTab).toHaveAttribute("aria-selected", "true");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Verifikasi Pengembalian/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Verifikasi Pengembalian/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan Verifikasi/i }));

    await waitFor(() => {
      expect(mockMarkBorrowingReturned).toHaveBeenCalled();
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        "laboran_return_requested_borrowings",
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
