import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LaporanPage from "@/pages/laboran/LaporanPage";

const {
  mockGetBorrowingStats,
  mockGetEquipmentStats,
  mockGetLabUsageStats,
  mockGetTopBorrowedItems,
  mockGetLabUtilization,
  mockGetRecentActivities,
  mockToast,
} = vi.hoisted(() => ({
  mockGetBorrowingStats: vi.fn(),
  mockGetEquipmentStats: vi.fn(),
  mockGetLabUsageStats: vi.fn(),
  mockGetTopBorrowedItems: vi.fn(),
  mockGetLabUtilization: vi.fn(),
  mockGetRecentActivities: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/api/reports.api", () => ({
  getBorrowingStats: (...args: unknown[]) => mockGetBorrowingStats(...args),
  getEquipmentStats: (...args: unknown[]) => mockGetEquipmentStats(...args),
  getLabUsageStats: (...args: unknown[]) => mockGetLabUsageStats(...args),
  getTopBorrowedItems: (...args: unknown[]) => mockGetTopBorrowedItems(...args),
  getLabUtilization: (...args: unknown[]) => mockGetLabUtilization(...args),
  getRecentActivities: (...args: unknown[]) => mockGetRecentActivities(...args),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("Laboran LaporanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetBorrowingStats.mockResolvedValue({
      total_borrowings: 45,
      pending: 2,
      approved: 20,
      returned: 18,
    });
    mockGetEquipmentStats.mockResolvedValue({
      total_items: 100,
      available: 80,
      borrowed: 20,
      low_stock: 5,
      out_of_stock: 1,
      total_categories: 6,
    });
    mockGetLabUsageStats.mockResolvedValue({
      total_labs: 5,
      active_schedules: 4,
      approved_bookings: 3,
      pending_bookings: 1,
      total_capacity: 120,
    });
    mockGetTopBorrowedItems.mockResolvedValue([]);
    mockGetLabUtilization.mockResolvedValue([]);
    mockGetRecentActivities.mockResolvedValue([]);
  });

  it("menampilkan judul dan tab laporan", async () => {
    render(<LaporanPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Laporan\s*&\s*Analitik/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Overview/i }),
      ).toBeInTheDocument();
    });
  });

  it("menampilkan statistik overview dari API", async () => {
    render(<LaporanPage />);

    await waitFor(() => {
      expect(screen.getByText(/Statistik Peminjaman/i)).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  it("menjalankan refresh data saat tombol muat ulang diklik", async () => {
    render(<LaporanPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Muat Ulang Data/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Muat Ulang Data/i }));

    await waitFor(() => {
      expect(mockGetBorrowingStats).toHaveBeenCalledTimes(2);
      expect(mockToast.info).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
