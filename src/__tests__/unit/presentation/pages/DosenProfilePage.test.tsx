import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DosenProfilePage from "@/pages/dosen/ProfilePage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockInvalidateCache,
  mockUpdateUserProfile,
  mockUpdateDosenProfile,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockUpdateUserProfile: vi.fn(),
  mockUpdateDosenProfile: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: vi.fn().mockResolvedValue(null),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/api/profile.api", () => ({
  getDosenProfile: vi.fn(),
  updateDosenProfile: (...args: unknown[]) => mockUpdateDosenProfile(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <DosenProfilePage />
    </MemoryRouter>,
  );
}

describe("Dosen ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "dosen-user-1", role: "dosen" },
    });

    mockCacheAPI.mockResolvedValue({
      id: "dosen-profile-1",
      user_id: "dosen-user-1",
      nidn: "123456",
      nama_dosen: "Dr. Dosen",
      program_studi: "Informatika",
      nip: "19800101",
      gelar_depan: "Dr.",
      gelar_belakang: "M.Kom.",
      fakultas: "FTI",
      users: {
        full_name: "Dr. Dosen",
        email: "dosen@example.com",
      },
    });

    mockUpdateUserProfile.mockResolvedValue(undefined);
    mockUpdateDosenProfile.mockResolvedValue(undefined);
    mockInvalidateCache.mockResolvedValue(undefined);
  });

  it("render data profil dosen", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Profil Saya/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Dr. Dosen")).toBeInTheDocument();
    expect(screen.getByDisplayValue("dosen@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123456")).toBeInTheDocument();
  });

  it("menyimpan perubahan profil", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Dr. Dosen")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), {
      target: { value: "Dr. Dosen Update" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/i }));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith("dosen-user-1", {
        full_name: "Dr. Dosen Update",
        email: "dosen@example.com",
      });
      expect(mockUpdateDosenProfile).toHaveBeenCalled();
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        "dosen_profile_dosen-user-1",
      );
    });

    expect(screen.getByText(/Profil berhasil diperbarui/i)).toBeInTheDocument();
  });

  it("menampilkan error saat gagal load", async () => {
    mockCacheAPI.mockRejectedValue(new Error("gagal load profil"));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/gagal load profil/i)).toBeInTheDocument();
    });
  });
});
