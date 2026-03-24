import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MahasiswaProfilePage from "@/pages/mahasiswa/ProfilePage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockInvalidateCache,
  mockUpdateUserProfile,
  mockUpdateMahasiswaProfile,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockUpdateUserProfile: vi.fn(),
  mockUpdateMahasiswaProfile: vi.fn(),
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
  getMahasiswaProfile: vi.fn(),
  updateMahasiswaProfile: (...args: unknown[]) =>
    mockUpdateMahasiswaProfile(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <MahasiswaProfilePage />
    </MemoryRouter>,
  );
}

describe("Mahasiswa ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "mhs-user-1", role: "mahasiswa" },
    });

    mockCacheAPI.mockResolvedValue({
      id: "mhs-profile-1",
      nim: "2310001",
      program_studi: "Kebidanan",
      angkatan: 2023,
      semester: 4,
      gender: "P",
      date_of_birth: "2003-08-01",
      address: "Jl. Mawar No. 1",
      users: {
        full_name: "Siti Aisyah",
        email: "siti@example.com",
      },
    });

    mockUpdateUserProfile.mockResolvedValue(undefined);
    mockUpdateMahasiswaProfile.mockResolvedValue(undefined);
    mockInvalidateCache.mockResolvedValue(undefined);
  });

  it("render data profil mahasiswa", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Profil Saya/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Siti Aisyah")).toBeInTheDocument();
    expect(screen.getByDisplayValue("siti@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2310001")).toBeInTheDocument();
  });

  it("menyimpan perubahan profil", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Siti Aisyah")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), {
      target: { value: "Siti Update" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/i }));

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith("mhs-user-1", {
        full_name: "Siti Update",
        email: "siti@example.com",
        phone: "",
      });
      expect(mockUpdateMahasiswaProfile).toHaveBeenCalled();
      expect(mockInvalidateCache).toHaveBeenCalledWith(
        "mahasiswa_profile_mhs-user-1",
      );
    });

    expect(screen.getByText(/Profil berhasil diperbarui/i)).toBeInTheDocument();
  });

  it("menampilkan error saat gagal load", async () => {
    mockCacheAPI.mockRejectedValue(new Error("gagal load profil mahasiswa"));

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText(/gagal load profil mahasiswa/i),
      ).toBeInTheDocument();
    });
  });
});
