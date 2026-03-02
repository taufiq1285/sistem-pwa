import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConflictNotificationBadge } from "@/components/layout/ConflictNotificationBadge";

const mockUseConflicts = vi.fn();
const mockRefreshConflicts = vi.fn();

vi.mock("@/lib/hooks/useConflicts", () => ({
  useConflicts: () => mockUseConflicts(),
}));

vi.mock("@/components/features/sync/ConflictResolver", () => ({
  ConflictResolver: ({ open }: { open: boolean }) =>
    open ? <div data-testid="conflict-resolver">Resolver Open</div> : null,
}));

describe("ConflictNotificationBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConflicts.mockReturnValue({
      pendingConflicts: [],
      refreshConflicts: mockRefreshConflicts,
      loading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tidak render jika tidak ada konflik", () => {
    const { container } = render(<ConflictNotificationBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("render badge konflik dan membuka resolver saat klik", async () => {
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

  it("memanggil refresh otomatis berdasarkan interval", () => {
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
