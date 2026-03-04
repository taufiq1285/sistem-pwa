import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import InventarisPage from "@/pages/laboran/InventarisPage";

const { mockCacheAPI, mockGetInventarisCategories, mockToast } = vi.hoisted(
  () => ({
    mockCacheAPI: vi.fn(),
    mockGetInventarisCategories: vi.fn(),
    mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  }),
);

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getInventarisList: vi.fn(),
  createInventaris: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();

    mockCacheAPI.mockImplementation(
      async (_key: string, fn: () => Promise<unknown>) => await fn(),
    );

    mockCacheAPI
      .mockResolvedValueOnce({
        data: [
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
        ],
        count: 1,
      })
      .mockResolvedValueOnce(["Alat Lab", "Umum"]);

    mockGetInventarisCategories.mockResolvedValue(["Alat Lab", "Umum"]);
  });

  it("menampilkan judul halaman inventaris", async () => {
    render(<InventarisPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Inventaris Lab/i }),
      ).toBeInTheDocument();
    });
  });

  it("menampilkan data inventaris dari API", async () => {
    render(<InventarisPage />);

    await waitFor(() => {
      expect(screen.getByText("Mikroskop")).toBeInTheDocument();
      expect(screen.getByText("MKR-001")).toBeInTheDocument();
    });
  });

  it("menampilkan loading state saat data belum selesai dimuat", () => {
    mockCacheAPI.mockReset();
    mockCacheAPI.mockReturnValue(new Promise(() => {}));

    render(<InventarisPage />);

    expect(screen.getByText(/Loading\.\.\./i)).toBeInTheDocument();
  });
});
