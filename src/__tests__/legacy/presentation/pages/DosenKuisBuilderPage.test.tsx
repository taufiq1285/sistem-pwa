import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import KuisBuilderPage from "@/pages/dosen/kuis/KuisBuilderPage";

const {
  mockUseAuth,
  mockNavigate,
  mockGetKuisById,
  mockToastError,
  mockQuizBuilder,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockNavigate: vi.fn(),
  mockGetKuisById: vi.fn(),
  mockToastError: vi.fn(),
  mockQuizBuilder: vi.fn(() => (
    <div data-testid="quiz-builder">Mock Quiz Builder</div>
  )),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/api/kuis.api", () => ({
  getKuisById: (...args: unknown[]) => mockGetKuisById(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

vi.mock("@/components/features/kuis/builder/QuizBuilder", () => ({
  QuizBuilder: (props: unknown) => (mockQuizBuilder as any)(props),
}));

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dosen/kuis/create" element={<KuisBuilderPage />} />
        <Route path="/dosen/kuis/:kuisId/edit" element={<KuisBuilderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Dosen KuisBuilderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        role: "dosen",
        dosen: { id: "dosen-1" },
      },
    });
  });

  it("render mode create", () => {
    renderPage("/dosen/kuis/create");

    expect(
      screen.getByRole("heading", { name: /Buat Tugas Praktikum Baru/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("quiz-builder")).toBeInTheDocument();
    expect(mockQuizBuilder).toHaveBeenCalledWith(
      expect.objectContaining({
        dosenId: "dosen-1",
        quiz: undefined,
        laporanMode: false,
      }),
    );
  });

  it("memuat data saat mode edit", async () => {
    mockGetKuisById.mockResolvedValue({
      id: "kuis-1",
      judul: "Laporan Praktikum 1",
      dosen_id: "dosen-1",
    });

    renderPage("/dosen/kuis/kuis-1/edit");

    await waitFor(() => {
      expect(mockGetKuisById).toHaveBeenCalledWith("kuis-1");
    });

    expect(
      screen.getByRole("heading", { name: /Edit Tugas Praktikum/i }),
    ).toBeInTheDocument();
    expect(mockQuizBuilder).toHaveBeenCalledWith(
      expect.objectContaining({
        dosenId: "dosen-1",
        quiz: expect.objectContaining({ id: "kuis-1" }),
        laporanMode: true,
      }),
    );
  });

  it("redirect ke root bila user bukan dosen", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-2",
        role: "mahasiswa",
      },
    });

    renderPage("/dosen/kuis/create");

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("menolak edit kuis milik dosen lain", async () => {
    mockGetKuisById.mockResolvedValue({
      id: "kuis-2",
      judul: "Tugas Praktikum 2",
      dosen_id: "dosen-lain",
    });

    renderPage("/dosen/kuis/kuis-2/edit");

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Anda tidak memiliki akses untuk mengedit tugas ini",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/dosen/kuis");
    });
  });
});
