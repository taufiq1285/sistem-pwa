import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PeminjamanApprovalPage from "@/pages/admin/PeminjamanApprovalPage";

const { mockUseAuth, mockGetPendingApprovals, mockGetApprovalHistory } =
  vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockGetPendingApprovals: vi.fn(),
    mockGetApprovalHistory: vi.fn(),
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

vi.mock("@/lib/api/laboran.api", () => ({
  getPendingApprovals: (...args: unknown[]) => mockGetPendingApprovals(...args),
  approvePeminjaman: vi.fn(),
  rejectPeminjaman: vi.fn(),
  getApprovalHistory: (...args: unknown[]) => mockGetApprovalHistory(...args),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <PeminjamanApprovalPage />
    </MemoryRouter>,
  );
}

describe("PeminjamanApprovalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "admin-1",
        role: "admin",
        full_name: "Admin Sistem",
      },
    });

    mockGetPendingApprovals.mockResolvedValue([]);
    mockGetApprovalHistory.mockResolvedValue([]);
  });

  it("render dan menampilkan heading utama", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(mockGetPendingApprovals).toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: /persetujuan peminjaman alat/i }),
      ).toBeInTheDocument();
    });
  });
});
