import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LaboratoriumPage from "@/pages/laboran/LaboratoriumPage";

const {
  mockGetLaboratoriumList,
  mockGetLabScheduleByLabId,
  mockGetLabEquipment,
  mockToast,
} = vi.hoisted(() => ({
  mockGetLaboratoriumList: vi.fn(),
  mockGetLabScheduleByLabId: vi.fn(),
  mockGetLabEquipment: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/api/laboran.api", () => ({
  getLaboratoriumList: (...args: unknown[]) => mockGetLaboratoriumList(...args),
  getLabScheduleByLabId: (...args: unknown[]) =>
    mockGetLabScheduleByLabId(...args),
  getLabEquipment: (...args: unknown[]) => mockGetLabEquipment(...args),
  createLaboratorium: vi.fn(),
  updateLaboratorium: vi.fn(),
  deleteLaboratorium: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("Laboran LaboratoriumPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetLaboratoriumList.mockResolvedValue([
      {
        id: "lab-1",
        kode_lab: "LA-01",
        nama_lab: "Lab Anatomi",
        lokasi: "Gedung A",
        kapasitas: 30,
        is_active: true,
        keterangan: "Lab utama",
        fasilitas: ["Mikroskop"],
      },
    ]);

    mockGetLabScheduleByLabId.mockResolvedValue([]);
    mockGetLabEquipment.mockResolvedValue([]);
  });

  it("menampilkan heading dan data laboratorium", async () => {
    render(<LaboratoriumPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /^Laboratorium$/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Lab Anatomi")).toBeInTheDocument();
    });
  });

  it("menampilkan loading state saat data belum selesai dimuat", () => {
    mockGetLaboratoriumList.mockReturnValue(new Promise(() => {}));

    const { container } = render(<LaboratoriumPage />);

    expect(
      container.querySelectorAll('[data-slot="card"]').length,
    ).toBeGreaterThan(0);
  });

  it("membuka dialog detail dan memuat detail laboratorium", async () => {
    render(<LaboratoriumPage />);

    await waitFor(() => {
      expect(screen.getByText("Lab Anatomi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Detail/i }));

    await waitFor(() => {
      expect(mockGetLabScheduleByLabId).toHaveBeenCalledWith("lab-1", 10);
      expect(mockGetLabEquipment).toHaveBeenCalledWith("lab-1");
      expect(
        screen.getByText(
          /Detail informasi, jadwal, dan inventaris laboratorium/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
