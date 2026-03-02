import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

const mockUseAuth = vi.fn();
const mockUseRole = vi.fn();
const mockUseSessionTimeout = vi.fn();
const mockUseMultiTabSync = vi.fn();
const mockUseNotificationPolling = vi.fn();

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
  useNotificationPolling: (options: unknown) => mockUseNotificationPolling(options),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <div>Header Mock</div>,
}));

vi.mock("@/components/layout/Sidebar", () => ({
  Sidebar: () => <div>Sidebar Mock</div>,
}));

vi.mock("@/components/layout/MobileNav", () => ({
  MobileNav: () => <div>MobileNav Mock</div>,
}));

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render children saja saat user/role tidak ada", () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    mockUseRole.mockReturnValue({ role: null });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>Only Child</div>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText("Only Child")).toBeInTheDocument();
    expect(screen.queryByText("Header Mock")).not.toBeInTheDocument();
  });

  it("render layout lengkap dan panggil hooks tambahan", () => {
    mockUseAuth.mockReturnValue({
      user: { full_name: "Admin User", email: "admin@example.com" },
      logout: vi.fn().mockResolvedValue(undefined),
    });
    mockUseRole.mockReturnValue({ role: "admin" });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>Main Content</div>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText("Header Mock")).toBeInTheDocument();
    expect(screen.getByText("Sidebar Mock")).toBeInTheDocument();
    expect(screen.getByText("MobileNav Mock")).toBeInTheDocument();
    expect(screen.getByText("Main Content")).toBeInTheDocument();

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
