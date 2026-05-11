import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import MataKuliahPage from "@/pages/admin/MataKuliahPage";

const {
  mockGetMataKuliah,
  mockCreateMataKuliah,
  mockUpdateMataKuliah,
  mockDeleteMataKuliah,
  mockCacheAPI,
  mockGetCachedData,
  mockInvalidateCachePatternSync,
  mockIsOnline,
} = vi.hoisted(() => ({
  mockGetMataKuliah: vi.fn(),
  mockCreateMataKuliah: vi.fn(),
  mockUpdateMataKuliah: vi.fn(),
  mockDeleteMataKuliah: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockGetCachedData: vi.fn(),
  mockInvalidateCachePatternSync: vi.fn(),
  mockIsOnline: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/common/DeleteConfirmDialog", () => ({
  DeleteConfirmDialog: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: (cascade?: boolean) => void;
  }) =>
    open ? (
      <button type="button" onClick={() => onConfirm(false)}>
        Konfirmasi Hapus
      </button>
    ) : null,
}));

vi.mock("@/components/shared/DataTable", () => ({
  DataTable: ({
    columns,
    data,
    emptyMessage,
  }: {
    columns: any[];
    data: any[];
    emptyMessage?: string;
  }) => (
    <div>
      <div data-testid="datatable-count">rows:{data.length}</div>
      {data.length === 0 ? <div>{emptyMessage || "empty"}</div> : null}
      {data.map((item) => (
        <div key={item.id} data-testid={`row-${item.id}`}>
          <span>{item.nama_mk}</span>
          {columns
            .filter((column) => column.id === "actions")
            .map((column) => (
              <div key={column.id}>{column.cell({ row: buildRow(item) })}</div>
            ))}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/shared/DataTable/DataTableColumnHeader", () => ({
  DataTableColumnHeader: ({ title }: { title: string }) => <span>{title}</span>,
}));

vi.mock("@/lib/api/mata-kuliah.api", () => ({
  getMataKuliah: (...args: unknown[]) => mockGetMataKuliah(...args),
  createMataKuliah: (...args: unknown[]) => mockCreateMataKuliah(...args),
  updateMataKuliah: (...args: unknown[]) => mockUpdateMataKuliah(...args),
  deleteMataKuliah: (...args: unknown[]) => mockDeleteMataKuliah(...args),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: (...args: unknown[]) => mockGetCachedData(...args),
  invalidateCachePatternSync: (...args: unknown[]) =>
    mockInvalidateCachePatternSync(...args),
  isOnline: () => mockIsOnline(),
}));

function buildRow(item: Record<string, unknown>) {
  return {
    original: item,
    getValue: (key: string) => item[key],
  };
}

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <MataKuliahPage />
    </MemoryRouter>,
  );
}

describe("MataKuliahPage", () => {
  let mataKuliahStore: Array<{
    id: string;
    kode_mk: string;
    nama_mk: string;
    sks: number;
    semester: number;
    program_studi: string;
    deskripsi?: string;
    is_active?: boolean;
  }>;
  let isOnline = true;

  beforeEach(() => {
    vi.clearAllMocks();
    isOnline = true;
    mockIsOnline.mockImplementation(() => isOnline);

    mataKuliahStore = [
      {
        id: "mk-1",
        kode_mk: "BID001",
        nama_mk: "Komunikasi Kebidanan",
        sks: 3,
        semester: 1,
        program_studi: "D3 Kebidanan",
        deskripsi: "Dasar komunikasi",
        is_active: true,
      },
    ];

    mockGetCachedData.mockResolvedValue(null);
    mockCacheAPI.mockImplementation(
      async (_key: string, fetcher: () => Promise<unknown>) => await fetcher(),
    );
    mockInvalidateCachePatternSync.mockResolvedValue(undefined);

    mockGetMataKuliah.mockImplementation(
      async (filters?: { is_active?: boolean }) => {
        if (filters?.is_active === undefined) {
          return [...mataKuliahStore];
        }

        return mataKuliahStore.filter(
          (item) => item.is_active === filters.is_active,
        );
      },
    );

    mockCreateMataKuliah.mockImplementation(
      async (payload: {
        kode_mk: string;
        nama_mk: string;
        sks: number;
        semester: number;
        program_studi: string;
        deskripsi?: string;
      }) => {
        const created = {
          id: `mk-${mataKuliahStore.length + 1}`,
          is_active: true,
          ...payload,
        };
        mataKuliahStore = [...mataKuliahStore, created];
        return created;
      },
    );

    mockUpdateMataKuliah.mockImplementation(
      async (
        id: string,
        payload: Partial<{
          kode_mk: string;
          nama_mk: string;
          sks: number;
          semester: number;
          program_studi: string;
          deskripsi?: string;
        }>,
      ) => {
        mataKuliahStore = mataKuliahStore.map((item) =>
          item.id === id ? { ...item, ...payload } : item,
        );
        return mataKuliahStore.find((item) => item.id === id);
      },
    );

    mockDeleteMataKuliah.mockImplementation(
      async (id: string, _options?: { cascade?: boolean }) => {
        mataKuliahStore = mataKuliahStore.filter((item) => item.id !== id);
        return true;
      },
    );
  });

  it("menangani CRUD mata kuliah admin, refresh daftar, dan blok offline tanpa menambah case baru", async () => {
    const user = userEvent.setup();

    renderWithRouter();

    await waitFor(() => {
      expect(mockGetMataKuliah).toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: /mata kuliah/i }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("datatable-count")).toHaveTextContent("rows:1");
      expect(screen.getByText("Komunikasi Kebidanan")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /tambah mata kuliah/i }),
    );
    await user.type(screen.getByPlaceholderText("MK001"), "bid002");
    await user.type(
      screen.getByPlaceholderText("Contoh: Komunikasi Bisnis Digital"),
      "Anatomi",
    );
    await user.clear(screen.getByDisplayValue("D3 Kebidanan"));
    await user.type(
      screen.getByPlaceholderText("D3 Kebidanan"),
      "D4 Kebidanan",
    );
    await user.type(
      screen.getByPlaceholderText("Deskripsi mata kuliah (opsional)"),
      "Mata kuliah baru",
    );
    await user.click(screen.getByRole("button", { name: /^tambah$/i }));

    await waitFor(() => {
      expect(mockCreateMataKuliah).toHaveBeenCalledWith({
        kode_mk: "BID002",
        nama_mk: "Anatomi",
        sks: 3,
        semester: 1,
        program_studi: "D4 Kebidanan",
        deskripsi: "Mata kuliah baru",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Mata kuliah berhasil ditambahkan",
      );
      expect(screen.getByText("Anatomi")).toBeInTheDocument();
      expect(mockInvalidateCachePatternSync).toHaveBeenCalled();
    });

    const mkRow = screen.getByTestId("row-mk-1");
    const mkButtons = within(mkRow).getAllByRole("button");
    await user.click(mkButtons[0]);
    await user.clear(
      screen.getByPlaceholderText("Contoh: Komunikasi Bisnis Digital"),
    );
    await user.type(
      screen.getByPlaceholderText("Contoh: Komunikasi Bisnis Digital"),
      "Komunikasi Kebidanan Update",
    );
    await user.click(screen.getByRole("button", { name: /^simpan$/i }));

    await waitFor(() => {
      expect(mockUpdateMataKuliah).toHaveBeenCalledWith("mk-1", {
        kode_mk: "BID001",
        nama_mk: "Komunikasi Kebidanan Update",
        sks: 3,
        semester: 1,
        program_studi: "D3 Kebidanan",
        deskripsi: "Dasar komunikasi",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Mata kuliah berhasil diperbarui",
      );
      expect(
        screen.getByText("Komunikasi Kebidanan Update"),
      ).toBeInTheDocument();
    });

    isOnline = false;
    await user.click(
      screen.getByRole("button", { name: /tambah mata kuliah/i }),
    );
    await user.type(screen.getByPlaceholderText("MK001"), "bid003");
    await user.type(
      screen.getByPlaceholderText("Contoh: Komunikasi Bisnis Digital"),
      "Offline MK",
    );

    const offlineSubmitButton = screen.getByRole("button", {
      name: /^tambah$/i,
    });
    expect(offlineSubmitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockCreateMataKuliah).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: /batal/i }));
    isOnline = true;

    const updatedRow = screen.getByTestId("row-mk-1");
    const updatedButtons = within(updatedRow).getAllByRole("button");
    await user.click(updatedButtons[1]);
    await user.click(screen.getByRole("button", { name: /konfirmasi hapus/i }));

    await waitFor(() => {
      expect(mockDeleteMataKuliah).toHaveBeenCalledWith("mk-1", {
        cascade: false,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Mata kuliah berhasil diarsipkan atau dihapus",
      );
      expect(
        screen.queryByText("Komunikasi Kebidanan Update"),
      ).not.toBeInTheDocument();
    });
  }, 15000);
});
