import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UsersPage from "@/pages/admin/UsersPage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockGetAllUsers,
  mockGetUserStats,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockGetAllUsers: vi.fn(),
  mockGetUserStats: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/common/PageHeader", () => ({
  PageHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}));

vi.mock("@/components/common/DeleteConfirmDialog", () => ({
  DeleteConfirmDialog: () => null,
}));

vi.mock("@/components/shared/DataTable/TableSkeleton", () => ({
  TableSkeleton: () => <div data-testid="table-skeleton">loading</div>,
}));

vi.mock("@/components/shared/DataTable/EnhancedTable", () => ({
  EnhancedTable: ({ children }: any) => <table>{children}</table>,
  EnhancedTableHeader: ({ children }: any) => <thead>{children}</thead>,
  EnhancedTableRow: ({ children }: any) => <tr>{children}</tr>,
  EnhancedTableHead: ({ children }: any) => <th>{children}</th>,
  EnhancedTableCell: ({ children }: any) => <td>{children}</td>,
}));

vi.mock("@/components/shared/DataTable/EnhancedEmptyState", () => ({
  EnhancedEmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  EmptySearchResults: () => <div>empty-search</div>,
}));

vi.mock("@/components/shared/DataTable/useRowSelection", () => ({
  useRowSelection: (opts: any) => ({
    selectedCount: 0,
    selectedItems: [],
    isAllSelected: false,
    isSomeSelected: false,
    clearSelection: vi.fn(),
    toggleAll: vi.fn(),
    toggleRow: vi.fn(),
    isSelected: (item: any) =>
      Boolean(opts?.data?.some((d: any) => d?.id && d.id === item?.id && false)),
  }),
}));

vi.mock("@/components/shared/DataTable/useTableExport", () => ({
  useTableExport: () => ({ exportToCSV: vi.fn() }),
}));

vi.mock("@/components/shared/DataTable/ColumnVisibility", () => ({
  ColumnVisibilityDropdown: () => null,
}));

vi.mock("@/components/shared/DataTable/BulkActionsBar", () => ({
  BulkActionsBar: () => null,
  BulkActions: {
    delete: vi.fn(() => ({ label: "delete" })),
    activate: vi.fn(() => ({ label: "activate" })),
    deactivate: vi.fn(() => ({ label: "deactivate" })),
  },
}));

vi.mock("@/components/shared/DataTable/RowSelectionColumn", () => ({
  RowSelectionHeader: () => null,
  RowSelectionCell: () => null,
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/api/users.api", () => ({
  getAllUsers: (...args: unknown[]) => mockGetAllUsers(...args),
  getUserStats: (...args: unknown[]) => mockGetUserStats(...args),
  toggleUserStatus: vi.fn(),
  updateUser: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  );
}

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "admin-1",
        role: "admin",
        full_name: "Admin Sistem",
      },
    });

    mockCacheAPI.mockImplementation(async (_key: string, fn: () => Promise<any>) => {
      return fn();
    });

    mockGetAllUsers.mockResolvedValue([
      {
        id: "u-1",
        full_name: "Admin One",
        email: "admin1@example.com",
        role: "admin",
        is_active: true,
        nim: null,
        nip: null,
        nidn: null,
      },
    ]);

    mockGetUserStats.mockResolvedValue({
      total: 1,
      admin: 1,
      dosen: 0,
      mahasiswa: 0,
      laboran: 0,
      active: 1,
      inactive: 0,
    });
  });

  it("render halaman dan memuat statistik user", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /user management/i })).toBeInTheDocument();
      expect(mockGetAllUsers).toHaveBeenCalled();
      expect(mockGetUserStats).toHaveBeenCalled();
    });
  });
});
