import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventarisPage from "@/pages/laboran/InventarisPage";

const {
  mockCacheAPI,
  mockCreateInventaris,
  mockGetInventarisCategories,
  mockInvalidateCache,
  mockToast,
} = vi.hoisted(() => ({
  mockCacheAPI: vi.fn(),
  mockCreateInventaris: vi.fn(),
  mockGetInventarisCategories: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: vi.fn().mockResolvedValue(null),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getInventarisList: vi.fn(),
  createInventaris: (...args: unknown[]) => mockCreateInventaris(...args),
  updateInventaris: vi.fn(),
  deleteInventaris: vi.fn(),
  updateStock: vi.fn(),
  getInventarisCategories: (...args: unknown[]) =>
    mockGetInventarisCategories(...args),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("Laboran InventarisPage", () => {
  let inventarisStore: Array<Record<string, unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();

    inventarisStore = [
      {
        id: "inv-1",
        kode_barang: "MKR-001",
        nama_barang: "Mikroskop",
        kategori: "Alat Lab",
        merk: "Olympus",
        jumlah: 10,
        jumlah_tersedia: 8,
        kondisi: "baik",
        laboratorium: { id: "lab-1", nama_lab: "Lab Anatomi" },
      },
    ];

    mockCacheAPI.mockImplementation(
      async (key: string, fn: () => Promise<unknown>) => {
        if (key.startsWith("inventaris_list_")) {
          return {
            data: inventarisStore,
            count: inventarisStore.length,
          };
        }

        if (key === "inventaris_categories") {
          return ["Alat Lab", "Umum"];
        }

        return await fn();
      },
    );

    mockGetInventarisCategories.mockResolvedValue(["Alat Lab", "Umum"]);
    mockInvalidateCache.mockResolvedValue(undefined);
    mockCreateInventaris.mockImplementation(async (payload: any) => {
      inventarisStore = [
        ...inventarisStore,
        {
          id: "inv-2",
          ...payload,
          laboratorium: { id: "lab-1", nama_lab: "Lab Anatomi" },
        },
      ];
      return "inv-2";
    });
  });

  it("menampilkan judul halaman inventaris", async () => {
    render(<InventarisPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Data Inventaris Laboratorium/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Data inventaris aktif/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Kelola peralatan laboratorium, stok tersedia, kategori, dan kondisi inventaris/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("menambahkan inventaris baru lalu memuat ulang daftar laboran", async () => {
    const user = userEvent.setup();

    render(<InventarisPage />);

    await waitFor(() => {
      expect(screen.getByText("Mikroskop")).toBeInTheDocument();
      expect(screen.getByText("MKR-001")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /tambah inventaris/i }),
    );

    await user.type(screen.getByLabelText(/kode barang/i), "INF-002");
    await user.type(screen.getByLabelText(/nama barang/i), "Infus Pump");
    await user.type(screen.getByLabelText(/merk/i), "B. Braun");
    await user.clear(screen.getByLabelText(/jumlah total/i));
    await user.type(screen.getByLabelText(/jumlah total/i), "4");
    await user.clear(screen.getByLabelText(/jumlah tersedia/i));
    await user.type(screen.getByLabelText(/jumlah tersedia/i), "4");

    await user.click(screen.getByRole("button", { name: /tambah barang/i }));

    await waitFor(() => {
      expect(mockCreateInventaris).toHaveBeenCalledWith(
        expect.objectContaining({
          kode_barang: "INF-002",
          nama_barang: "Infus Pump",
          merk: "B. Braun",
          jumlah: 4,
          jumlah_tersedia: 4,
          kondisi: "baik",
        }),
      );
      expect(mockInvalidateCache).toHaveBeenCalledWith("inventaris_list_");
      expect(screen.getByText("Infus Pump")).toBeInTheDocument();
      expect(screen.getByText("INF-002")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /tambah barang/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("menampilkan loading state saat data belum selesai dimuat", () => {
    mockCacheAPI.mockReset();
    mockCacheAPI.mockReturnValue(new Promise(() => {}));

    const { container } = render(<InventarisPage />);

    expect(
      container.querySelectorAll('[data-slot="card"]').length,
    ).toBeGreaterThan(0);
  });
});
