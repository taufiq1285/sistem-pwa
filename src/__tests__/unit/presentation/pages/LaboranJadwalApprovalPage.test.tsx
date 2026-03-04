import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import JadwalApprovalPage from "@/pages/laboran/JadwalApprovalPage";

const { mockGetAllJadwalForLaboran, mockGetLaboratoriumList, mockToast } =
  vi.hoisted(() => ({
    mockGetAllJadwalForLaboran: vi.fn(),
    mockGetLaboratoriumList: vi.fn(),
    mockToast: { success: vi.fn(), error: vi.fn() },
  }));

vi.mock("@/lib/api/jadwal.api", () => ({
  getAllJadwalForLaboran: (...args: unknown[]) =>
    mockGetAllJadwalForLaboran(...args),
  approveJadwal: vi.fn(),
  rejectJadwal: vi.fn(),
  cancelJadwal: vi.fn(),
  reactivateJadwal: vi.fn(),
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getLaboratoriumList: (...args: unknown[]) => mockGetLaboratoriumList(...args),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <JadwalApprovalPage />
    </MemoryRouter>,
  );
}

describe("Laboran JadwalApprovalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetLaboratoriumList.mockResolvedValue([
      { id: "lab-1", nama_lab: "Lab Anatomi" },
    ]);
  });

  it("menampilkan heading dan statistik jadwal", async () => {
    mockGetAllJadwalForLaboran.mockResolvedValue([
      {
        id: "j1",
        status: "pending",
        tanggal_praktikum: "2025-01-10",
        hari: "Senin",
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "Praktikum Dasar",
        kelas: { nama_kelas: "TI-1A", mata_kuliah: { nama_mk: "Anatomi" } },
        laboratorium: { nama_lab: "Lab Anatomi" },
        dosen_user: { user_id: { full_name: "Dr. Budi" } },
      },
      {
        id: "j2",
        status: "approved",
        tanggal_praktikum: "2025-01-12",
        hari: "Rabu",
        jam_mulai: "09:00",
        jam_selesai: "11:00",
        topik: "Praktikum Lanjut",
        kelas: { nama_kelas: "TI-1A", mata_kuliah: { nama_mk: "Anatomi" } },
        laboratorium: { nama_lab: "Lab Anatomi" },
        dosen_user: { user_id: { full_name: "Dr. Budi" } },
      },
    ]);

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Kelola Jadwal Praktikum/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Menunggu Persetujuan/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/Jadwal Aktif/i).length).toBeGreaterThan(0);
  });

  it("menampilkan data jadwal pending pada tab default", async () => {
    mockGetAllJadwalForLaboran.mockResolvedValue([
      {
        id: "j1",
        status: "pending",
        tanggal_praktikum: "2025-01-10",
        hari: "Senin",
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "Praktikum Dasar",
        kelas: { nama_kelas: "TI-1A", mata_kuliah: { nama_mk: "Anatomi" } },
        laboratorium: { nama_lab: "Lab Anatomi" },
        dosen_user: { user_id: { full_name: "Dr. Budi" } },
      },
    ]);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Praktikum Dasar")).toBeInTheDocument();
      expect(screen.getByText("Lab Anatomi")).toBeInTheDocument();
      expect(screen.getByText("Dr. Budi")).toBeInTheDocument();
    });
  });

  it("menampilkan error toast saat gagal memuat data", async () => {
    mockGetAllJadwalForLaboran.mockRejectedValue(
      new Error("gagal memuat jadwal"),
    );

    renderWithRouter();

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
