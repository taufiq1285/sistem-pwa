import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

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
    sidebarHover: "hover:bg-slate-800/80",
    sidebarActive: "bg-slate-800/90 border-l-4 border-slate-300 text-white",
    badgeBg: "bg-slate-100 text-slate-800 border border-slate-200",
    avatarGradient: "from-slate-700 via-slate-800 to-slate-950",
  }),
}));

describe("Sidebar", () => {
  it("render user info dan toggle collapse", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Sidebar
          userRole="admin"
          userName="Sidebar User"
          userEmail="sidebar@example.com"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sidebar User")).toBeInTheDocument();
    expect(screen.getByTitle("Collapse sidebar")).toBeInTheDocument();

    await user.click(screen.getByTitle("Collapse sidebar"));

    expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();
  });

  it("memanggil callback logout", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Sidebar
          userRole="admin"
          userName="Sidebar User"
          userEmail="sidebar@example.com"
          onLogout={onLogout}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByTitle("Logout"));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
