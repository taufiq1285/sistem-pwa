import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LaboranProfilePage from "@/pages/laboran/ProfilePage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockInvalidateCache,
  mockUpdateUserProfile,
  mockUpdateLaboranProfile,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockUpdateUserProfile: vi.fn(),
  mockUpdateLaboranProfile: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/api/profile.api", () => ({
  getLaboranProfile: vi.fn(),
  updateLaboranProfile: (...args: unknown[]) =>
    mockUpdateLaboranProfile(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <LaboranProfilePage />
    </MemoryRouter>,
  );
}

describe("Laboran ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "laboran-user-1", role: "laboran" },
    });

    mockCacheAPI.mockResolvedValue({
      id: "laboran-profile-1",
      user_id: "laboran-user-1",
      nip: "19881234",
      nama_laboran: "Sari Laboran",
      shift: "Pagi",
      users: {
        full_name: "Sari Laboran",
        email: "laboran@example.com",
      },
    });

    mockUpdateUserProfile.mockResolvedValue(undefined);
    mockUpdateLaboranProfile.mockResolvedValue(undefined);
    mockInvalidateCache.mockResolvedValue(undefined);
  });

  it("render data profil laboran", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Profil Saya/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Sari Laboran")).toBeInTheDocument();
    expect(screen.getByDisplayValue("laboran@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("19881234")).toBeInTheDocument();
  });

  it("menyimpan perubahan profil laboran", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Sari Laboran")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Shift Kerja/i), {
      target: { value: "Malam" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/i }));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith("laboran-user-1", {
        full_name: "Sari Laboran",
        email: "laboran@example.com",
      });
      expect(mockUpdateLaboranProfile).toHaveBeenCalledWith(
        "laboran-profile-1",
        {
          shift: "Malam",
        },
      );
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        "laboran_profile_laboran-user-1",
      );
    });

    expect(screen.getByText(/Profil berhasil diperbarui/i)).toBeInTheDocument();
  });

  it("menampilkan error saat gagal load", async () => {
    mockCacheAPI.mockRejectedValue(new Error("gagal load profil laboran"));

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText(/gagal load profil laboran/i),
      ).toBeInTheDocument();
    });
  });
});
