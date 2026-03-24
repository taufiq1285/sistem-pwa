import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/layout/Header";

vi.mock("@/components/common", async () => {
  const actual = await vi.importActual<object>("@/components/common");
  return {
    ...actual,
    NotificationDropdown: () => (
      <div data-testid="notification-dropdown">Notification Dropdown</div>
    ),
  };
});

vi.mock("@/components/layout/ConflictNotificationBadge", () => ({
  ConflictNotificationBadge: () => (
    <div data-testid="conflict-badge">Conflict Badge</div>
  ),
}));

vi.mock("@/lib/hooks/useRoleTheme", () => ({
  useRoleTheme: () => ({
    accentBorder: "border-t-4 border-slate-600",
    primaryBtn: "bg-slate-800 hover:bg-slate-900 text-white shadow-sm",
  }),
}));

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

    await user.click(screen.getByRole("button", { name: /toggle menu/i }));
    const notificationButton = screen.getByRole("button", {
      name: /lihat notifikasi/i,
    });
    await user.click(notificationButton);

    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(onNotificationClick).toHaveBeenCalledTimes(1);
    expect(notificationButton.querySelector(".animate-ping")).toBeTruthy();
    expect(screen.getByTestId("conflict-badge")).toBeInTheDocument();
  });

  it("menampilkan NotificationDropdown saat showNotificationDropdown=true", () => {
    render(<Header showNotificationDropdown />);

    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
  });
});
