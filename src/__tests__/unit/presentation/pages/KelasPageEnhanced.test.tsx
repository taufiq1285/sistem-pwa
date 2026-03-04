import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import KelasPageEnhanced from "@/pages/admin/KelasPageEnhanced";

const { mockGetKelas } = vi.hoisted(() => ({
  mockGetKelas: vi.fn(),
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

vi.mock("@/components/features/kelas/KelolaMahasiswaDialog", () => ({
  KelolaMahasiswaDialog: () => null,
}));

vi.mock("@/lib/api/kelas.api", () => ({
  getKelas: (...args: unknown[]) => mockGetKelas(...args),
  createKelas: vi.fn(),
  updateKelas: vi.fn(),
  deleteKelas: vi.fn(),
  getEnrolledStudents: vi.fn(),
}));

describe("KelasPageEnhanced", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetKelas.mockResolvedValue([]);
  });

  it("render halaman manajemen kelas", async () => {
    render(
      <MemoryRouter>
        <KelasPageEnhanced />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetKelas).toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: /manajemen kelas/i }),
      ).toBeInTheDocument();
    });
  });
});
