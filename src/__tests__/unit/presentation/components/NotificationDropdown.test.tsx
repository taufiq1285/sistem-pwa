/**
 * NotificationDropdown Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificationDropdown } from "@/components/common/NotificationDropdown";
import type { Notification } from "@/types/notification.types";

const mockUseAuth = vi.fn();
const mockGetNotifications = vi.fn();
const mockGetUnreadCount = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockDeleteReadNotifications = vi.fn();

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/api/notification.api", () => ({
  getNotifications: (...args: unknown[]) => mockGetNotifications(...args),
  getUnreadCount: (...args: unknown[]) => mockGetUnreadCount(...args),
  markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
  markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
  deleteReadNotifications: (...args: unknown[]) =>
    mockDeleteReadNotifications(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/utils/format", () => ({
  formatRelativeTime: () => "2 menit lalu",
}));

const mockNotification = (
  overrides: Partial<Notification> = {},
): Notification => ({
  id: "notif-1",
  user_id: "user-1",
  type: "pengumuman",
  title: "Pengumuman Baru",
  message: "Ada pengumuman penting",
  is_read: false,
  created_at: new Date().toISOString(),
  data: null,
  ...overrides,
});

function renderComponent() {
  return render(
    <MemoryRouter>
      <NotificationDropdown />
    </MemoryRouter>,
  );
}

describe("NotificationDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockUseAuth.mockReturnValue({ user: { id: "user-1", role: "mahasiswa" } });
    mockGetNotifications.mockResolvedValue([]);
    mockGetUnreadCount.mockResolvedValue(0);
    mockMarkAsRead.mockResolvedValue(undefined);
    mockMarkAllAsRead.mockResolvedValue(undefined);
    mockDeleteReadNotifications.mockResolvedValue(undefined);
  });

  describe("rendering awal", () => {
    it("menampilkan tombol bell notification", async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByTitle("Notifikasi")).toBeInTheDocument();
      });
    });

    it("tidak menampilkan badge saat unread count = 0", async () => {
      mockGetUnreadCount.mockResolvedValue(0);
      renderComponent();

      await waitFor(() => {
        expect(mockGetUnreadCount).toHaveBeenCalled();
      });

      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it("menampilkan badge jumlah unread saat ada notifikasi baru", async () => {
      mockGetUnreadCount.mockResolvedValue(3);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });

    it("menampilkan '9+' saat unread count lebih dari 9", async () => {
      mockGetUnreadCount.mockResolvedValue(12);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("9+")).toBeInTheDocument();
      });
    });
  });

  describe("membuka dropdown", () => {
    it("membuka popover saat tombol diklik dan menampilkan header Notifikasi", async () => {
      renderComponent();

      await userEvent.click(screen.getByTitle("Notifikasi"));

      await waitFor(() => {
        expect(screen.getByText("Notifikasi")).toBeInTheDocument();
      });
    });

    it("menampilkan empty state saat tidak ada notifikasi", async () => {
      mockGetNotifications.mockResolvedValue([]);
      renderComponent();

      await userEvent.click(screen.getByTitle("Notifikasi"));

      await waitFor(() => {
        expect(screen.getByText("Tidak ada notifikasi")).toBeInTheDocument();
      });
    });

    it("menampilkan daftar notifikasi saat ada data", async () => {
      mockGetNotifications.mockResolvedValue([
        mockNotification({ title: "Tugas Baru", message: "Ada tugas baru" }),
      ]);
      mockGetUnreadCount.mockResolvedValue(1);

      renderComponent();
      await userEvent.click(screen.getByTitle("Notifikasi"));

      await waitFor(() => {
        expect(screen.getByText("Tugas Baru")).toBeInTheDocument();
        expect(screen.getByText("Ada tugas baru")).toBeInTheDocument();
      });
    });
  });

  describe("tidak memuat saat user null", () => {
    it("tidak memanggil API saat user tidak ada", async () => {
      mockUseAuth.mockReturnValue({ user: null });
      renderComponent();

      await waitFor(() => {
        expect(mockGetNotifications).not.toHaveBeenCalled();
      });
    });
  });

  describe("mark as read", () => {
    it("menampilkan tombol Tandai Semua saat ada unread", async () => {
      mockGetNotifications.mockResolvedValue([
        mockNotification({ is_read: false }),
      ]);
      mockGetUnreadCount.mockResolvedValue(1);

      renderComponent();
      await userEvent.click(screen.getByTitle("Notifikasi"));

      await waitFor(() => {
        expect(screen.getByText("Tandai Semua")).toBeInTheDocument();
      });
    });

    it("memanggil markAllAsRead saat tombol diklik", async () => {
      mockGetNotifications.mockResolvedValue([
        mockNotification({ is_read: false }),
      ]);
      mockGetUnreadCount.mockResolvedValue(1);

      renderComponent();
      await userEvent.click(screen.getByTitle("Notifikasi"));

      await waitFor(() => screen.getByText("Tandai Semua"));
      await userEvent.click(screen.getByText("Tandai Semua"));

      expect(mockMarkAllAsRead).toHaveBeenCalledWith("user-1");
    });
  });

  describe("hapus notifikasi dibaca", () => {
    it("memanggil deleteReadNotifications saat tombol hapus diklik", async () => {
      mockGetNotifications.mockResolvedValue([
        mockNotification({ is_read: true }),
      ]);
      mockGetUnreadCount.mockResolvedValue(0);

      renderComponent();
      await userEvent.click(screen.getByTitle("Notifikasi"));

      await waitFor(() => screen.getByText("Hapus yang Sudah Dibaca"));
      await userEvent.click(screen.getByText("Hapus yang Sudah Dibaca"));

      expect(mockDeleteReadNotifications).toHaveBeenCalledWith("user-1");
    });
  });
});
