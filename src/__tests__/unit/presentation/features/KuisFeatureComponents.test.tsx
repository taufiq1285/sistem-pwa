/**
 * Kuis Feature Components Tests
 * QuizAttempt, QuizBuilder, QuizResult, QuestionEditor, PermintaanPerbaikanTab
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockUseAuth, mockToast, mockNavigate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  mockNavigate: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("sonner", () => ({ toast: mockToast }));
vi.mock("react-router-dom", async (orig) => {
  const a = await orig<typeof import("react-router-dom")>();
  return { ...a, useNavigate: () => mockNavigate };
});
vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: { isOnline: vi.fn(() => true) },
}));
vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true }),
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
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "" } })),
      })),
    },
  },
}));
vi.mock("@/lib/api/kuis-secure.api", () => ({
  getSoalForAttempt: vi.fn(),
  validateAttemptAccess: vi.fn(),
  startAttempt: vi.fn(),
  submitAttempt: vi.fn(),
  saveProgress: vi.fn(),
}));
vi.mock("@/lib/api/laporan-storage.api", () => ({
  createLaporanUploader: vi.fn(() => ({
    upload: vi.fn(),
    getUploadedFiles: vi.fn(() => []),
  })),
}));
vi.mock("@/lib/api/kelas.api", () => ({
  getKelas: vi.fn().mockResolvedValue([]),
  createKelas: vi.fn(),
}));
vi.mock("@/lib/api/mata-kuliah.api", () => ({
  getMataKuliah: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/api/bank-soal.api", () => ({
  saveSoalToBank: vi.fn(),
  checkDuplicateBankSoal: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/api/nilai.api", () => ({
  getNilaiByKelas: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/api/permintaan-perbaikan.api", () => ({
  getPermintaanByKelas: vi.fn().mockResolvedValue([]),
  updatePermintaan: vi.fn(),
  createPermintaan: vi.fn(),
}));
vi.mock("@/lib/utils/quiz-scoring", () => ({
  calculateQuizScore: vi.fn(() => ({
    score: 80,
    correct: 8,
    total: 10,
    percentage: 80,
  })),
  isLaporanMode: vi.fn(() => false),
  getGradeColor: vi.fn(() => "text-green-600"),
  calculateGradeLetter: vi.fn(() => "B"),
  gradeAnswer: vi.fn(() => ({ isCorrect: true, score: 10 })),
  checkAnswerCorrect: vi.fn(() => true),
  getCorrectAnswerLabel: vi.fn(() => "A"),
  getAnswerLabel: vi.fn(() => "A"),
  gradeAllAnswers: vi.fn(() => []),
  canAutoGrade: vi.fn(() => true),
  getManualGradingRequired: vi.fn(() => []),
  getQuizStats: vi.fn(() => ({ total: 0, answered: 0, correct: 0 })),
}));
vi.mock("@/lib/api/kuis.api", () => ({
  getKuis: vi.fn().mockResolvedValue([]),
  getSoalByKuis: vi.fn().mockResolvedValue([]),
  createKuis: vi.fn(),
  updateKuis: vi.fn(),
  publishKuis: vi.fn(),
  createSoal: vi.fn(),
  updateSoal: vi.fn(),
  deleteSoal: vi.fn(),
  cacheAttemptOffline: vi.fn(),
  syncOfflineAnswers: vi.fn(),
  getCachedAttempt: vi.fn().mockResolvedValue(null),
}));

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ─── QuizResult ───────────────────────────────────────────────────────────────
import { QuizResult } from "@/components/features/kuis/result/QuizResult";

describe("QuizResult", () => {
  const mockAttempt = {
    id: "att-1",
    kuis_id: "k1",
    mahasiswa_id: "m1",
    status: "submitted",
    nilai: 80,
    jawaban: [],
    started_at: "2025-01-06T08:00:00Z",
    submitted_at: "2025-01-06T09:00:00Z",
  };
  const mockKuis = {
    id: "k1",
    judul: "Pre-Test Anatomi",
    tipe_kuis: "pilihan_ganda",
    soal: [],
    durasi_menit: 60,
    passing_score: 70,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender QuizResult tanpa crash", () => {
    expect(() =>
      wrap(
        <QuizResult
          quiz={mockKuis as any}
          questions={[]}
          answers={[]}
          attempt={mockAttempt as any}
          onBack={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it("menampilkan judul kuis", () => {
    wrap(
      <QuizResult
        quiz={mockKuis as any}
        questions={[]}
        answers={[]}
        attempt={mockAttempt as any}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/Pre-Test Anatomi/i).length).toBeGreaterThan(0);
  });

  it("menampilkan tombol kembali", () => {
    wrap(
      <QuizResult
        quiz={mockKuis as any}
        questions={[]}
        answers={[]}
        attempt={mockAttempt as any}
        onBack={vi.fn()}
      />,
    );
    const btns = screen.queryAllByRole("button");
    expect(btns.length).toBeGreaterThan(0);
  });

  it("tidak crash saat canRetake false", () => {
    expect(() =>
      wrap(
        <QuizResult
          quiz={mockKuis as any}
          questions={[]}
          answers={[]}
          attempt={mockAttempt as any}
          onBack={vi.fn()}
          canRetake={false}
        />,
      ),
    ).not.toThrow();
  });
});

// ─── QuizBuilder ──────────────────────────────────────────────────────────────
import { QuizBuilder } from "@/components/features/kuis/builder/QuizBuilder";

describe("QuizBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({
      user: { id: "u1", role: "dosen", dosen: { id: "d1" } },
    });
  });

  it("merender QuizBuilder tanpa crash", () => {
    expect(() =>
      wrap(<QuizBuilder dosenId="d1" onSave={vi.fn()} />),
    ).not.toThrow();
  });

  it("menampilkan form builder", () => {
    wrap(<QuizBuilder dosenId="d1" onSave={vi.fn()} />);
    expect(
      document.querySelector("form, [data-testid], input, textarea, button"),
    ).toBeInTheDocument();
  });

  it("menampilkan tombol simpan atau submit", () => {
    wrap(<QuizBuilder dosenId="d1" onSave={vi.fn()} />);
    const btn = screen.queryByRole("button", {
      name: /Simpan|Submit|Buat|Tambah|Publish|Publikasi/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it("menampilkan input judul kuis", () => {
    wrap(<QuizBuilder dosenId="d1" onSave={vi.fn()} />);
    const inputs = document.querySelectorAll("input, textarea");
    expect(inputs.length).toBeGreaterThan(0);
  });
});

// ─── QuestionEditor ───────────────────────────────────────────────────────────
import { QuestionEditor } from "@/components/features/kuis/builder/QuestionEditor";

describe("QuestionEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({
      user: { id: "u1", role: "dosen", dosen: { id: "d1" } },
    });
  });

  it("merender QuestionEditor tanpa crash", () => {
    expect(() =>
      wrap(
        <QuestionEditor
          kuisId="k1"
          dosenId="d1"
          urutan={1}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it("menampilkan form editor soal", () => {
    wrap(
      <QuestionEditor
        kuisId="k1"
        dosenId="d1"
        urutan={1}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      document.querySelector("input, textarea, button"),
    ).toBeInTheDocument();
  });

  it("menampilkan tombol Batal", () => {
    wrap(
      <QuestionEditor
        kuisId="k1"
        dosenId="d1"
        urutan={1}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const cancelBtns = screen.queryAllByRole("button", { name: /Batal/i });
    expect(cancelBtns.length).toBeGreaterThan(0);
  });

  it("menampilkan tombol Simpan Soal", () => {
    wrap(
      <QuestionEditor
        kuisId="k1"
        dosenId="d1"
        urutan={1}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const saveBtns = screen.queryAllByRole("button", { name: /Simpan Soal/i });
    expect(saveBtns.length).toBeGreaterThan(0);
  });
});

// ─── QuizAttempt ──────────────────────────────────────────────────────────────
import { QuizAttempt } from "@/components/features/kuis/attempt/QuizAttempt";
import * as kuisSecureApi from "@/lib/api/kuis-secure.api";

describe("QuizAttempt", () => {
  const mockUser = { id: "u1", role: "mahasiswa", mahasiswa: { id: "mhs-1" } };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
    vi.mocked(kuisSecureApi.getSoalForAttempt).mockResolvedValue([]);
    vi.mocked(kuisSecureApi.validateAttemptAccess).mockResolvedValue({
      allowed: true,
    } as any);
  });

  it("merender QuizAttempt tanpa crash", () => {
    expect(() =>
      wrap(<QuizAttempt kuisId="k1" mahasiswaId="mhs-1" />),
    ).not.toThrow();
  });

  it("menampilkan loading atau konten kuis", () => {
    const { container } = wrap(<QuizAttempt kuisId="k1" mahasiswaId="mhs-1" />);
    expect(container.firstChild).toBeTruthy();
  });
});

// ─── PermintaanPerbaikanTab ───────────────────────────────────────────────────
import { PermintaanPerbaikanTab } from "@/components/features/penilaian/PermintaanPerbaikanTab";

describe("PermintaanPerbaikanTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({
      user: { id: "u1", role: "dosen", dosen: { id: "d1" } },
    });
  });

  it("merender tanpa crash dengan kelas kosong", () => {
    expect(() =>
      wrap(<PermintaanPerbaikanTab kelasId="k1" dosenId="d1" />),
    ).not.toThrow();
  });

  it("menampilkan konten tab permintaan perbaikan", async () => {
    wrap(<PermintaanPerbaikanTab kelasId="k1" dosenId="d1" />);
    await waitFor(() =>
      expect(
        document.querySelector("table, [data-testid], .card, p"),
      ).toBeInTheDocument(),
    );
  });
});
