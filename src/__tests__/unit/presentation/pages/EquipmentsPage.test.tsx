import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EquipmentsPage from "@/pages/admin/EquipmentsPage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockGetInventarisList,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockGetInventarisList: vi.fn(),
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
  getInventarisList: (...args: unknown[]) => mockGetInventarisList(...args),
  createInventaris: vi.fn(),
  updateInventaris: vi.fn(),
  deleteInventaris: vi.fn(),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <EquipmentsPage />
    </MemoryRouter>,
  );
}

describe("EquipmentsPage", () => {
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

    mockGetInventarisList.mockResolvedValue({
      data: [
        {
          id: "inv-1",
          kode_barang: "EQ-001",
          nama_barang: "Mikroskop",
          kategori: "Alat",
          merk: "Olympus",
          jumlah: 10,
          jumlah_tersedia: 9,
          kondisi: "baik",
          tahun_pengadaan: 2024,
          keterangan: "-",
        },
      ],
    });
  });

  it("render halaman equipment", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /equipment management/i })).toBeInTheDocument();
    });

    expect(mockGetInventarisList).toHaveBeenCalled();
  });
});
