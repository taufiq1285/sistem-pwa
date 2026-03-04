import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import KelasMataKuliahPage from "@/pages/admin/KelasMataKuliahPage";

const { mockUseAuth, mockCacheAPI, mockSupabaseFrom } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <KelasMataKuliahPage />
    </MemoryRouter>,
  );
}

describe("KelasMataKuliahPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "admin-1",
        role: "admin",
        full_name: "Admin Sistem",
      },
    });

    mockCacheAPI.mockImplementation(
      async (_key: string, fn: () => Promise<any>) => {
        return fn();
      },
    );

    mockSupabaseFrom.mockImplementation((table: string) => {
      const dataMap: Record<string, any[]> = {
        kelas: [
          {
            id: "k-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            mata_kuliah_id: null,
            mata_kuliah: null,
          },
        ],
        mata_kuliah: [
          {
            id: "mk-1",
            nama_mk: "Komunikasi Kebidanan",
            kode_mk: "BID001",
            sks: 3,
            is_active: true,
          },
        ],
      };

      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        update() {
          return this;
        },
        order() {
          return Promise.resolve({ data: dataMap[table] || [], error: null });
        },
      };
    });
  });

  it("render dengan judul assignment", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /assign mata kuliah ke kelas/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/total kelas aktif/i)).toBeInTheDocument();
  });
});
