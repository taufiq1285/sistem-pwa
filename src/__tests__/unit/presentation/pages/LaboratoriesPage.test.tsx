import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LaboratoriesPage from "@/pages/admin/LaboratoriesPage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockGetLaboratoriumList,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockGetLaboratoriumList: vi.fn(),
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

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getLaboratoriumList: (...args: unknown[]) => mockGetLaboratoriumList(...args),
  updateLaboratorium: vi.fn(),
  createLaboratorium: vi.fn(),
  deleteLaboratorium: vi.fn(),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <LaboratoriesPage />
    </MemoryRouter>,
  );
}

describe("LaboratoriesPage", () => {
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

    mockGetLaboratoriumList.mockResolvedValue([
      {
        id: "lab-1",
        kode_lab: "LAB-01",
        nama_lab: "Lab Anatomi",
        lokasi: "Gedung A",
        kapasitas: 30,
        is_active: true,
      },
    ]);
  });

  it("render halaman laboratories", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /laboratories management/i }),
      ).toBeInTheDocument();
    });

    expect(mockGetLaboratoriumList).toHaveBeenCalled();
  });
});
