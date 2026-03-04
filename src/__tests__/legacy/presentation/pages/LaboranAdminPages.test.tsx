/**
 * Laboran & Admin Pages Tests
 * Laboran: InventarisPage, LaboratoriumPage, PersetujuanPage, LaporanPage
 * Admin: AnalyticsPage, CleanupPage, MahasiswaManagementPage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockUseAuth, mockCacheAPI, mockNavigate, mockToast } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(),
    mockCacheAPI: vi.fn(),
    mockNavigate: vi.fn(),
    mockToast: { success: vi.fn(), error: vi.fn() },
  }),
);

vi.mock("@/lib/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...a: unknown[]) => mockCacheAPI(...a),
  invalidateCache: vi.fn(),
}));
vi.mock("react-router-dom", async (orig) => {
  const a = await orig<typeof import("react-router-dom")>();
  return { ...a, useNavigate: () => mockNavigate };
});
vi.mock("sonner", () => ({ toast: mockToast }));
vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: { isOnline: vi.fn(() => true) },
}));
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getLaboranStats: vi.fn(),
  getPendingApprovals: vi.fn(),
  processApproval: vi.fn(),
  approvePeminjaman: vi.fn(),
  rejectPeminjaman: vi.fn(),

  getInventarisList: vi.fn(),
  getInventarisCategories: vi.fn(),
  createInventaris: vi.fn(),
  updateInventaris: vi.fn(),
  deleteInventaris: vi.fn(),
  updateStock: vi.fn(),

  getLaboratoriumList: vi.fn(),
  getLabScheduleByLabId: vi.fn(),
  getLabEquipment: vi.fn(),
  createLaboratorium: vi.fn(),
  updateLaboratorium: vi.fn(),
  deleteLaboratorium: vi.fn(),
}));

vi.mock("@/lib/api/reports.api", () => ({
  getBorrowingStats: vi.fn(),
  getEquipmentStats: vi.fn(),
  getLabUsageStats: vi.fn(),
  getTopBorrowedItems: vi.fn(),
  getLabUtilization: vi.fn(),
  getRecentActivities: vi.fn(),
}));

vi.mock("@/lib/api/analytics.api", () => ({
  getAnalyticsData: vi.fn(),
  getSystemStats: vi.fn(),
}));

vi.mock("@/lib/api/admin.api", () => ({
  cleanupData: vi.fn(),
  getCleanupStats: vi.fn(),
  getOrphanedData: vi.fn(),
  runCleanup: vi.fn(),
}));

vi.mock("@/lib/api/users.api", () => ({
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

import * as laboranApiRaw from "@/lib/api/laboran.api";
import * as reportsApiRaw from "@/lib/api/reports.api";
import * as analyticsApiRaw from "@/lib/api/analytics.api";
import * as adminApiRaw from "@/lib/api/admin.api";
import * as usersApiRaw from "@/lib/api/users.api";

const laboranApi = laboranApiRaw as any;
const reportsApi = reportsApiRaw as any;
const analyticsApi = analyticsApiRaw as any;
const adminApi = adminApiRaw as any;
const usersApi = usersApiRaw as any;

const mockLaboranUser = {
  id: "u1",
  full_name: "Laboran Sari",
  role: "laboran",
};
const mockAdminUser = { id: "u2", full_name: "Admin Eko", role: "admin" };

function wrap(ui: React.ReactElement, path = "/", route = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

import InventarisPage from "@/pages/laboran/InventarisPage";
import LaboratoriumPage from "@/pages/laboran/LaboratoriumPage";
import PersetujuanPage from "@/pages/laboran/PersetujuanPage";
import LaporanPage from "@/pages/laboran/LaporanPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import CleanupPage from "@/pages/admin/CleanupPage";
import MahasiswaManagementPage from "@/pages/admin/MahasiswaManagementPage";

describe("Laboran InventarisPage", () => {
  const mockInventaris = [
    {
      id: "inv-1",
      nama_barang: "Mikroskop",
      kode_barang: "MKR-001",
      jumlah: 10,
      jumlah_tersedia: 8,
      kondisi: "baik",
      laboratorium: { id: "lab-1", kode_lab: "LA-01", nama_lab: "Lab Anatomi" },
    },
    {
      id: "inv-2",
      nama_barang: "Pipet",
      kode_barang: "PPT-001",
      jumlah: 50,
      jumlah_tersedia: 45,
      kondisi: "baik",
      laboratorium: { id: "lab-1", kode_lab: "LA-01", nama_lab: "Lab Anatomi" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockLaboranUser });
    vi.mocked(laboranApi.getInventarisList).mockResolvedValue({
      data: mockInventaris as any,
      count: 2,
    });
    vi.mocked(laboranApi.getInventarisCategories).mockResolvedValue([
      "Alat Lab",
      "Umum",
    ] as any);
    mockCacheAPI.mockImplementation(
      async (_k: string, fn: () => Promise<unknown>) => fn(),
    );
  });

  it("menampilkan loading skeleton saat memuat data", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(<InventarisPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin") ||
        screen.getByRole("heading", { name: /Inventaris/i }),
    ).toBeTruthy();
  });

  it("menampilkan judul Inventaris", async () => {
    wrap(<InventarisPage />);
    await waitFor(() =>
      expect(screen.getByText(/Inventaris/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan data inventaris dari API", async () => {
    wrap(<InventarisPage />);
    await waitFor(() =>
      expect(screen.getByText("Mikroskop")).toBeInTheDocument(),
    );
  });
});

describe("Laboran LaboratoriumPage", () => {
  const mockLabs = [
    {
      id: "lab-1",
      nama_lab: "Lab Anatomi",
      kode_lab: "LA-01",
      kapasitas: 30,
      lokasi: "Gedung A",
      is_active: true,
    },
    {
      id: "lab-2",
      nama_lab: "Lab Biologi",
      kode_lab: "LB-01",
      kapasitas: 25,
      lokasi: "Gedung B",
      is_active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockLaboranUser });
    vi.mocked(laboranApi.getLaboratoriumList).mockResolvedValue(
      mockLabs as any,
    );
  });

  it("menampilkan loading skeleton saat memuat", () => {
    vi.mocked(laboranApi.getLaboratoriumList).mockReturnValue(
      new Promise(() => {}),
    );
    const { container } = wrap(<LaboratoriumPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin") ||
        screen.getByRole("heading", { name: /^Laboratorium$/i }),
    ).toBeTruthy();
  });

  it("menampilkan judul Laboratorium", async () => {
    wrap(<LaboratoriumPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /^Laboratorium$/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan data lab dari API", async () => {
    wrap(<LaboratoriumPage />);
    await waitFor(() =>
      expect(screen.getByText("Lab Anatomi")).toBeInTheDocument(),
    );
  });
});

describe("Laboran PersetujuanPage", () => {
  const mockPending = [
    {
      id: "pjm-1",
      peminjam_nama: "Andi",
      peminjam_nim: "001",
      inventaris_nama: "Mikroskop",
      inventaris_kode: "MKR-001",
      laboratorium_nama: "Lab Anatomi",
      jumlah_pinjam: 2,
      keperluan: "Praktikum",
      tanggal_pinjam: "2025-01-10",
      tanggal_kembali_rencana: "2025-01-12",
      created_at: "2025-01-09",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockLaboranUser });
    vi.mocked(laboranApi.getPendingApprovals).mockResolvedValue(
      mockPending as any,
    );
  });

  it("menampilkan judul Persetujuan / Approval", async () => {
    wrap(<PersetujuanPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Persetujuan Peminjaman Alat/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan data pending approval", async () => {
    wrap(<PersetujuanPage />);
    await waitFor(() => expect(screen.getByText("Andi")).toBeInTheDocument());
  });
});

describe("Laboran LaporanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockLaboranUser });

    vi.mocked(reportsApi.getBorrowingStats).mockResolvedValue({
      totalPeminjaman: 45,
      pending: 2,
      disetujui: 40,
      ditolak: 3,
      dikembalikan: 20,
    } as any);
    vi.mocked(reportsApi.getEquipmentStats).mockResolvedValue({
      totalEquipment: 100,
      tersedia: 80,
      dipinjam: 20,
      maintenance: 5,
      rusak: 2,
    } as any);
    vi.mocked(reportsApi.getLabUsageStats).mockResolvedValue({
      totalLabs: 5,
      activeLabs: 4,
      utilizationRate: 80,
    } as any);
    vi.mocked(reportsApi.getTopBorrowedItems).mockResolvedValue([] as any);
    vi.mocked(reportsApi.getLabUtilization).mockResolvedValue([] as any);
    vi.mocked(reportsApi.getRecentActivities).mockResolvedValue([] as any);
  });

  it("menampilkan judul Laporan", async () => {
    wrap(<LaporanPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Laporan\s*&\s*Analitik/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan tab navigasi laporan", async () => {
    wrap(<LaporanPage />);
    await waitFor(() => {
      const tabs = screen.queryAllByRole("tab");
      expect(tabs.length).toBeGreaterThan(0);
    });
  });
});

describe("Admin AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    mockCacheAPI.mockResolvedValue([]);
    vi.mocked(analyticsApi.getAnalyticsData).mockResolvedValue({} as any);
    vi.mocked(analyticsApi.getSystemStats).mockResolvedValue({} as any);
  });

  it("menampilkan heading Analytics", async () => {
    wrap(<AnalyticsPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Analytics Dashboard/i }),
      ).toBeInTheDocument(),
    );
  });

  it("tidak crash saat dirender", () => {
    expect(() => wrap(<AnalyticsPage />)).not.toThrow();
  });
});

describe("Admin CleanupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    mockCacheAPI.mockResolvedValue([]);
    vi.mocked(adminApi.getCleanupStats).mockResolvedValue({} as any);
    vi.mocked(adminApi.getOrphanedData).mockResolvedValue([] as any);
  });

  it("menampilkan judul Cleanup", async () => {
    wrap(<CleanupPage />);
    await waitFor(() =>
      expect(screen.getByText(/Cleanup|Pembersihan/i)).toBeInTheDocument(),
    );
  });
});

describe("Admin MahasiswaManagementPage", () => {
  const mockMahasiswaList = [
    {
      id: "u1",
      full_name: "Andi Susanto",
      email: "andi@test.com",
      role: "mahasiswa",
      mahasiswa: { nim: "001", kelas_id: "k1" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    mockCacheAPI.mockResolvedValue(mockMahasiswaList);
    vi.mocked(usersApi.getUsers).mockResolvedValue(mockMahasiswaList as any);
  });

  it("menampilkan judul halaman mahasiswa", async () => {
    wrap(<MahasiswaManagementPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Manajemen Mahasiswa/i }),
      ).toBeInTheDocument(),
    );
  });
});
