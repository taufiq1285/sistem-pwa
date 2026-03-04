import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConflictResolver } from "@/components/features/sync/ConflictResolver";

const mockUseConflicts = vi.fn();
const mockResolveConflict = vi.fn();
const mockRejectConflict = vi.fn();
const mockRefreshConflicts = vi.fn();
const mockGetFieldConflicts = vi.fn();

vi.mock("@/lib/hooks/useConflicts", () => ({
  useConflicts: () => mockUseConflicts(),
}));

vi.mock("@/components/features/sync/ConflictFieldRow", () => ({
  ConflictFieldRow: ({ conflict, selectedWinner, onWinnerChange }: any) => (
    <div>
      <p>{conflict.field}</p>
      <p>{String(conflict.localValue)}</p>
      <p>{String(conflict.remoteValue)}</p>
      <p>{selectedWinner}</p>
      <button onClick={() => onWinnerChange("local")}>pick-local</button>
      <button onClick={() => onWinnerChange("remote")}>pick-remote</button>
    </div>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}));
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

const conflict = {
  id: "c1",
  queue_item_id: null,
  user_id: "u1",
  table_name: "nilai",
  record_id: "r1",
  client_data: { score: 80, note: "lokal" },
  server_data: { score: 90, note: "server" },
  resolution_strategy: "manual",
  resolved_data: null,
  resolved_by: null,
  resolved_at: null,
  created_at: "2025-01-01T10:00:00.000Z",
  local_version: 1,
  remote_version: 2,
  status: "pending" as const,
  winner: null,
};

describe("ConflictResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockResolveConflict.mockResolvedValue(undefined);
    mockRejectConflict.mockResolvedValue(undefined);
    mockRefreshConflicts.mockResolvedValue(undefined);
    mockGetFieldConflicts.mockReturnValue([
      { field: "score", localValue: 80, remoteValue: 90 },
      { field: "note", localValue: "lokal", remoteValue: "server" },
    ]);

    mockUseConflicts.mockReturnValue({
      pendingConflicts: [conflict],
      loading: false,
      error: null,
      resolveConflict: mockResolveConflict,
      rejectConflict: mockRejectConflict,
      getFieldConflicts: mockGetFieldConflicts,
      refreshConflicts: mockRefreshConflicts,
    });
  });

  it("menampilkan loading state", () => {
    mockUseConflicts.mockReturnValue({
      pendingConflicts: [],
      loading: true,
      error: null,
      resolveConflict: mockResolveConflict,
      rejectConflict: mockRejectConflict,
      getFieldConflicts: mockGetFieldConflicts,
      refreshConflicts: mockRefreshConflicts,
    });

    render(<ConflictResolver open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText(/Loading conflicts/i)).toBeInTheDocument();
  });

  it("menampilkan empty state ketika tidak ada conflict", () => {
    mockUseConflicts.mockReturnValue({
      pendingConflicts: [],
      loading: false,
      error: null,
      resolveConflict: mockResolveConflict,
      rejectConflict: mockRejectConflict,
      getFieldConflicts: mockGetFieldConflicts,
      refreshConflicts: mockRefreshConflicts,
    });

    render(<ConflictResolver open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText(/No Conflicts Found/i)).toBeInTheDocument();
  });

  it("menampilkan list conflict lalu bisa masuk ke detail", async () => {
    const user = userEvent.setup();
    render(<ConflictResolver open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText(/Resolve Data Conflicts/i)).toBeInTheDocument();
    expect(screen.getByText(/Grade/i)).toBeInTheDocument();

    await user.click(screen.getByText(/Grade/i));

    await waitFor(() => {
      expect(screen.getByText(/Field by Field/i)).toBeInTheDocument();
      expect(screen.getByText("score")).toBeInTheDocument();
    });
  });

  it("resolve conflict memanggil resolveConflict dengan winner merged", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<ConflictResolver open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByText(/Grade/i));

    await waitFor(() => {
      expect(screen.getByText(/Resolve Conflict/i)).toBeInTheDocument();
    });

    await user.click(screen.getAllByText("pick-local")[0]);
    await user.click(screen.getByRole("button", { name: /Resolve Conflict/i }));

    await waitFor(() => {
      expect(mockResolveConflict).toHaveBeenCalledTimes(1);
      expect(mockResolveConflict.mock.calls[0][0]).toBe("c1");
      expect(mockResolveConflict.mock.calls[0][2]).toBe("merged");
      expect(mockRefreshConflicts).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("reject conflict memanggil rejectConflict", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<ConflictResolver open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByText(/Grade/i));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Reject \(Use Server\)/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Reject \(Use Server\)/i }),
    );

    await waitFor(() => {
      expect(mockRejectConflict).toHaveBeenCalledWith("c1");
      expect(mockRefreshConflicts).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
