import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseNotifications = vi.fn();

vi.mock("@/providers/NotificationProvider", () => ({
  useNotifications: (...args: unknown[]) => mockUseNotifications(...args),
}));

describe("useNotifications hook alias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should re-export useNotifications from NotificationProvider", async () => {
    const expectedValue = {
      notifications: [{ id: "notif-1", title: "Test" }],
      unreadCount: 1,
      refreshNotifications: vi.fn(),
    };

    mockUseNotifications.mockReturnValue(expectedValue);

    const { useNotifications } = await import("@/lib/hooks/useNotifications");
    const result = useNotifications(undefined as never);

    expect(mockUseNotifications).toHaveBeenCalledTimes(1);
    expect(result).toBe(expectedValue);
  });

  it("should call provider hook and forward invocation", async () => {
    mockUseNotifications.mockReturnValue({ notifications: [] });

    const { useNotifications } = await import("@/lib/hooks/useNotifications");

    useNotifications(undefined as never);

    expect(mockUseNotifications).toHaveBeenCalledWith(undefined);
  });
});
