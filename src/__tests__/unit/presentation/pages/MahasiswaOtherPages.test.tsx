/**
 * Mahasiswa Pages Tests — MateriPage, NilaiPage, JadwalPage, PresensiPage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { mockUseAuth, mockCacheAPI, mockToast } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...a: unknown[]) => mockCacheAPI(...a),
  invalidateCache: vi.fn(),
}));
vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: { isOnline: vi.fn(() => true) },
}));
vi.mock("sonner", () => ({ toast: mockToast }));
vi.mock("@/lib/api/materi.api", () => ({
  getMateri: vi.fn(),
  downloadMateri: vi.fn(),
}));
vi.mock("@/lib/api/mahasiswa.api", () => ({
  getMyKelas: vi.fn(),
  getMyJadwal: vi.fn(),
}));
vi.mock("@/lib/api/kehadiran.api", () => ({
  getMahasiswaKehadiran: vi.fn(),
}));
vi.mock("@/lib/api/nilai.api", () => ({
  getMahasiswaNilai: vi.fn(),
  getMahasiswaNilaiByMahasiswaId: vi.fn(),
  getNilaiByMahasiswa: vi.fn(),
  getNilaiCumulative: vi.fn(),
  requestRevisi: vi.fn(),
}));
vi.mock("@/lib/api/permintaan-perbaikan.api", () => ({
  getPermintaanByMahasiswa: vi.fn(),
  createPermintaan: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));
vi.mock("@/components/features/materi/MateriCard", () => ({
  MateriList: ({ materiList }: any) => (
    <div data-testid="materi-list">
      {materiList?.map((m: any) => (
        <div key={m.id}>{m.judul}</div>
      ))}
    </div>
  ),
}));
vi.mock("@/components/features/materi/MateriViewer", () => ({
  MateriViewer: () => null,
}));

import * as nilaiApi from "@/lib/api/nilai.api";
import * as permintaanApi from "@/lib/api/permintaan-perbaikan.api";
import * as mahasiswaApi from "@/lib/api/mahasiswa.api";
import * as kehadiranApi from "@/lib/api/kehadiran.api";

const mockUser = {
  id: "u1",
  full_name: "Budi",
  role: "mahasiswa",
  mahasiswa: { id: "mhs-1", nim: "001", kelas_id: "k1" },
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ─── MateriPage ──────────────────────────────────────────────────────────────
import MahasiswaMateriPage from "@/pages/mahasiswa/MateriPage";

describe("Mahasiswa MateriPage", () => {
  const mockMateri = [
    {
      id: "m1",
      judul: "Materi Anatomi 1",
      tipe_file: "application/pdf",
      file_url: "https://x.com/a.pdf",
      minggu_ke: 1,
      kelas_id: "k1",
      dosen_id: "d1",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockCacheAPI.mockImplementation((key: string) => {
      if (key.includes("materi")) return Promise.resolve(mockMateri);
      if (key.includes("kelas")) return Promise.resolve([{ kelas_id: "k1" }]);
      return Promise.resolve([]);
    });
  });

  it("menampilkan loading skeleton", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(<MahasiswaMateriPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul halaman Materi", async () => {
    wrap(<MahasiswaMateriPage />);
    await waitFor(() =>
      expect(screen.getAllByText(/Materi/i).length).toBeGreaterThan(0),
    );
  });

  it("menampilkan input pencarian", async () => {
    wrap(<MahasiswaMateriPage />);
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Cari materi/i)).toBeInTheDocument(),
    );
  });

  it("memanggil cacheAPI untuk memuat materi", async () => {
    wrap(<MahasiswaMateriPage />);
    await waitFor(() => expect(mockCacheAPI).toHaveBeenCalled());
  });

  it("tidak crash saat cacheAPI reject", async () => {
    mockCacheAPI.mockRejectedValue(new Error("Offline"));
    expect(() => wrap(<MahasiswaMateriPage />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 100));
  });
});

// ─── NilaiPage ───────────────────────────────────────────────────────────────
import NilaiPage from "@/pages/mahasiswa/NilaiPage";

describe("Mahasiswa NilaiPage", () => {
  const mockNilai = [
    {
      id: "n1",
      kelas_id: "k1",
      mahasiswa_id: "mhs-1",
      nilai_tugas: 80,
      nilai_uts: 75,
      nilai_uas: 85,
      nilai_akhir: 80,
      nilai_huruf: "B",
      kelas: {
        id: "k1",
        nama_kelas: "TI-1A",
        tahun_ajaran: "2024/2025",
        mata_kuliah: { id: "mk1", kode_mk: "ANT101", nama_mk: "Anatomi" },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockCacheAPI.mockImplementation((key: string) => {
      if (key.includes("nilai")) return Promise.resolve(mockNilai);
      if (key.includes("permintaan")) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    vi.mocked(nilaiApi.getNilaiByMahasiswa).mockResolvedValue(mockNilai as any);
    vi.mocked(permintaanApi.getPermintaanByMahasiswa).mockResolvedValue(
      [] as any,
    );
  });

  it("menampilkan loading skeleton", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(<NilaiPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul halaman Nilai", async () => {
    wrap(<NilaiPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Nilai Akademik/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan nama mata kuliah dari nilai", async () => {
    wrap(<NilaiPage />);
    await waitFor(() =>
      expect(screen.getByText("Anatomi")).toBeInTheDocument(),
    );
  });

  it("menampilkan nilai huruf B", async () => {
    wrap(<NilaiPage />);
    await waitFor(() => expect(screen.getByText("B")).toBeInTheDocument());
  });

  it("tidak crash saat user null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    expect(() => wrap(<NilaiPage />)).not.toThrow();
  });
});

// ─── JadwalPage ──────────────────────────────────────────────────────────────
import JadwalPage from "@/pages/mahasiswa/JadwalPage";

describe("Mahasiswa JadwalPage", () => {
  const mockJadwal = [
    {
      id: "j1",
      kelas_id: "k1",
      hari: "senin",
      tanggal_praktikum: "2025-01-06",
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      nama_lab: "Lab 1",
      lokasi: "Gedung A",
      nama_dosen: "Dr. Budi",
      nama_mk: "Anatomi",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
    vi.mocked(mahasiswaApi.getMyJadwal).mockResolvedValue(mockJadwal as any);
    mockCacheAPI.mockResolvedValue(mockJadwal);
  });

  it("menampilkan loading skeleton", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(<JadwalPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul halaman Jadwal Praktikum", async () => {
    wrap(<JadwalPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Jadwal Praktikum/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan informasi jumlah jadwal", async () => {
    wrap(<JadwalPage />);
    await waitFor(() =>
      expect(screen.getByText(/Total Kelas/i)).toBeInTheDocument(),
    );
  });

  it("tidak memanggil cacheAPI saat user null", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    wrap(<JadwalPage />);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockCacheAPI).not.toHaveBeenCalled();
  });
});

// ─── PresensiPage ────────────────────────────────────────────────────────────
import PresensiPage from "@/pages/mahasiswa/PresensiPage";

describe("Mahasiswa PresensiPage", () => {
  const mockRecords = [
    {
      id: "p1",
      tanggal: "2025-01-06",
      status: "hadir",
      keterangan: null,
      nama_mk: "Anatomi",
      nama_kelas: "TI-1A",
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      nama_lab: "Lab 1",
    },
    {
      id: "p2",
      tanggal: "2025-01-13",
      status: "alpha",
      keterangan: null,
      nama_mk: "Anatomi",
      nama_kelas: "TI-1A",
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      nama_lab: "Lab 1",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockCacheAPI.mockResolvedValue(mockRecords);
    vi.mocked(kehadiranApi.getMahasiswaKehadiran).mockResolvedValue(
      mockRecords as any,
    );
  });

  it("menampilkan loading skeleton", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(<PresensiPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul halaman Presensi / Kehadiran", async () => {
    wrap(<PresensiPage />);
    await waitFor(() =>
      expect(screen.getAllByText(/Presensi|Kehadiran/i).length).toBeGreaterThan(
        0,
      ),
    );
  });

  it("menampilkan status hadir dari record", async () => {
    wrap(<PresensiPage />);
    await waitFor(() =>
      expect(screen.getAllByText(/Hadir/i).length).toBeGreaterThan(0),
    );
  });

  it("menampilkan summary statistik kehadiran", async () => {
    wrap(<PresensiPage />);
    await waitFor(() => {
      const els = screen.getAllByText(/Hadir/i);
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it("menampilkan error saat tidak ada mahasiswa ID", async () => {
    mockUseAuth.mockReturnValue({ user: { ...mockUser, mahasiswa: null } });
    wrap(<PresensiPage />);
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
  });

  it("tidak memanggil cacheAPI saat user null", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    wrap(<PresensiPage />);
    await new Promise((r) => setTimeout(r, 50));
    expect(mockCacheAPI).not.toHaveBeenCalled();
  });
});
