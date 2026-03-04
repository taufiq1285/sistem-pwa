import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MataKuliahPage from "@/pages/admin/MataKuliahPage";

const { mockGetMataKuliah } = vi.hoisted(() => ({
  mockGetMataKuliah: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/common/DeleteConfirmDialog", () => ({
  DeleteConfirmDialog: () => null,
}));

vi.mock("@/components/shared/DataTable", () => ({
  DataTable: ({
    data,
    emptyMessage,
  }: {
    data: any[];
    emptyMessage?: string;
  }) => (
    <div>
      <div data-testid="datatable-count">rows:{data.length}</div>
      {data.length === 0 ? <div>{emptyMessage || "empty"}</div> : null}
    </div>
  ),
}));

vi.mock("@/components/shared/DataTable/DataTableColumnHeader", () => ({
  DataTableColumnHeader: ({ title }: { title: string }) => <span>{title}</span>,
}));

vi.mock("@/lib/api/mata-kuliah.api", () => ({
  getMataKuliah: (...args: unknown[]) => mockGetMataKuliah(...args),
  createMataKuliah: vi.fn(),
  updateMataKuliah: vi.fn(),
  deleteMataKuliah: vi.fn(),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <MataKuliahPage />
    </MemoryRouter>,
  );
}

describe("MataKuliahPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetMataKuliah.mockResolvedValue([
      {
        id: "mk-1",
        kode_mk: "BID001",
        nama_mk: "Komunikasi Kebidanan",
        sks: 3,
        semester: 1,
        program_studi: "D3 Kebidanan",
        deskripsi: "Dasar komunikasi",
      },
    ]);
  });

  it("render halaman dan memuat data awal", async () => {
    renderWithRouter();

    expect(
      screen.getByRole("heading", { name: /mata kuliah/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetMataKuliah).toHaveBeenCalled();
      expect(screen.getByTestId("datatable-count")).toHaveTextContent("rows:1");
    });
  });
});
