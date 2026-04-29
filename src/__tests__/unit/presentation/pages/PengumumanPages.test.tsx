import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MahasiswaPengumumanPage from "@/pages/mahasiswa/PengumumanPage";
import LaboranPengumumanPage from "@/pages/laboran/PengumumanPage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockGetAllAnnouncements,
  mockGetNotifications,
  mockMarkAllAsRead,
  mockMarkAsRead,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockGetAllAnnouncements: vi.fn(),
  mockGetNotifications: vi.fn(),
  mockMarkAllAsRead: vi.fn(),
  mockMarkAsRead: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  getCachedData: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/api/announcements.api", () => ({
  getAllAnnouncements: (...args: unknown[]) => mockGetAllAnnouncements(...args),
}));

vi.mock("@/lib/api/notification.api", () => ({
  getNotifications: (...args: unknown[]) => mockGetNotifications(...args),
  markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
  markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
}));

const announcements = [
  {
    id: "a1",
    judul: "Pengumuman Umum",
    konten: "Konten umum",
    target_role: [],
    prioritas: "medium",
    tipe: "info",
    created_at: "2025-01-01T00:00:00.000Z",
    tanggal_mulai: null,
    tanggal_selesai: null,
    penulis: { full_name: "Admin" },
  },
  {
    id: "a2",
    judul: "Khusus Mahasiswa",
    konten: "Konten mhs",
    target_role: ["mahasiswa"],
    prioritas: "high",
    tipe: "warning",
    created_at: "2025-01-02T00:00:00.000Z",
    tanggal_mulai: null,
    tanggal_selesai: null,
    penulis: { full_name: "Admin" },
  },
  {
    id: "a3",
    judul: "Khusus Laboran",
    konten: "Konten laboran",
    target_role: ["laboran"],
    prioritas: "low",
    tipe: "event",
    created_at: "2025-01-03T00:00:00.000Z",
    tanggal_mulai: null,
    tanggal_selesai: null,
    penulis: { full_name: "Admin" },
  },
];

function renderPage(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Pengumuman Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "u1", role: "mahasiswa" } });
    mockGetAllAnnouncements.mockResolvedValue(announcements);
    mockGetNotifications.mockResolvedValue([]);
    mockMarkAllAsRead.mockResolvedValue(undefined);
    mockMarkAsRead.mockResolvedValue(undefined);
    mockCacheAPI.mockImplementation(
      async (_key: string, fn: () => Promise<any>) => {
        return await fn();
      },
    );
  });

  it("MahasiswaPengumumanPage memfilter pengumuman untuk mahasiswa + umum", async () => {
    renderPage(<MahasiswaPengumumanPage />);

    await waitFor(() => {
      expect(screen.getByText("Khusus Mahasiswa")).toBeInTheDocument();
      expect(screen.getByText("Pengumuman Umum")).toBeInTheDocument();
    });

    expect(screen.queryByText("Khusus Laboran")).not.toBeInTheDocument();
  });

  it("LaboranPengumumanPage memfilter pengumuman untuk laboran + umum", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2", role: "laboran" } });

    renderPage(<LaboranPengumumanPage />);

    await waitFor(() => {
      expect(screen.getByText("Khusus Laboran")).toBeInTheDocument();
      expect(screen.getByText("Pengumuman Umum")).toBeInTheDocument();
    });

    expect(screen.queryByText("Khusus Mahasiswa")).not.toBeInTheDocument();
  });

  it("menampilkan error state saat cache/API gagal", async () => {
    mockCacheAPI.mockRejectedValue(new Error("boom"));
    mockGetNotifications.mockRejectedValue(new Error("boom"));

    renderPage(<MahasiswaPengumumanPage />);

    await waitFor(() => {
      expect(screen.getByText(/Gagal memuat notifikasi/i)).toBeInTheDocument();
    });
  });
});
