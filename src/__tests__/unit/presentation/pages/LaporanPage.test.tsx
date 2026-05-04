import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import LaporanPage from "@/pages/laboran/LaporanPage";

const {
  mockGetBorrowingStats,
  mockGetEquipmentStats,
  mockGetLabUsageStats,
  mockGetTopBorrowedItems,
  mockGetLabUtilization,
  mockGetRecentActivities,
  mockToast,
  mockPrint,
  mockAppendChild,
  mockRemove,
  mockIframeDocumentOpen,
  mockIframeDocumentWrite,
  mockIframeDocumentClose,
  mockIframeFocus,
} = vi.hoisted(() => ({
  mockGetBorrowingStats: vi.fn(),
  mockGetEquipmentStats: vi.fn(),
  mockGetLabUsageStats: vi.fn(),
  mockGetTopBorrowedItems: vi.fn(),
  mockGetLabUtilization: vi.fn(),
  mockGetRecentActivities: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  mockPrint: vi.fn(),
  mockAppendChild: vi.fn(),
  mockRemove: vi.fn(),
  mockIframeDocumentOpen: vi.fn(),
  mockIframeDocumentWrite: vi.fn(),
  mockIframeDocumentClose: vi.fn(),
  mockIframeFocus: vi.fn(),
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
    const originalCreateElement = document.createElement.bind(document);
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const mockIframe = {
      setAttribute: vi.fn(),
      style: {} as CSSStyleDeclaration,
      remove: mockRemove,
      contentWindow: {
        document: {
          open: mockIframeDocumentOpen,
          write: mockIframeDocumentWrite,
          close: mockIframeDocumentClose,
        },
        focus: mockIframeFocus,
        print: mockPrint,
      },
    };

    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string,
    ) => {
      if (tagName.toLowerCase() === "iframe") {
        return mockIframe as unknown as HTMLIFrameElement;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    vi.spyOn(document.body, "appendChild").mockImplementation(((node: Node) => {
      mockAppendChild(node);
      if (node === (mockIframe as unknown as Node)) {
        return node;
      }
      return originalAppendChild(node);
    }) as typeof document.body.appendChild);

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
        screen.getByRole("heading", { name: /Laporan Laboratorium/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Ringkasan/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Pusat rekap, ekspor, dan print pertanggungjawaban kegiatan laboratorium/i,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Print Laporan/i }),
      ).toBeInTheDocument();
    });
  });

  it("menampilkan statistik overview dari API", async () => {
    render(<LaporanPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ringkasan Laporan/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Total Peminjaman/i).length).toBeGreaterThan(
        0,
      );
    });
  });

  it("menampilkan CTA ekspor yang konsisten di tab data utama", async () => {
    render(<LaporanPage />);

    const borrowingTab = screen.getByRole("tab", { name: /Peminjaman/i });
    fireEvent.mouseDown(borrowingTab);
    fireEvent.click(borrowingTab);

    await waitFor(() => {
      const activePanel = screen.getByRole("tabpanel");
      expect(
        within(activePanel).getByRole("heading", {
          name: /^Rekap Peminjaman$/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(activePanel).getByRole("button", { name: /Ekspor CSV/i }),
      ).toBeInTheDocument();
    });

    const equipmentTab = screen.getByRole("tab", { name: /Inventaris/i });
    fireEvent.mouseDown(equipmentTab);
    fireEvent.click(equipmentTab);

    await waitFor(() => {
      const activePanel = screen.getByRole("tabpanel");
      expect(
        within(activePanel).getByRole("heading", {
          name: /^Rekap Inventaris$/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(activePanel).getByRole("button", { name: /Ekspor CSV/i }),
      ).toBeInTheDocument();
    });

    const labsTab = screen.getByRole("tab", { name: /Laboratorium/i });
    fireEvent.mouseDown(labsTab);
    fireEvent.click(labsTab);

    await waitFor(() => {
      const activePanel = screen.getByRole("tabpanel");
      expect(
        within(activePanel).getByRole("heading", {
          name: /^Rekap Laboratorium$/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(activePanel).getByRole("button", { name: /Ekspor CSV/i }),
      ).toBeInTheDocument();
    });
  });

  it("menampilkan riwayat sebagai pelengkap saat tab riwayat dibuka", async () => {
    render(<LaporanPage />);

    const historyTab = screen.getByRole("tab", { name: /Riwayat/i });
    fireEvent.mouseDown(historyTab);
    fireEvent.click(historyTab);

    await waitFor(() => {
      const activePanel = screen.getByRole("tabpanel");
      expect(
        within(activePanel).getByRole("heading", {
          name: /^Riwayat Aktivitas$/i,
        }),
      ).toBeInTheDocument();
      expect(
        within(activePanel).getByText(
          /Aktivitas operasional terbaru sebagai pelengkap rekap utama, bukan pusat ekspor laporan/i,
        ),
      ).toBeInTheDocument();
      expect(
        within(activePanel).getByText(/Tidak ada riwayat aktivitas/i),
      ).toBeInTheDocument();
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

  it("menerapkan filter periode opsional ke loader laporan", async () => {
    render(<LaporanPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Tanggal Mulai/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tanggal Akhir/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Tanggal Mulai/i), {
      target: { value: "2026-05-01" },
    });
    fireEvent.change(screen.getByLabelText(/Tanggal Akhir/i), {
      target: { value: "2026-05-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Terapkan Periode/i }));

    await waitFor(() => {
      expect(mockGetBorrowingStats).toHaveBeenLastCalledWith({
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      });
      expect(mockGetTopBorrowedItems).toHaveBeenLastCalledWith(10, {
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      });
      expect(mockGetLabUsageStats).toHaveBeenLastCalledWith({
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      });
      expect(mockGetLabUtilization).toHaveBeenLastCalledWith({
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      });
      expect(mockGetRecentActivities).toHaveBeenLastCalledWith(15, {
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      });
      expect(
        screen.getByText(
          /Dokumen print disusun sebagai laporan resmi laboratorium/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("menjalankan print laporan resmi", async () => {
    render(<LaporanPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Print Laporan/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Print Laporan/i }));

    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockIframeDocumentOpen).toHaveBeenCalledTimes(1);
    expect(mockIframeDocumentWrite).toHaveBeenCalledTimes(1);
    expect(mockIframeDocumentClose).toHaveBeenCalledTimes(1);
    expect(mockIframeFocus).toHaveBeenCalledTimes(1);
    expect(mockPrint).toHaveBeenCalledTimes(1);
    const printDocument = screen.getByTestId("laporan-print-document");

    expect(
      within(printDocument).getByText(/Laporan Pertanggungjawaban Laboran/i),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByText(/Dokumen Resmi/i),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-header"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-footer"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByText(/I\.\s*Ringkasan Laporan/i),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByText(/II\.\s*Rekap Peminjaman/i),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByText(/III\.\s*Rekap Inventaris/i),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByText(/IV\.\s*Rekap Laboratorium/i),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByText(/V\.\s*Riwayat Aktivitas/i),
    ).toBeInTheDocument();
    expect(within(printDocument).queryByRole("button")).not.toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-section-peminjaman"),
    ).toHaveClass("report-print-section-page");
    expect(
      within(printDocument).getByTestId("print-section-inventaris"),
    ).toHaveClass("report-print-section-page");
    expect(
      within(printDocument).getByTestId("print-section-laboratorium"),
    ).toHaveClass("report-print-section-page");
    expect(
      within(printDocument).getByTestId("print-section-riwayat"),
    ).toHaveClass("report-print-section-page");
  });

  it("menjaga struktur print tetap rapi saat data detail banyak", async () => {
    mockGetTopBorrowedItems.mockResolvedValue([
      {
        inventaris_id: "inv-1",
        kode_barang: "AL-001",
        nama_barang: "Alat 1",
        kategori: "Kategori A",
        total_borrowed: 12,
        times_borrowed: 4,
      },
      {
        inventaris_id: "inv-2",
        kode_barang: "AL-002",
        nama_barang: "Alat 2",
        kategori: "Kategori B",
        total_borrowed: 7,
        times_borrowed: 2,
      },
    ]);
    mockGetLabUtilization.mockResolvedValue([
      {
        laboratorium_id: "lab-1",
        kode_lab: "LAB-01",
        nama_lab: "Laboratorium A",
        total_schedules: 5,
        total_hours: 18,
        utilization_percentage: 45,
      },
    ]);
    mockGetRecentActivities.mockResolvedValue([
      {
        id: "act-1",
        type: "borrowing",
        description: "Dr. A mengajukan peminjaman Alat 1",
        user_name: "Dr. A",
        timestamp: "2026-05-03T10:00:00Z",
      },
    ]);

    render(<LaporanPage />);

    await waitFor(() => {
      expect(
        within(screen.getByTestId("laporan-print-document")).getByTestId(
          "print-table-peminjaman",
        ),
      ).toBeInTheDocument();
    });

    const printDocument = screen.getByTestId("laporan-print-document");
    expect(
      within(printDocument).getByTestId("print-section-ringkasan"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-section-ringkasan"),
    ).toHaveClass("report-print-section-first");
    expect(
      within(printDocument).getByTestId("print-section-peminjaman"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-section-peminjaman"),
    ).toHaveClass("report-print-section-page");
    expect(
      within(printDocument).getByTestId("print-section-inventaris"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-section-inventaris"),
    ).toHaveClass("report-print-section-page");
    expect(
      within(printDocument).getByTestId("print-section-laboratorium"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-section-laboratorium"),
    ).toHaveClass("report-print-section-page");
    expect(
      within(printDocument).getByTestId("print-section-riwayat"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-section-riwayat"),
    ).toHaveClass("report-print-section-page");
    expect(
      within(printDocument).getByTestId("print-table-laboratorium"),
    ).toBeInTheDocument();
    expect(
      within(printDocument).getByTestId("print-table-riwayat"),
    ).toBeInTheDocument();
    expect(
      within(
        within(printDocument).getByTestId("print-table-peminjaman"),
      ).getByText(/^Alat 1$/i),
    ).toBeInTheDocument();
    expect(
      within(
        within(printDocument).getByTestId("print-table-laboratorium"),
      ).getByText(/Laboratorium A/i),
    ).toBeInTheDocument();
  });
});
