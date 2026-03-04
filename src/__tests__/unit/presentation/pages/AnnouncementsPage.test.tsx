import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnnouncementsPage from "@/pages/admin/AnnouncementsPage";

const {
  mockUseAuth,
  mockCacheAPI,
  mockGetAllAnnouncements,
  mockGetAnnouncementStats,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCacheAPI: vi.fn(),
  mockGetAllAnnouncements: vi.fn(),
  mockGetAnnouncementStats: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/common/PageHeader", () => ({
  PageHeader: ({
    title,
    description,
  }: {
    title: string;
    description?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}));

vi.mock("@/components/common/DeleteConfirmDialog", () => ({
  DeleteConfirmDialog: () => null,
}));

vi.mock("@/components/shared/DataTable/TableSkeleton", () => ({
  TableSkeleton: () => <div data-testid="table-skeleton">loading</div>,
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: (...args: unknown[]) => mockCacheAPI(...args),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/api/announcements.api", () => ({
  getAllAnnouncements: (...args: unknown[]) => mockGetAllAnnouncements(...args),
  getAnnouncementStats: (...args: unknown[]) =>
    mockGetAnnouncementStats(...args),
  deleteAnnouncement: vi.fn(),
  createAnnouncement: vi.fn(),
}));

vi.mock("@/lib/api/notification.api", () => ({
  notifyUsersAnnouncement: vi.fn(),
}));

vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: {
    isOnline: vi.fn(() => true),
  },
}));

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <AnnouncementsPage />
    </MemoryRouter>,
  );
}

describe("AnnouncementsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: {
        id: "admin-1",
        role: "admin",
        full_name: "Admin Sistem",
      },
    });

    mockCacheAPI.mockImplementation(
      async (_key: string, fn: () => Promise<any>) => {
        return fn();
      },
    );

    mockGetAllAnnouncements.mockResolvedValue([
      {
        id: "a-1",
        judul: "Info Akademik",
        konten: "Konten",
        prioritas: "normal",
        tipe: "info",
        created_at: "2025-01-01T00:00:00.000Z",
        penulis: { full_name: "Admin" },
      },
    ]);

    mockGetAnnouncementStats.mockResolvedValue({
      total: 1,
      active: 1,
      highPriority: 0,
      scheduled: 0,
    });
  });

  it("render halaman announcements", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /announcements/i }),
      ).toBeInTheDocument();
      expect(mockGetAllAnnouncements).toHaveBeenCalled();
      expect(mockGetAnnouncementStats).toHaveBeenCalled();
    });
  });
});
