import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ConflictNotificationBadge } from "@/components/layout/ConflictNotificationBadge";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navigation } from "@/components/layout/Navigation";
import { OfflineBar } from "@/components/layout/OfflineBar";
import { Sidebar } from "@/components/layout/Sidebar";

const mockUseAuth = vi.fn();
const mockUseRole = vi.fn();
const mockUseConflicts = vi.fn();
const mockUseNetworkStatus = vi.fn();
const mockUseSyncContext = vi.fn();
const mockUseSessionTimeout = vi.fn();
const mockUseMultiTabSync = vi.fn();
const mockUseNotificationPolling = vi.fn();

const mockRefreshConflicts = vi.fn();
const mockProcessQueue = vi.fn();

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/hooks/useRole", () => ({
  useRole: () => mockUseRole(),
}));

vi.mock("@/lib/hooks/useSessionTimeout", () => ({
  useSessionTimeout: (options: unknown) => mockUseSessionTimeout(options),
}));

vi.mock("@/lib/hooks/useMultiTabSync", () => ({
  useMultiTabSync: () => mockUseMultiTabSync(),
}));

vi.mock("@/lib/hooks/useNotificationPolling", () => ({
  useNotificationPolling: (options: unknown) =>
    mockUseNotificationPolling(options),
}));

vi.mock("@/lib/hooks/useConflicts", () => ({
  useConflicts: () => mockUseConflicts(),
}));

vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

vi.mock("@/providers/SyncProvider", () => ({
  useSyncContext: () => mockUseSyncContext(),
}));

vi.mock("@/components/features/sync/ConflictResolver", () => ({
  ConflictResolver: ({ open }: { open: boolean }) =>
    open ? <div data-testid="conflict-resolver">Resolver Open</div> : null,
}));

vi.mock("@/components/common", async () => {
  const actual = await vi.importActual<object>("@/components/common");
  return {
    ...actual,
    NotificationDropdown: () => (
      <div data-testid="notification-dropdown">Notification Dropdown</div>
    ),
  };
});

vi.mock("@/config/navigation.config", async () => {
  const { Home, BookOpen } =
    await vi.importActual<typeof import("lucide-react")>("lucide-react");

  const items = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      description: "Dashboard utama",
      icon: Home,
      badge: 2,
    },
    {
      href: "/admin/mata-kuliah",
      label: "Mata Kuliah",
      description: "Data mata kuliah",
      icon: BookOpen,
    },
  ];

  return {
    getNavigationItems: vi.fn(() => items),
    isRouteActive: vi.fn(
      (currentPath: string, href: string) => currentPath === href,
    ),
  };
});

function renderWithRouter(ui: React.ReactElement, initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>,
  );
}

