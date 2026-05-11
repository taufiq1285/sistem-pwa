import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";
import KelasPageEnhanced from "@/pages/admin/KelasPageEnhanced";

const {
  mockGetKelas,
  mockCreateKelas,
  mockUpdateKelas,
  mockDeleteKelas,
  mockIsOnline,
} = vi.hoisted(() => ({
  mockGetKelas: vi.fn(),
  mockCreateKelas: vi.fn(),
  mockUpdateKelas: vi.fn(),
  mockDeleteKelas: vi.fn(),
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
    onConfirm: () => void;
  }) =>
    open ? (
      <button type="button" onClick={onConfirm}>
        Konfirmasi Hapus
      </button>
    ) : null,
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

vi.mock("@/lib/offline/api-cache", () => ({
  isOnline: () => mockIsOnline(),
}));

vi.mock("@/lib/api/kelas.api", () => ({
  getKelas: (...args: unknown[]) => mockGetKelas(...args),
  createKelas: (...args: unknown[]) => mockCreateKelas(...args),
  updateKelas: (...args: unknown[]) => mockUpdateKelas(...args),
  deleteKelas: (...args: unknown[]) => mockDeleteKelas(...args),
  getEnrolledStudents: vi.fn(),
}));

describe("KelasPageEnhanced", () => {
  let kelasStore: Array<{
    id: string;
    nama_kelas: string;
    semester_ajaran: number;
    tahun_ajaran: string;
    kuota: number;
    is_active: boolean;
  }>;
  let isOnline = true;

  beforeEach(() => {
    vi.clearAllMocks();
    isOnline = true;
    mockIsOnline.mockImplementation(() => isOnline);

    kelasStore = [
      {
        id: "kelas-1",
        nama_kelas: "Kelas A",
        semester_ajaran: 1,
        tahun_ajaran: "2024/2025",
        kuota: 30,
        is_active: true,
      },
    ];

    mockGetKelas.mockImplementation((filters?: { is_active?: boolean }) => {
      if (filters?.is_active === undefined) {
        return Promise.resolve([...kelasStore]);
      }

      return Promise.resolve(
        kelasStore.filter((item) => item.is_active === filters.is_active),
      );
    });

    mockCreateKelas.mockImplementation(
      async (payload: {
        nama_kelas: string;
        semester_ajaran: number;
        tahun_ajaran: string;
        kuota: number;
      }) => {
        const created = {
          id: `kelas-${kelasStore.length + 1}`,
          is_active: true,
          ...payload,
        };
        kelasStore = [...kelasStore, created];
        return created;
      },
    );

    mockUpdateKelas.mockImplementation(
      async (
        id: string,
        payload: Partial<{
          nama_kelas: string;
          semester_ajaran: number;
          tahun_ajaran: string;
          kuota: number;
        }>,
      ) => {
        kelasStore = kelasStore.map((item) =>
          item.id === id ? { ...item, ...payload } : item,
        );
        return kelasStore.find((item) => item.id === id);
      },
    );

    mockDeleteKelas.mockImplementation(async (id: string) => {
      kelasStore = kelasStore.map((item) =>
        item.id === id ? { ...item, is_active: false } : item,
      );
      return undefined;
    });
  });

  it("menangani CRUD kelas admin, refresh daftar, arsip, dan blok offline tanpa menambah case baru", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <KelasPageEnhanced />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetKelas).toHaveBeenCalledWith({ is_active: true });
      expect(
        screen.getByRole("heading", { name: /manajemen kelas/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Kelas A")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /buat kelas baru/i }));
    await user.clear(screen.getByLabelText(/nama kelas/i));
    await user.type(screen.getByLabelText(/nama kelas/i), "kelas b");
    await user.clear(screen.getByLabelText(/tahun ajaran/i));
    await user.type(screen.getByLabelText(/tahun ajaran/i), "2025/2026");
    await user.click(screen.getByRole("button", { name: /^simpan$/i }));

    await waitFor(() => {
      expect(mockCreateKelas).toHaveBeenCalledWith({
        nama_kelas: "Kelas B",
        semester_ajaran: 1,
        tahun_ajaran: "2025/2026",
        kuota: 30,
      });
      expect(toast.success).toHaveBeenCalledWith("Kelas berhasil dibuat");
      expect(screen.getByText("Kelas B")).toBeInTheDocument();
    });

    const kelasBRow = screen.getByText("Kelas B").closest("tr");
    expect(kelasBRow).not.toBeNull();
    const kelasBButtons = within(kelasBRow as HTMLElement).getAllByRole(
      "button",
    );
    await user.click(kelasBButtons[1]);

    const namaKelasInput = screen.getByLabelText(/nama kelas/i);
    await user.clear(namaKelasInput);
    await user.type(namaKelasInput, "Kelas B Update");
    await user.click(screen.getByRole("button", { name: /^simpan$/i }));

    await waitFor(() => {
      expect(mockUpdateKelas).toHaveBeenCalledWith("kelas-2", {
        nama_kelas: "Kelas B Update",
        semester_ajaran: 1,
        tahun_ajaran: "2025/2026",
        kuota: 30,
      });
      expect(toast.success).toHaveBeenCalledWith("Kelas berhasil diperbarui");
      expect(screen.getByText("Kelas B Update")).toBeInTheDocument();
    });

    isOnline = false;
    await user.click(screen.getByRole("button", { name: /buat kelas baru/i }));
    await user.clear(screen.getByLabelText(/nama kelas/i));
    await user.type(screen.getByLabelText(/nama kelas/i), "Kelas Offline");
    await user.click(screen.getByRole("button", { name: /^simpan$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Tidak dapat menyimpan kelas saat offline. Sambungkan internet terlebih dahulu.",
      );
      expect(mockCreateKelas).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: /batal/i }));
    isOnline = true;

    const updatedRow = screen.getByText("Kelas B Update").closest("tr");
    expect(updatedRow).not.toBeNull();
    const updatedButtons = within(updatedRow as HTMLElement).getAllByRole(
      "button",
    );
    await user.click(updatedButtons[2]);
    await user.click(screen.getByRole("button", { name: /konfirmasi hapus/i }));

    await waitFor(() => {
      expect(mockDeleteKelas).toHaveBeenCalledWith("kelas-2");
      expect(toast.success).toHaveBeenCalledWith("Kelas berhasil diarsipkan");
      expect(screen.queryByText("Kelas B Update")).not.toBeInTheDocument();
    });
  }, 15000);
});
