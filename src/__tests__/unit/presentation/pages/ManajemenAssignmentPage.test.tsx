import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ManajemenAssignmentPage from "@/pages/admin/ManajemenAssignmentPage";

const { mockUseAuth, mockSupabaseFrom } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
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

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ManajemenAssignmentPage />
    </MemoryRouter>,
  );
}

describe("ManajemenAssignmentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "admin-1",
        role: "admin",
        full_name: "Admin Sistem",
      },
    });

    mockSupabaseFrom.mockImplementation(() => {
      const builder: any = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        or() {
          return builder;
        },
        order() {
          return Promise.resolve({ data: [], error: null });
        },
        insert() {
          return Promise.resolve({ error: null });
        },
        delete() {
          return builder;
        },
        single() {
          return Promise.resolve({ data: null, error: null });
        },
        then(resolve: any) {
          resolve({ data: [], error: null });
        },
      };
      return builder;
    });
  });

  it("render halaman tanpa crash", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /manajemen assignment/i }),
      ).toBeInTheDocument();
    });

    expect(mockSupabaseFrom).toHaveBeenCalled();
  });
});
