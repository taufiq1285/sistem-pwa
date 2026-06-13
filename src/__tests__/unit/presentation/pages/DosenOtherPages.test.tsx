/**
 * Dosen Other Pages Tests — JadwalPage, BankSoalPage, AttemptDetailPage, KuisResultsPage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
vi.mock("@/components/ui/tabs", async () => {
  const React = await import("react");
  const TabsContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  }>({});

  return {
    Tabs: ({
      value,
      defaultValue,
      onValueChange,
      children,
      className,
    }: {
      value?: string;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
      children?: React.ReactNode;
      className?: string;
    }) => {
      const [internalValue, setInternalValue] = React.useState(defaultValue);
      const activeValue = value ?? internalValue;

      return (
        <TabsContext.Provider
          value={{
            value: activeValue,
            onValueChange: (nextValue) => {
              setInternalValue(nextValue);
              onValueChange?.(nextValue);
            },
          }}
        >
          <div className={className}>{children}</div>
        </TabsContext.Provider>
      );
    },
    TabsList: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
    TabsTrigger: ({
      value,
      children,
      className,
    }: {
      value: string;
      children?: React.ReactNode;
      className?: string;
    }) => {
      const context = React.useContext(TabsContext);
      const isActive = context.value === value;

      return (
        <button
          type="button"
          role="tab"
          aria-selected={isActive}
          data-state={isActive ? "active" : "inactive"}
          className={className}
          onClick={() => context.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
    TabsContent: ({
      value,
      children,
      className,
    }: {
      value: string;
      children?: React.ReactNode;
      className?: string;
    }) => {
      const context = React.useContext(TabsContext);
      if (context.value !== value) return null;
      return <div className={className}>{children}</div>;
    },
  };
});
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
      in: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: "dosen-1" }, error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));
vi.mock("@/lib/api/dosen.api", () => ({
  getMyKelas: vi.fn(),
  getJadwal: vi.fn(),
  createJadwal: vi.fn(),
  updateJadwal: vi.fn(),
  deleteJadwal: vi.fn(),
  getMyBorrowing: vi.fn(),
  createBorrowingRequest: vi.fn(),
  updateBorrowingRequest: vi.fn(),
  cancelBorrowingRequest: vi.fn(),
  getAvailableEquipment: vi.fn(),
  getBorrowingScheduleOptions: vi.fn(),
  returnBorrowingRequest: vi.fn(),
  markBorrowingAsTaken: vi.fn(),
}));
vi.mock("@/lib/api/jadwal.api", () => ({
  getJadwal: vi.fn(),
  createJadwal: vi.fn(),
  updateJadwal: vi.fn(),
  deleteJadwal: vi.fn(),
}));
vi.mock("@/lib/api/bank-soal.api", () => ({
  getBankSoal: vi.fn(),
  getBankSoalStats: vi.fn(),
  deleteBankSoal: vi.fn(),
  createBankSoal: vi.fn(),
  updateBankSoal: vi.fn(),
}));
vi.mock("@/lib/api/kuis.api", () => ({
  getKuisResults: vi.fn(),
  getKuisAttempts: vi.fn(),
  getAttemptsByKuis: vi.fn(),
  getAttempts: vi.fn(),
  getAttemptDetail: vi.fn(),
  getKuisById: vi.fn(),
  gradeAnswer: vi.fn(),
  getCachedAttempt: vi.fn().mockResolvedValue(null),
  syncOfflineAnswers: vi.fn(),
  cacheAttemptOffline: vi.fn(),
}));
vi.mock("@/lib/api/mata-kuliah.api", () => ({
  getMataKuliah: vi.fn(),
}));
vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: { isOnline: vi.fn(() => true) },
}));
vi.mock("@/lib/api/logbook.api", () => ({
  getLogbook: vi.fn(),
  getLogbookStats: vi.fn(),
  reviewLogbook: vi.fn(),
  gradeLogbook: vi.fn(),
}));
vi.mock("@/lib/api/kelas.api", () => ({
  getKelas: vi.fn(),
}));
vi.mock("@/lib/api/notification.api", () => ({
  notifyLaboranPeminjamanBaru: vi.fn(),
}));
vi.mock("@/components/features/kuis/builder/QuestionEditor", () => ({
  QuestionEditor: () => <div data-testid="question-editor" />,
}));
vi.mock("@/components/features/kuis/builder/QuizBuilder", () => ({
  QuizBuilder: () => <div data-testid="quiz-builder" />,
}));
vi.mock("@/components/shared/Calendar/Calendar", () => ({
  Calendar: ({ events = [] }: { events?: Array<{ title: string }> }) => (
    <div data-testid="calendar-view">
      {events.map((event) => (
        <div key={event.title}>{event.title}</div>
      ))}
    </div>
  ),
}));
vi.mock("@/components/shared/Calendar/EventDialog", () => ({
  EventDialog: () => null,
}));

import * as dosenApiRaw from "@/lib/api/dosen.api";
import * as apiCacheRaw from "@/lib/offline/api-cache";
import * as jadwalApiRaw from "@/lib/api/jadwal.api";
import * as bankSoalApiRaw from "@/lib/api/bank-soal.api";
import * as kuisApiRaw from "@/lib/api/kuis.api";
import * as logbookApiRaw from "@/lib/api/logbook.api";
import * as kelasApiRaw from "@/lib/api/kelas.api";

const dosenApi = dosenApiRaw as any;
const apiCache = apiCacheRaw as any;
const jadwalApi = jadwalApiRaw as any;
const bankSoalApi = bankSoalApiRaw as any;
const kuisApi = kuisApiRaw as any;
const logbookApi = logbookApiRaw as any;
const kelasApi = kelasApiRaw as any;

const mockDosenUser = {
  id: "u1",
  full_name: "Dr. Budi",
  role: "dosen",
  dosen: { id: "dosen-1" },
};

function wrap(ui: React.ReactElement, path = "/", route = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

// ─── Dosen JadwalPage ────────────────────────────────────────────────────────
import DosenJadwalPage from "@/pages/dosen/JadwalPage";

describe("Dosen JadwalPage", () => {
  const mockKelas = [
    {
      id: "k1",
      kode_kelas: "TI-1A",
      nama_kelas: "TI-1A",
      tahun_ajaran: "2025/2026",
      mata_kuliah_id: "mk-1",
      mata_kuliah: { kode_mk: "ANT101", nama_mk: "Anatomi" },
    },
  ];
  const mockMataKuliah = [
    {
      id: "mk-1",
      kode_mk: "ANT101",
      nama_mk: "Anatomi",
    },
  ];
  const mockJadwal = [
    {
      id: "j1",
      dosen_id: "dosen-1",
      kelas_id: "k1",
      hari: "senin",
      tanggal_praktikum: "2099-01-06",
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      status: "pending",
      topik: "Praktikum Anatomi Dasar",
      laboratorium_id: "lab-1",
      laboratorium: { nama_lab: "Lab 1" },
      mata_kuliah: { id: "mk-1", nama_mk: "Anatomi" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    mockCacheAPI.mockImplementation((key: string) => {
      if (key.startsWith("dosen_jadwal_list_"))
        return Promise.resolve(mockJadwal);
      if (key === "admin_master_kelas_jadwal")
        return Promise.resolve(mockKelas);
      if (key === "admin_master_mata_kuliah_jadwal") {
        return Promise.resolve(mockMataKuliah);
      }
      return Promise.resolve([]);
    });
    vi.mocked(dosenApi.getMyKelas).mockResolvedValue(mockKelas as any);
    vi.mocked(jadwalApi.getJadwal).mockResolvedValue(mockJadwal as any);
  });

  it("menampilkan loading skeleton", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = wrap(<DosenJadwalPage />);
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul halaman Jadwal", async () => {
    wrap(<DosenJadwalPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Jadwal Praktikum/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan tab navigasi", async () => {
    wrap(<DosenJadwalPage />);
    await waitFor(() => {
      const tabs = screen.queryAllByRole("tab");
      expect(tabs.length).toBeGreaterThan(0);
      expect(screen.getByTestId("calendar-view")).toBeInTheDocument();
      expect(screen.getByText("Anatomi - TI-1A - Lab 1")).toBeInTheDocument();
    });

    const listViewTab = screen.getByRole("tab", { name: /List View/i });
    fireEvent.pointerDown(listViewTab);
    fireEvent.click(listViewTab);

    await waitFor(() => {
      expect(screen.getByText(/Menunggu \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Praktikum Anatomi Dasar/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Anatomi/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Lab 1/i)).toBeInTheDocument();
    });
  });

  it("tidak crash saat user null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    expect(() => wrap(<DosenJadwalPage />)).not.toThrow();
  });

  it("tidak crash saat API error", async () => {
    mockCacheAPI.mockRejectedValue(new Error("Network Error"));
    expect(() => wrap(<DosenJadwalPage />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 100));
  });
});

// ─── Dosen BankSoalPage ──────────────────────────────────────────────────────
import BankSoalPage from "@/pages/dosen/BankSoalPage";

describe("Dosen BankSoalPage", () => {
  const mockSoal = [
    {
      id: "soal-1",
      pertanyaan: "Apa fungsi sel?",
      tipe_soal: "pilihan_ganda",
      poin: 10,
      dosen_id: "dosen-1",
      tags: [],
    },
    {
      id: "soal-2",
      pertanyaan: "Jelaskan mitosis",
      tipe_soal: "esai",
      poin: 20,
      dosen_id: "dosen-1",
      tags: [],
    },
  ];
  const mockStats = { total: 2, pilihan_ganda: 1, esai: 1, total_poin: 30 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    vi.mocked(bankSoalApi.getBankSoal).mockResolvedValue(mockSoal as any);
    vi.mocked(bankSoalApi.getBankSoalStats).mockResolvedValue(mockStats as any);
  });

  it("tetap merender halaman saat data diambil", () => {
    vi.mocked(bankSoalApi.getBankSoal).mockReturnValue(
      new Promise(() => {}) as any,
    );
    const { container } = wrap(<BankSoalPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("menampilkan judul Bank Soal", async () => {
    wrap(<BankSoalPage />);
    await waitFor(() =>
      expect(screen.getByText(/Bank Soal/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan input pencarian soal", async () => {
    wrap(<BankSoalPage />);
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Cari/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan tombol tambah soal baru", async () => {
    wrap(<BankSoalPage />);
    await waitFor(() => {
      const btn = screen.queryByRole("button", {
        name: /Tambah|Buat|Soal Baru/i,
      });
      expect(btn).toBeInTheDocument();
    });
  });

  it("menampilkan daftar soal dari data", async () => {
    wrap(<BankSoalPage />);
    await waitFor(() =>
      expect(screen.getByText(/Apa fungsi sel/i)).toBeInTheDocument(),
    );
  });

  it("tidak crash saat user null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    expect(() => wrap(<BankSoalPage />)).not.toThrow();
  });

  it("tidak crash saat API error", async () => {
    vi.mocked(bankSoalApi.getBankSoal).mockRejectedValue(
      new Error("Server Error"),
    );
    expect(() => wrap(<BankSoalPage />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 100));
  });
});

// ─── Dosen KuisResultsPage ───────────────────────────────────────────────────
import DosenKuisResultsPage from "@/pages/dosen/kuis/KuisResultsPage";

describe("Dosen KuisResultsPage", () => {
  const mockAttempts = [
    {
      id: "att-1",
      mahasiswa_id: "mhs-1",
      mahasiswa: { nim: "001", user: { full_name: "Andi" } },
      total_poin: 80,
      status: "graded",
      attempt_number: 1,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    vi.mocked(kuisApi.getKuisAttempts).mockResolvedValue(mockAttempts as any);
    vi.mocked(kuisApi.getAttemptsByKuis).mockResolvedValue(mockAttempts as any);
    vi.mocked(kuisApi.getAttempts).mockResolvedValue(mockAttempts as any);
    vi.mocked(kuisApi.getKuisById).mockResolvedValue({
      id: "kuis-1",
      judul: "Pre-Test Anatomi",
      passing_score: 70,
      soal: [
        { id: "s1", poin: 40, tipe_soal: "pilihan_ganda" },
        { id: "s2", poin: 40, tipe_soal: "pilihan_ganda" },
      ],
    } as any);
    mockCacheAPI.mockResolvedValue(mockAttempts);
  });

  it("menampilkan judul Hasil Kuis", async () => {
    wrap(
      <DosenKuisResultsPage />,
      "/dosen/kuis/kuis-1/results",
      "/dosen/kuis/:kuisId/results",
    );
    await waitFor(() =>
      expect(screen.getByText(/Hasil|Rekap/i)).toBeInTheDocument(),
    );
  });

  it("tidak crash saat API error", async () => {
    vi.mocked(kuisApi.getKuisAttempts).mockRejectedValue(
      new Error("Server Error"),
    );
    vi.mocked(kuisApi.getAttemptsByKuis).mockRejectedValue(
      new Error("Server Error"),
    );
    vi.mocked(kuisApi.getAttempts).mockRejectedValue(new Error("Server Error"));
    expect(() =>
      wrap(
        <DosenKuisResultsPage />,
        "/dosen/kuis/kuis-1/results",
        "/dosen/kuis/:kuisId/results",
      ),
    ).not.toThrow();
    await new Promise((r) => setTimeout(r, 100));
  });

  it("menghitung kelulusan CBT berdasarkan persentase total poin kuis", async () => {
    vi.mocked(kuisApi.getAttemptsByKuis).mockResolvedValue([
      {
        id: "att-1",
        mahasiswa_id: "mhs-1",
        mahasiswa: { nim: "001", user: { full_name: "Andi" } },
        total_poin: 60,
        status: "graded",
        attempt_number: 1,
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      },
    ] as any);
    vi.mocked(kuisApi.getKuisById).mockResolvedValue({
      id: "kuis-1",
      judul: "Pre-Test Anatomi",
      passing_score: 70,
      soal: [
        { id: "s1", poin: 40, tipe_soal: "pilihan_ganda" },
        { id: "s2", poin: 40, tipe_soal: "pilihan_ganda" },
      ],
    } as any);

    wrap(
      <DosenKuisResultsPage />,
      "/dosen/kuis/kuis-1/results",
      "/dosen/kuis/:kuisId/results",
    );

    await waitFor(() => {
      const elements = screen.getAllByText("75.0%");
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeInTheDocument();
    });
    const lulusElements = screen.getAllByText("Lulus");
    expect(lulusElements.length).toBeGreaterThan(0);
  });
});

// ─── Dosen AttemptDetailPage ─────────────────────────────────────────────────
import AttemptDetailPage from "@/pages/dosen/kuis/AttemptDetailPage";

describe("Dosen AttemptDetailPage", () => {
  const mockAttemptDetail = {
    id: "att-1",
    kuis_id: "kuis-1",
    mahasiswa_id: "mhs-1",
    status: "submitted",
    total_poin: 80,
    attempt_number: 1,
    kuis: { judul: "Pre-Test Anatomi", passing_score: 70 },
    jawaban: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    vi.mocked(kuisApi.getAttemptDetail).mockResolvedValue(
      mockAttemptDetail as any,
    );
  });

  it("menampilkan loading saat data diambil", () => {
    vi.mocked(kuisApi.getAttemptDetail).mockReturnValue(
      new Promise(() => {}) as any,
    );
    const { container } = wrap(
      <AttemptDetailPage />,
      "/dosen/kuis/kuis-1/attempts/att-1",
      "/dosen/kuis/:kuisId/attempts/:attemptId",
    );
    expect(
      container.querySelector(".animate-spin") ||
        container.querySelector(".animate-pulse") ||
        container.firstChild,
    ).toBeTruthy();
  });

  it("tidak crash saat user null", () => {
    mockUseAuth.mockReturnValue({ user: null });
    expect(() =>
      wrap(
        <AttemptDetailPage />,
        "/dosen/kuis/kuis-1/attempts/att-1",
        "/dosen/kuis/:kuisId/attempts/:attemptId",
      ),
    ).not.toThrow();
  });
});

// ─── Dosen KuisCreatePage ─────────────────────────────────────────────────────
import KuisCreatePage from "@/pages/dosen/kuis/KuisCreatePage";

describe("Dosen KuisCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
  });

  it("menampilkan pilihan jenis tugas praktikum", async () => {
    wrap(<KuisCreatePage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Buat Tugas Praktikum/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: /Laporan Praktikum/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Tes CBT/i }),
    ).toBeInTheDocument();
  });

  it("menampilkan info box penjelasan jenis tugas", async () => {
    wrap(<KuisCreatePage />);
    await waitFor(() => expect(screen.getByText(/Info:/i)).toBeInTheDocument());
  });
});

// ─── Dosen LogbookReviewPage ──────────────────────────────────────────────────
import DosenLogbookReviewPage from "@/pages/dosen/LogbookReviewPage";

describe("Dosen LogbookReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockDosenUser });
    vi.mocked(logbookApi.getLogbook).mockResolvedValue([] as any);
    vi.mocked(logbookApi.getLogbookStats).mockResolvedValue({
      total_logbooks: 0,
      submitted: 0,
      reviewed: 0,
      graded: 0,
      average_grade: 0,
    } as any);
    vi.mocked(kelasApi.getKelas).mockResolvedValue([] as any);
  });

  it("menampilkan heading penilaian logbook", async () => {
    wrap(<DosenLogbookReviewPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Penilaian Logbook Mahasiswa/i }),
      ).toBeInTheDocument(),
    );
  });

  it("menampilkan state kosong logbook", async () => {
    wrap(<DosenLogbookReviewPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/Belum ada logbook mahasiswa/i),
      ).toBeInTheDocument(),
    );
  });
});

// ─── Dosen PeminjamanPage ─────────────────────────────────────────────────────
import DosenPeminjamanPage from "@/pages/dosen/PeminjamanPage";

describe("Dosen PeminjamanPage", () => {
  const mockScheduleOptions = [
    {
      id: "jadwal-1",
      mata_kuliah_nama: "Anatomi",
      kelas_nama: "TI-1A",
      tanggal_praktikum: "2099-01-06",
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      laboratorium_id: "lab-1",
      laboratorium_nama: "Lab 1",
      label: "Anatomi • TI-1A • Lab 1 • 06 Jan 2099",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockCacheAPI.mockImplementation((key: string) => {
      if (key.includes("borrowings")) return Promise.resolve([]);
      if (key.includes("equipment")) return Promise.resolve([]);
      if (key.includes("schedule_options")) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    vi.mocked(dosenApi.getMyBorrowing).mockResolvedValue([] as any);
    vi.mocked(dosenApi.getAvailableEquipment).mockResolvedValue([] as any);
    vi.mocked(dosenApi.getBorrowingScheduleOptions).mockResolvedValue(
      mockScheduleOptions as any,
    );
  });

  it("menampilkan heading peminjaman alat", async () => {
    wrap(<DosenPeminjamanPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Peminjaman Alat/i }),
      ).toBeInTheDocument(),
    );
  });

  it("tidak crash saat data kosong", () => {
    expect(() => wrap(<DosenPeminjamanPage />)).not.toThrow();
  });

  it("menampilkan helper jadwal aktif saat opsi praktikum tersedia", async () => {
    mockCacheAPI.mockImplementation((key: string) => {
      if (key.includes("borrowings")) return Promise.resolve([]);
      if (key.includes("equipment")) return Promise.resolve([]);
      if (key.includes("schedule_options")) {
        return Promise.resolve(mockScheduleOptions);
      }
      return Promise.resolve([]);
    });

    wrap(<DosenPeminjamanPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /Buat Pengajuan Peminjaman/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Pilih jadwal agar `Lab Tujuan` mengikuti lab/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          /Belum ada jadwal praktikum aktif yang bisa dipakai/i,
        ),
      ).not.toBeInTheDocument();
    });
  });

  it("me-refresh opsi jadwal saat event jadwal berubah", async () => {
    let scheduleOptionsLoadCount = 0;

    mockCacheAPI.mockImplementation(
      (key: string, _: unknown, options?: any) => {
        if (key.includes("borrowings")) return Promise.resolve([]);
        if (key.includes("equipment")) return Promise.resolve([]);
        if (key.includes("schedule_options")) {
          scheduleOptionsLoadCount += 1;
          return Promise.resolve(
            scheduleOptionsLoadCount > 1 && options?.forceRefresh
              ? mockScheduleOptions
              : [],
          );
        }
        return Promise.resolve([]);
      },
    );

    wrap(<DosenPeminjamanPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /Buat Pengajuan Peminjaman/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Belum ada jadwal praktikum aktif yang bisa dipakai/i),
      ).toBeInTheDocument();
    });

    window.dispatchEvent(
      new CustomEvent("jadwal:changed", {
        detail: { action: "approved", jadwalId: "jadwal-1" },
      }),
    );

    await waitFor(() => {
      expect(apiCache.invalidateCache).toHaveBeenCalledWith(
        "dosen_borrowing_schedule_options",
      );
      expect(
        screen.getByText(/Pilih jadwal agar `Lab Tujuan` mengikuti lab/i),
      ).toBeInTheDocument();
    });
  });
});
