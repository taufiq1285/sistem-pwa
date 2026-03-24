import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";

vi.mock("@/config/navigation.config", async () => {
  const { Home, BookOpen } =
    await vi.importActual<typeof import("lucide-react")>("lucide-react");

  return {
    getNavigationItems: vi.fn(() => [
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
    ]),
    isRouteActive: vi.fn(
      (currentPath: string, href: string) => currentPath === href,
    ),
  };
});

vi.mock("@/lib/hooks/useRoleTheme", () => ({
  useRoleTheme: () => ({
    sidebarBg: "bg-slate-950/95",
    headerGlow: "via-slate-400/35",
    mobileBanner: "from-slate-500/15 via-slate-400/5 to-transparent",
    avatarGradient: "from-slate-700 via-slate-800 to-slate-950",
  }),
}));

describe("MobileNav", () => {
  it("render drawer dan menjalankan onClose saat overlay diklik", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <MobileNav
          isOpen
          onClose={onClose}
          userRole="admin"
          userName="Mobile User"
          userEmail="mobile@example.com"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Mobile User")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();

    if (overlay) {
      await user.click(overlay);
    }

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("memanggil onLogout lalu onClose saat logout diklik", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onLogout = vi.fn();

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <MobileNav
          isOpen
          onClose={onClose}
          onLogout={onLogout}
          userRole="admin"
          userName="Mobile User"
          userEmail="mobile@example.com"
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });
});