describe("Layout Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { full_name: "Admin User", email: "admin@example.com" },
      logout: vi.fn().mockResolvedValue(undefined),
    });

    mockUseRole.mockReturnValue({ role: "admin" });

    mockUseConflicts.mockReturnValue({
      pendingConflicts: [],
      refreshConflicts: mockRefreshConflicts,
      loading: false,
    });

    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      isOffline: false,
    });

    mockUseSyncContext.mockReturnValue({
      stats: { pending: 0 },
      processQueue: mockProcessQueue,
      isProcessing: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("AppLayout", () => {
    it("render children tanpa wrapper layout saat user/role tidak ada", () => {
      mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
      mockUseRole.mockReturnValue({ role: null });

      renderWithRouter(
        <AppLayout>
          <div>Only Child</div>
        </AppLayout>,
      );

      expect(screen.getByText("Only Child")).toBeInTheDocument();
      expect(screen.queryByTitle("Toggle menu")).not.toBeInTheDocument();
    });

    it("render layout lengkap dan memanggil hooks proteksi session/sync", () => {
      renderWithRouter(
        <AppLayout>
          <div>Main Content</div>
        </AppLayout>,
        ["/admin/dashboard"],
      );

      expect(screen.getByText("Main Content")).toBeInTheDocument();
      expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);

      expect(mockUseSessionTimeout).toHaveBeenCalledWith({
        timeoutMinutes: 15,
        warningMinutes: 2,
        enableWarningDialog: true,
      });
      expect(mockUseMultiTabSync).toHaveBeenCalled();
      expect(mockUseNotificationPolling).toHaveBeenCalledWith({
        interval: 30000,
        enabled: true,
      });
    });
  });

  describe("AuthLayout", () => {
    it("menampilkan branding, children, dan className tambahan", () => {
      const { container } = render(
        <AuthLayout className="custom-auth-layout">
          <div>Auth Form</div>
        </AuthLayout>,
      );

      expect(screen.getByText("AKBID Mega Buana")).toBeInTheDocument();
      expect(
        screen.getByText("Sistem Praktikum Kebidanan"),
      ).toBeInTheDocument();
      expect(screen.getByText("Auth Form")).toBeInTheDocument();
      expect(
        container.querySelector(".custom-auth-layout"),
      ).toBeInTheDocument();
    });
  });

  describe("ConflictNotificationBadge", () => {
    it("tidak render apapun jika tidak ada konflik", () => {
      mockUseConflicts.mockReturnValue({
        pendingConflicts: [],
        refreshConflicts: mockRefreshConflicts,
        loading: false,
      });

      const { container } = render(<ConflictNotificationBadge />);
      expect(container.firstChild).toBeNull();
    });

    it("render badge konflik dan membuka resolver saat diklik", async () => {
      const user = userEvent.setup();
      mockUseConflicts.mockReturnValue({
        pendingConflicts: [{ id: "1" }, { id: "2" }],
        refreshConflicts: mockRefreshConflicts,
        loading: false,
      });

      render(<ConflictNotificationBadge showLabel />);

      expect(screen.getByText("Conflicts")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      await user.click(screen.getByRole("button"));
      expect(screen.getByTestId("conflict-resolver")).toBeInTheDocument();
    });

    it("menjalankan refresh otomatis sesuai interval", () => {
      vi.useFakeTimers();
      mockUseConflicts.mockReturnValue({
        pendingConflicts: [{ id: "1" }],
        refreshConflicts: mockRefreshConflicts,
        loading: false,
      });

      render(<ConflictNotificationBadge autoRefreshInterval={1000} />);

      vi.advanceTimersByTime(3000);
      expect(mockRefreshConflicts).toHaveBeenCalledTimes(3);
    });
  });

  describe("Header", () => {
    it("menampilkan notification button default dan memanggil callback", async () => {
      const user = userEvent.setup();
      const onMenuClick = vi.fn();
      const onNotificationClick = vi.fn();

      render(
        <Header
          userName="Admin"
          userEmail="admin@example.com"
          onMenuClick={onMenuClick}
          onNotificationClick={onNotificationClick}
          notificationCount={3}
        />,
      );

      await user.click(screen.getByTitle("Toggle menu"));
      await user.click(screen.getByTitle("Notifications"));

      expect(onMenuClick).toHaveBeenCalledTimes(1);
      expect(onNotificationClick).toHaveBeenCalledTimes(1);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("menampilkan NotificationDropdown saat mode dropdown aktif", () => {
      render(<Header showNotificationDropdown />);
      expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
    });
  });

  describe("MobileNav", () => {
    it("render drawer terbuka dan menjalankan onClose saat overlay diklik", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithRouter(
        <MobileNav
          isOpen
          onClose={onClose}
          userRole="admin"
          userName="Mobile User"
          userEmail="mobile@example.com"
        />,
        ["/admin/dashboard"],
      );

      expect(screen.getByText("Mobile User")).toBeInTheDocument();

      const overlay = document.querySelector('[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();

      if (overlay) {
        await user.click(overlay);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("menjalankan onLogout lalu onClose saat tombol logout diklik", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onLogout = vi.fn();

      renderWithRouter(
        <MobileNav
          isOpen
          onClose={onClose}
          onLogout={onLogout}
          userRole="admin"
          userName="Mobile User"
          userEmail="mobile@example.com"
        />,
        ["/admin/dashboard"],
      );

      await user.click(screen.getByRole("button", { name: /logout/i }));

      expect(onLogout).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("merender Sidebar dan MobileNav untuk role aktif", () => {
      renderWithRouter(
        <Navigation
          userRole="admin"
          userName="Nav User"
          userEmail="nav@example.com"
        />,
        ["/admin/dashboard"],
      );

      expect(screen.getAllByText("Nav User").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("OfflineBar", () => {
    it("menampilkan banner offline dan jumlah pending changes", () => {
      mockUseNetworkStatus.mockReturnValue({
        isOnline: false,
        isOffline: true,
      });
      mockUseSyncContext.mockReturnValue({
        stats: { pending: 2 },
        processQueue: mockProcessQueue,
        isProcessing: false,
      });

      render(<OfflineBar />);

      expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
      expect(
        screen.getByText(/you have 2 unsaved changes/i),
      ).toBeInTheDocument();
    });

    it("menampilkan state back online dan memproses sync manual", async () => {
      const user = userEvent.setup();

      mockUseNetworkStatus.mockReturnValue({
        isOnline: false,
        isOffline: true,
      });
      mockUseSyncContext.mockReturnValue({
        stats: { pending: 3 },
        processQueue: mockProcessQueue,
        isProcessing: false,
      });

      const { rerender } = render(<OfflineBar />);

      mockUseNetworkStatus.mockReturnValue({
        isOnline: true,
        isOffline: false,
      });
      rerender(<OfflineBar />);

      expect(screen.getByText(/you are back online/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /sync now/i }));
      await waitFor(() => {
        expect(mockProcessQueue).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Sidebar", () => {
    it("render user info dan toggle collapse/expand", async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <Sidebar
          userRole="admin"
          userName="Sidebar User"
          userEmail="sidebar@example.com"
        />,
        ["/admin/dashboard"],
      );

      expect(screen.getByText("Sidebar User")).toBeInTheDocument();
      expect(screen.getByTitle("Collapse sidebar")).toBeInTheDocument();

      await user.click(screen.getByTitle("Collapse sidebar"));
      expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();
    });

    it("menjalankan callback logout", async () => {
      const user = userEvent.setup();
      const onLogout = vi.fn();

      renderWithRouter(
        <Sidebar
          userRole="admin"
          userName="Sidebar User"
          userEmail="sidebar@example.com"
          onLogout={onLogout}
        />,
        ["/admin/dashboard"],
      );

      await user.click(screen.getByTitle("Logout"));
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });
});
