/**
 * Mahasiswa Pages Tests — KuisListPage, KuisAttemptPage, KuisResultPage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { mockUseAuth, mockCacheAPI, mockNavigate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockNavigate: vi.fn(),
}));

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
vi.mock("@/lib/api/kuis.api", () => ({
  getUpcomingQuizzes: vi.fn(),
  getAttemptByIdForMahasiswa: vi.fn(),
  cacheAttemptOffline: vi.fn(),
  syncOfflineAnswers: vi.fn(),
  getCachedAttempt: vi.fn().mockResolvedValue(null),
  canAttemptQuiz: vi.fn(),
  gradeAnswer: vi.fn(),
}));
vi.mock("@/lib/api/kuis-secure.api", () => ({
  getKuisForAttempt: vi.fn(),
  getSoalForResult: vi.fn(),
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
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));
vi.mock("@/components/features/kuis/attempt/QuizAttempt", () => ({
  QuizAttempt: () => (
    <div data-testid="quiz-attempt">QuizAttempt Component</div>
  ),
}));
vi.mock("@/components/features/kuis/result/QuizResult", () => ({
  QuizResult: () => <div data-testid="quiz-result">QuizResult Component</div>,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/utils/quiz-scoring", () => ({
  gradeAnswer: vi.fn(() => ({ is_correct: true, poin_diperoleh: 10 })),
  canAutoGrade: vi.fn(() => true),
}));

import * as kuisApi from "@/lib/api/kuis.api";
import * as kuisSecureApi from "@/lib/api/kuis-secure.api";

const mockUser = {
  id: "u1",
  full_name: "Budi",
  role: "mahasiswa",
  mahasiswa: { id: "mhs-1" },
};

const mockQuizzes = [
  {
    id: "kuis-1",
    judul: "Pre-Test Anatomi",
    status: "ongoing",
    kode_mk: "ANT101",
    nama_mk: "Anatomi",
    nama_kelas: "A",
    tipe_kuis: "pilihan_ganda",
    durasi_menit: 60,
    tanggal_mulai: new Date(Date.now() - 3600000).toISOString(),
    tanggal_selesai: new Date(Date.now() + 3600000).toISOString(),
    passing_score: 70,
    max_attempts: 1,
    attempts_used: 0,
    attempt_ids: [],
  },
];

function renderPage(ui: React.ReactElement, path = "/", route = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

// ─── KuisListPage ────────────────────────────────────────────────────────────
import KuisListPage from "@/pages/mahasiswa/kuis/KuisListPage";

describe("Mahasiswa KuisListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockCacheAPI.mockResolvedValue(mockQuizzes);
  });

  it("menampilkan loading skeleton", () => {
    mockCacheAPI.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage(
      <KuisListPage />,
      "/mahasiswa/kuis",
      "/mahasiswa/kuis",
    );
    expect(
      container.querySelector(".animate-pulse") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan judul halaman Tugas Praktikum", async () => {
    renderPage(<KuisListPage />, "/mahasiswa/kuis", "/mahasiswa/kuis");
    await waitFor(() =>
      expect(screen.getByText(/Tugas Praktikum/i)).toBeInTheDocument(),
    );
  });

  it("menampilkan judul kuis dari data", async () => {
    renderPage(<KuisListPage />, "/mahasiswa/kuis", "/mahasiswa/kuis");
    await waitFor(() =>
      expect(screen.getByText("Pre-Test Anatomi")).toBeInTheDocument(),
    );
  });

  it("menampilkan input search", async () => {
    renderPage(<KuisListPage />, "/mahasiswa/kuis", "/mahasiswa/kuis");
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Cari/i)).toBeInTheDocument(),
    );
  });

  it("filter search memfilter judul kuis", async () => {
    renderPage(<KuisListPage />, "/mahasiswa/kuis", "/mahasiswa/kuis");
    await waitFor(() => screen.getByText("Pre-Test Anatomi"));
    await userEvent.type(screen.getByPlaceholderText(/Cari/i), "XYZNOTFOUND");
    await waitFor(() =>
      expect(screen.queryByText("Pre-Test Anatomi")).not.toBeInTheDocument(),
    );
  });

  it("menampilkan pesan kosong ketika tidak ada kuis", async () => {
    mockCacheAPI.mockResolvedValue([]);
    renderPage(<KuisListPage />, "/mahasiswa/kuis", "/mahasiswa/kuis");
    await waitFor(() =>
      expect(screen.getByText(/Tidak ada tugas/i)).toBeInTheDocument(),
    );
  });

  it("tidak memanggil cacheAPI saat user null", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderPage(<KuisListPage />, "/mahasiswa/kuis", "/mahasiswa/kuis");
    await new Promise((r) => setTimeout(r, 50));
    expect(mockCacheAPI).not.toHaveBeenCalled();
  });
});

// ─── KuisAttemptPage ────────────────────────────────────────────────────────
import KuisAttemptPage from "@/pages/mahasiswa/kuis/KuisAttemptPage";

describe("Mahasiswa KuisAttemptPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
  });

  it("menampilkan loading saat validasi akses", () => {
    vi.mocked(kuisSecureApi.getKuisForAttempt).mockReturnValue(
      new Promise(() => {}),
    );
    const { container } = renderPage(
      <KuisAttemptPage />,
      "/mahasiswa/kuis/kuis-1/attempt",
      "/mahasiswa/kuis/:kuisId/attempt",
    );
    expect(
      container.querySelector("svg.animate-spin") ||
        container.querySelector(".animate-spin"),
    ).toBeTruthy();
  });

  it("menampilkan error saat kuisId tidak valid", async () => {
    vi.mocked(kuisSecureApi.getKuisForAttempt).mockRejectedValue(
      new Error("Kuis tidak ditemukan"),
    );
    renderPage(
      <KuisAttemptPage />,
      "/mahasiswa/kuis/invalid/attempt",
      "/mahasiswa/kuis/:kuisId/attempt",
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Kuis tidak ditemukan|tidak ditemukan|error/i),
      ).toBeInTheDocument(),
    );
  });

  it("tidak memanggil API saat user null", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderPage(
      <KuisAttemptPage />,
      "/mahasiswa/kuis/kuis-1/attempt",
      "/mahasiswa/kuis/:kuisId/attempt",
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(kuisSecureApi.getKuisForAttempt).not.toHaveBeenCalled();
  });
});

// ─── KuisResultPage ──────────────────────────────────────────────────────────
import KuisResultPage from "@/pages/mahasiswa/kuis/KuisResultPage";

describe("Mahasiswa KuisResultPage", () => {
  const mockAttempt = {
    id: "attempt-1",
    kuis_id: "kuis-1",
    mahasiswa_id: "mhs-1",
    status: "submitted",
    attempt_number: 1,
    started_at: new Date().toISOString(),
    total_poin: 80,
    jawaban: [],
    kuis: {
      id: "kuis-1",
      judul: "Pre-Test Anatomi",
      passing_score: 70,
      max_attempts: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockUseAuth.mockReturnValue({ user: mockUser });
    vi.mocked(kuisApi.getAttemptByIdForMahasiswa).mockResolvedValue(
      mockAttempt as any,
    );
    vi.mocked(kuisApi.canAttemptQuiz).mockResolvedValue({
      canAttempt: false,
    } as any);
    vi.mocked(kuisSecureApi.getSoalForResult).mockResolvedValue([] as any);
  });

  it("menampilkan loading skeleton", () => {
    vi.mocked(kuisApi.getAttemptByIdForMahasiswa).mockReturnValue(
      new Promise(() => {}),
    );
    const { container } = renderPage(
      <KuisResultPage />,
      "/mahasiswa/kuis/kuis-1/result/attempt-1",
      "/mahasiswa/kuis/:kuisId/result/:attemptId",
    );
    expect(
      container.querySelector(".animate-spin") ||
        container.querySelector(".animate-pulse"),
    ).toBeTruthy();
  });

  it("menampilkan QuizResult setelah data dimuat", async () => {
    renderPage(
      <KuisResultPage />,
      "/mahasiswa/kuis/kuis-1/result/attempt-1",
      "/mahasiswa/kuis/:kuisId/result/:attemptId",
    );
    await waitFor(() =>
      expect(screen.getByTestId("quiz-result")).toBeInTheDocument(),
    );
  });

  it("menampilkan error saat attempt gagal dimuat", async () => {
    vi.mocked(kuisApi.getAttemptByIdForMahasiswa).mockRejectedValue(
      new Error("Attempt tidak ditemukan"),
    );
    renderPage(
      <KuisResultPage />,
      "/mahasiswa/kuis/kuis-1/result/attempt-1",
      "/mahasiswa/kuis/:kuisId/result/:attemptId",
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Attempt tidak ditemukan|tidak ditemukan|error/i),
      ).toBeInTheDocument(),
    );
  });
});
