import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/layout/Header";

vi.mock("@/components/common", async () => {
  const actual = await vi.importActual<object>("@/components/common");
  return {
    ...actual,
    NotificationDropdown: () => <div data-testid="notification-dropdown">Notification Dropdown</div>,
  };
});

vi.mock("@/components/layout/ConflictNotificationBadge", () => ({
  ConflictNotificationBadge: () => <div data-testid="conflict-badge">Conflict Badge</div>,
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

    await user.click(screen.getByTitle("Toggle menu"));
    await user.click(screen.getByTitle("Notifications"));

    expect(onMenuClick).toHaveBeenCalledTimes(1);
    expect(onNotificationClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByTestId("conflict-badge")).toBeInTheDocument();
  });

  it("menampilkan NotificationDropdown saat showNotificationDropdown=true", () => {
    render(<Header showNotificationDropdown />);

    expect(screen.getByTestId("notification-dropdown")).toBeInTheDocument();
  });
});
