/**
 * Admin Remaining Pages Tests
 * AcademicAssignmentPage, AssignmentManagementPage, KelasPage,
 * RolesPage, SyncManagementPage, SyncMonitoringPage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockUseAuth, mockCacheAPI, mockToast, mockUseSync } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(),
    mockCacheAPI: vi.fn(),
    mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
    mockUseSync: vi.fn(),
  }),
);

vi.mock("@/lib/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...a: unknown[]) => mockCacheAPI(...a),
  getCachedData: vi.fn().mockResolvedValue(null),
  invalidateCache: vi.fn(),
}));
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
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock("@/lib/api/kelas.api", () => ({
  getKelas: vi.fn(),
  createKelas: vi.fn(),
  updateKelas: vi.fn(),
  deleteKelas: vi.fn(),
  getEnrolledStudents: vi.fn(),
  enrollStudent: vi.fn(),
  unenrollStudent: vi.fn(),
  toggleStudentStatus: vi.fn(),
  getAllMahasiswa: vi.fn(),
}));

vi.mock("@/lib/api/users.api", () => ({
  getUserStats: vi.fn(),
  getUsers: vi.fn(),
}));

vi.mock("@/lib/api/sync.api", () => ({
  getSyncManagementStats: vi.fn(),
  forceSyncNow: vi.fn(),
}));

vi.mock("@/lib/hooks/useSync", () => ({
  useSync: () => mockUseSync(),
}));

vi.mock("@/components/common/DeleteConfirmDialog", () => ({
  DeleteConfirmDialog: () => null,
}));
vi.mock("@/components/shared/DataTable/TableSkeleton", () => ({
  TableSkeleton: () => <div data-testid="table-skeleton" />,
}));
vi.mock("@/components/shared/DataTable/EnhancedEmptyState", () => ({
  EnhancedEmptyState: () => <div data-testid="empty-state" />,
}));
vi.mock("@/components/shared/DataTable/BulkActionsBar", () => ({
  BulkActionsBar: () => null,
  BulkActions: {
    delete: (onClick: () => void) => ({
      label: "Delete",
      onClick,
      variant: "destructive",
    }),
    activate: (onClick: () => void) => ({
      label: "Activate",
      onClick,
      variant: "outline",
    }),
    deactivate: (onClick: () => void) => ({
      label: "Deactivate",
      onClick,
      variant: "outline",
    }),
  },
}));
vi.mock("@/components/shared/DataTable/RowSelectionColumn", () => ({
  RowSelectionHeader: () => null,
  RowSelectionCell: () => null,
}));
vi.mock("@/components/shared/DataTable/ColumnVisibility", () => ({
  ColumnVisibilityDropdown: () => null,
}));
vi.mock("@/components/shared/DataTable/useRowSelection", () => ({
  useRowSelection: () => ({
    selectedRows: new Set(),
    selectedItems: [],
    selectedCount: 0,
    isAllSelected: false,
    isSomeSelected: false,
    toggleRow: vi.fn(),
    toggleAll: vi.fn(),
    clearSelection: vi.fn(),
    isSelected: vi.fn(() => false),
  }),
}));
vi.mock("@/components/shared/DataTable/useTableExport", () => ({
  useTableExport: () => ({ exportToCSV: vi.fn(), exportToExcel: vi.fn() }),
}));
vi.mock("@/lib/utils/normalize", () => ({
  normalize: (s: string) => s?.toLowerCase() ?? "",
}));

import * as kelasApi from "@/lib/api/kelas.api";
import * as usersApi from "@/lib/api/users.api";
import * as syncApi from "@/lib/api/sync.api";

const mockAdminUser = { id: "u1", full_name: "Admin Eko", role: "admin" };

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ─── AcademicAssignmentPage ───────────────────────────────────────────────────
import AcademicAssignmentPage from "@/pages/admin/AcademicAssignmentPage";

describe("Admin AcademicAssignmentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    // supabase.from mock handles all queries with empty data
  });

  it("menampilkan judul Assignment Dosen Akademik", async () => {
    wrap(<AcademicAssignmentPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Assignment Dosen Akademik/i }),
      ).toBeInTheDocument(),
    );
  });

  it("tidak crash saat dirender", () => {
    expect(() => wrap(<AcademicAssignmentPage />)).not.toThrow();
  });
});

// ─── AssignmentManagementPage ────────────────────────────────────────────────
import AssignmentManagementPage from "@/pages/admin/AssignmentManagementPage";

describe("Admin AssignmentManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
  });

  it("menampilkan judul Management Assignment Dosen", async () => {
    wrap(<AssignmentManagementPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Management Assignment Dosen/i }),
      ).toBeInTheDocument(),
    );
  });

  it("tidak crash saat dirender", () => {
    expect(() => wrap(<AssignmentManagementPage />)).not.toThrow();
  });
});

// ─── KelasPage ───────────────────────────────────────────────────────────────
import KelasPage from "@/pages/admin/KelasPage";

describe("Admin KelasPage", () => {
  const mockKelas = [
    {
      id: "k1",
      nama_kelas: "TI-1A",
      kode_kelas: "TIA",
      total_mahasiswa: 25,
      mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi" },
    },
    {
      id: "k2",
      nama_kelas: "TI-1B",
      kode_kelas: "TIB",
      total_mahasiswa: 20,
      mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    vi.mocked(kelasApi.getKelas).mockResolvedValue(mockKelas as any);
    vi.mocked(kelasApi.getAllMahasiswa).mockResolvedValue([] as any);
    mockCacheAPI.mockImplementation(
      async (_key: string, fn?: () => Promise<unknown>) => {
        if (typeof fn === "function") return fn();
        return [];
      },
    );
  });

  it("menampilkan judul Kelola Kelas", async () => {
    wrap(<KelasPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Kelola Kelas/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan judul Daftar Kelas", async () => {
    wrap(<KelasPage />);
    await waitFor(() =>
      expect(screen.getByText(/Daftar Kelas/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan data kelas dari API", async () => {
    wrap(<KelasPage />);
    await waitFor(() =>
      expect(screen.getByText(/Total 2 kelas/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan tombol tambah kelas", async () => {
    wrap(<KelasPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Buat Kelas/i }),
      ).toBeInTheDocument(),
    );
  });

  it("tidak crash saat API error", async () => {
    vi.mocked(kelasApi.getKelas).mockRejectedValue(new Error("error"));
    expect(() => wrap(<KelasPage />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
  });
});

// ─── RolesPage ────────────────────────────────────────────────────────────────
import RolesPage from "@/pages/admin/RolesPage";

describe("Admin RolesPage", () => {
  const mockStats = {
    total: 50,
    mahasiswa: 40,
    dosen: 5,
    laboran: 3,
    admin: 2,
    active: 48,
    inactive: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    vi.mocked(usersApi.getUserStats).mockResolvedValue(mockStats as any);
  });

  it("menampilkan judul Roles & Permissions", async () => {
    wrap(<RolesPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Roles.*Permissions/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan statistik user", async () => {
    wrap(<RolesPage />);
    await waitFor(() => expect(screen.getByText("50")).toBeInTheDocument());
  });

  it("tidak crash saat API error", async () => {
    vi.mocked(usersApi.getUserStats).mockRejectedValue(new Error("error"));
    expect(() => wrap(<RolesPage />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
  });
});

// ─── SyncManagementPage ───────────────────────────────────────────────────────
import SyncManagementPage from "@/pages/admin/SyncManagementPage";

describe("Admin SyncManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    vi.mocked(syncApi.getSyncManagementStats).mockResolvedValue({
      pendingSync: 0,
      synced: 150,
      failed: 2,
      conflicts: 1,
      lastSync: "Never",
      queueStats: {
        total: 0,
        pending: 0,
        syncing: 0,
        completed: 0,
        failed: 0,
      },
      syncStats: {
        totalSynced: 150,
        totalFailed: 2,
        averageDuration: 0,
        syncHistory: [],
      },
    } as any);
    vi.mocked(syncApi.forceSyncNow).mockResolvedValue(undefined);
  });

  it("menampilkan judul Sync Management", async () => {
    wrap(<SyncManagementPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Sync Management/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan tombol force sync", async () => {
    wrap(<SyncManagementPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Force Sync|Sync Now/i }),
      ).toBeInTheDocument(),
    );
  });

  it("tidak crash saat API error", async () => {
    vi.mocked(syncApi.getSyncManagementStats).mockRejectedValue(
      new Error("error"),
    );
    expect(() => wrap(<SyncManagementPage />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));
  });
});

// ─── SyncMonitoringPage ───────────────────────────────────────────────────────
import { SyncMonitoringPage } from "@/pages/admin/SyncMonitoringPage";

describe("Admin SyncMonitoringPage", () => {
  const mockSyncReturn = {
    addToQueue: vi.fn(),
    processQueue: vi.fn(),
    retryFailed: vi.fn(),
    clearCompleted: vi.fn(),
    getAllItems: vi.fn().mockResolvedValue([]),
    refreshStats: vi.fn(),
    stats: { pending: 0, failed: 0, completed: 0, total: 0 },
    isProcessing: false,
    isReady: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockAdminUser });
    mockUseSync.mockReturnValue(mockSyncReturn);
  });

  it("menampilkan judul Sync Monitoring", async () => {
    wrap(<SyncMonitoringPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Sync Monitoring/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan status sync", async () => {
    wrap(<SyncMonitoringPage />);
    await waitFor(() =>
      expect(
        screen.getAllByText(/Queue Kosong|Tidak ada|pending/i).length,
      ).toBeGreaterThan(0),
    );
  });

  it("tidak crash saat dirender", () => {
    expect(() => wrap(<SyncMonitoringPage />)).not.toThrow();
  });
});
