/**
 * Dosen Pages Tests — MateriPage, PenilaianPage, KehadiranPage, KuisListPage, KuisCreatePage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockUseAuth, mockCacheAPI, mockNavigate, mockToast } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(),
    mockCacheAPI: vi.fn(),
    mockNavigate: vi.fn(),
    mockToast: { success: vi.fn(), error: vi.fn() },
  }),
);

vi.mock("@/lib/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...a: unknown[]) => mockCacheAPI(...a),
  getCachedData: vi.fn().mockResolvedValue(null),
  invalidateCache: vi.fn(),
}));
vi.mock("react-router-dom", async (orig) => {
  const a = await orig<typeof import("react-router-dom")>();
  return { ...a, useNavigate: () => mockNavigate };
});
vi.mock("sonner", () => ({ toast: mockToast }));
vi.mock("@/lib/api/materi.api", () => ({
  getMateriByDosen: vi.fn(),
  createMateri: vi.fn(),
  updateMateri: vi.fn(),
  deleteMateri: vi.fn(),
  uploadMateriFile: vi.fn(),
  downloadMateri: vi.fn(),
}));
vi.mock("@/lib/api/dosen.api", () => ({
  getMyKelas: vi.fn(),
}));
vi.mock("@/lib/api/nilai.api", () => ({
  getNilaiByKelas: vi.fn(),
  updateNilai: vi.fn(),
  batchUpdateNilai: vi.fn(),
}));
vi.mock("@/lib/api/mata-kuliah.api", () => ({
  getMataKuliah: vi.fn(),
}));
vi.mock("@/lib/api/kuis.api", () => ({
  getKuis: vi.fn(),
  cacheAttemptOffline: vi.fn(),
  syncOfflineAnswers: vi.fn(),
  getCachedAttempt: vi.fn().mockResolvedValue(null),
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
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "dosen-1" }, error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));
vi.mock("@/components/features/materi/MateriCard", () => ({
  MateriList: () => <div data-testid="materi-list" />,
}));
vi.mock("@/components/features/materi/MateriViewer", () => ({
  MateriViewer: () => null,
}));
vi.mock("@/components/features/kuis/builder/QuizBuilder", () => ({
  QuizBuilder: ({ onSave }: any) => (
    <div data-testid="quiz-builder">
      <button onClick={() => onSave?.({})}>Save Quiz</button>
    </div>
  ),
}));
vi.mock("@/components/features/kuis/QuizCard", () => ({
  QuizCard: ({ quiz }: any) => <div data-testid="quiz-card">{quiz.judul}</div>,
}));
vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: {
    isOnline: vi.fn(() => true),
    getStatus: vi.fn(() => "online"),
    isReady: vi.fn(() => true),
    initialize: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

import * as materiApi from "@/lib/api/materi.api";
import * as dosenApi from "@/lib/api/dosen.api";
import * as nilaiApi from "@/lib/api/nilai.api";
import * as mkApi from "@/lib/api/mata-kuliah.api";
import * as kuisApi from "@/lib/api/kuis.api";

const mockDosenUser = {
  id: "u1",
  full_name: "Dr. Budi",
  role: "dosen",
  dosen: { id: "dosen-1" },
};

beforeEach(() => {
  mockCacheAPI.mockImplementation(
    async (_key: string, fn?: () => Promise<unknown>) => {
      if (typeof fn === "function") return await fn();
      return [];
    },
  );
});

function wrap(ui: React.ReactElement, path = "/", route = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

// ─── Dosen MateriPage ────────────────────────────────────────────────────────
import DosenMateriPage from "@/pages/dosen/MateriPage";

describe("Dosen MateriPage", () => {
  const mockMateri = [
    {
      id: "m1",
      judul: "Materi Anatomi",
      tipe_file: "application/pdf",
      file_url: "https://x.com/a.pdf",
      minggu_ke: 1,
      kelas_id: "k1",
      dosen_id: "dosen-1",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    vi.mocked(materiApi.getMateriByDosen).mockResolvedValue(mockMateri as any);
    vi.mocked(dosenApi.getMyKelas).mockResolvedValue([
      { id: "k1", nama_kelas: "TI-1A" },
    ] as any);
  });

  it("menampilkan loading skeleton", () => {
    vi.mocked(materiApi.getMateriByDosen).mockReturnValue(
      new Promise(() => {}),
    );
    const { container } = wrap(<DosenMateriPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul Manajemen Materi", async () => {
    wrap(<DosenMateriPage />);
    await waitFor(() =>
      expect(screen.getByText(/Manajemen Materi|Materi/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan tombol Upload/Tambah Materi", async () => {
    wrap(<DosenMateriPage />);
    await waitFor(() => {
      const btn = screen.queryByRole("button", { name: /Upload|Tambah/i });
      expect(btn).toBeInTheDocument();
    });
  });

  it("tidak crash saat API error", async () => {
    vi.mocked(materiApi.getMateriByDosen).mockRejectedValue(
      new Error("Server Error"),
    );
    expect(() => wrap(<DosenMateriPage />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 100));
  });
});

// ─── Dosen PenilaianPage ─────────────────────────────────────────────────────
import DosenPenilaianPage from "@/pages/dosen/PenilaianPage";

describe("Dosen PenilaianPage", () => {
  const mockKelas = [
    {
      id: "k1",
      nama_kelas: "TI-1A",
      mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi" },
    },
  ];
  const mockNilai = [
    {
      id: "n1",
      mahasiswa_id: "mhs-1",
      nama_mahasiswa: "Andi",
      nim: "001",
      nilai_tugas: 80,
      nilai_uts: 75,
      nilai_uas: 85,
      nilai_akhir: 80,
      nilai_huruf: "B",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    mockCacheAPI.mockImplementation((key: string) => {
      if (key.includes("kelas")) return Promise.resolve(mockKelas);
      if (key.includes("nilai")) return Promise.resolve(mockNilai);
      return Promise.resolve([]);
    });
    vi.mocked(nilaiApi.getNilaiByKelas).mockResolvedValue(mockNilai as any);
  });

  it("menampilkan judul halaman Penilaian", async () => {
    wrap(<DosenPenilaianPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Penilaian Mahasiswa/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan dropdown pilih kelas", async () => {
    wrap(<DosenPenilaianPage />);
    await waitFor(() => {
      const selects = document.querySelectorAll("[role='combobox']");
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  it("tidak crash saat user null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    expect(() => wrap(<DosenPenilaianPage />)).not.toThrow();
  });
});

// ─── Dosen KehadiranPage ─────────────────────────────────────────────────────
import DosenKehadiranPage from "@/pages/dosen/KehadiranPage";

describe("Dosen KehadiranPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    mockCacheAPI.mockResolvedValue([]);
    vi.mocked(dosenApi.getMyKelas).mockResolvedValue([
      { id: "k1", nama_kelas: "TI-1A", mata_kuliah_id: "mk1" },
    ] as any);
    vi.mocked(mkApi.getMataKuliah).mockResolvedValue([
      { id: "mk1", kode_mk: "ANT101", nama_mk: "Anatomi" },
    ] as any);
  });

  it("tetap merender halaman saat data masih loading", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(<DosenKehadiranPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("menampilkan judul Kelola Kehadiran", async () => {
    wrap(<DosenKehadiranPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Kehadiran Praktikum/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan instruksi pilih mata kuliah / kelas", async () => {
    wrap(<DosenKehadiranPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Pilih Mata Kuliah dan Kelas/i }),
      ).toBeInTheDocument();
    });
  });
});

// ─── Dosen KuisListPage ──────────────────────────────────────────────────────
import DosenKuisListPage from "@/pages/dosen/kuis/KuisListPage";

describe("Dosen KuisListPage", () => {
  const mockKuis = [
    {
      id: "kuis-1",
      judul: "Pre-Test Anatomi",
      status: "draft",
      tipe_kuis: "pilihan_ganda",
      kelas_id: "k1",
      dosen_id: "dosen-1",
      kelas: {
        nama_kelas: "TI-1A",
        mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi" },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    mockCacheAPI.mockResolvedValue(mockKuis);
    vi.mocked(kuisApi.getKuis).mockResolvedValue(mockKuis as any);
  });

  it("menampilkan loading skeleton", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(
      <DosenKuisListPage />,
      "/dosen/kuis",
      "/dosen/kuis",
    );
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul halaman Tugas Praktikum", async () => {
    wrap(<DosenKuisListPage />, "/dosen/kuis", "/dosen/kuis");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Daftar Tugas Praktikum/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan tombol Buat Tugas Baru", async () => {
    wrap(<DosenKuisListPage />, "/dosen/kuis", "/dosen/kuis");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Buat Tugas|Tambah/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan QuizCard dari data", async () => {
    wrap(<DosenKuisListPage />, "/dosen/kuis", "/dosen/kuis");
    await waitFor(() =>
      expect(screen.getByTestId("quiz-card")).toBeInTheDocument(),
    );
  });

  it("menampilkan input pencarian", async () => {
    wrap(<DosenKuisListPage />, "/dosen/kuis", "/dosen/kuis");
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Cari/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan pesan kosong saat tidak ada kuis", async () => {
    mockCacheAPI.mockResolvedValue([]);
    vi.mocked(kuisApi.getKuis).mockResolvedValue([] as any);
    wrap(<DosenKuisListPage />, "/dosen/kuis", "/dosen/kuis");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Tidak ada tugas praktikum/i }),
      ).toBeInTheDocument(),
    );
  });
});

// ─── Dosen KuisCreatePage ────────────────────────────────────────────────────
import DosenKuisCreatePage from "@/pages/dosen/kuis/KuisCreatePage";

describe("Dosen KuisCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
  });

  it("menampilkan pilihan tipe tugas (Tes CBT / Laporan)", async () => {
    wrap(<DosenKuisCreatePage />, "/dosen/kuis/create", "/dosen/kuis/create");
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Buat Tugas Praktikum/i }),
      ).toBeInTheDocument();
    });
  });

  it("menampilkan tombol kembali", async () => {
    wrap(<DosenKuisCreatePage />, "/dosen/kuis/create", "/dosen/kuis/create");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Kembali|Back/i }),
      ).toBeInTheDocument();
    });
  });

  it("tidak crash saat user null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    expect(() =>
      wrap(<DosenKuisCreatePage />, "/dosen/kuis/create", "/dosen/kuis/create"),
    ).not.toThrow();
  });
});
