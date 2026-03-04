import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConflictsPage } from "@/pages/mahasiswa/ConflictsPage";

const { mockUseConflicts, mockConflictResolver } = vi.hoisted(() => ({
  mockUseConflicts: vi.fn(),
  mockConflictResolver: vi.fn(({ open }: { open: boolean }) => (
    <div data-testid="conflict-resolver">
      {open ? "resolver-open" : "resolver-closed"}
    </div>
  )),
}));

vi.mock("@/lib/hooks", () => ({
  useConflicts: () => mockUseConflicts(),
}));

vi.mock("@/components/features/sync/ConflictResolver", () => ({
  ConflictResolver: (props: unknown) => (mockConflictResolver as any)(props),
}));

describe("Mahasiswa ConflictsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan statistik konflik dan tombol resolve", () => {
    const refreshConflicts = vi.fn();

    mockUseConflicts.mockReturnValue({
      conflicts: [
        {
          id: "c1",
          status: "pending",
          table_name: "nilai",
          created_at: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "c2",
          status: "resolved",
          table_name: "logbook",
          created_at: "2025-01-02T00:00:00.000Z",
        },
      ],
      pendingConflicts: [
        {
          id: "c1",
          status: "pending",
          table_name: "nilai",
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      loading: false,
      error: null,
      refreshConflicts,
    });

    render(<ConflictsPage />);

    expect(
      screen.getByRole("heading", { name: /Conflict Resolution/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Resolve 1 Pending Conflict/i)).toBeInTheDocument();
    expect(screen.getByText("nilai")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Refresh/i }));
    expect(refreshConflicts).toHaveBeenCalled();
  });

  it("menampilkan empty state saat tidak ada pending conflict", () => {
    mockUseConflicts.mockReturnValue({
      conflicts: [],
      pendingConflicts: [],
      loading: false,
      error: null,
      refreshConflicts: vi.fn(),
    });

    render(<ConflictsPage />);

    expect(screen.getByText(/No Pending Conflicts/i)).toBeInTheDocument();
    expect(
      screen.getByText(/All your data is synchronized successfully/i),
    ).toBeInTheDocument();
  });

  it("membuka resolver dan menampilkan error state", () => {
    mockUseConflicts.mockReturnValue({
      conflicts: [
        {
          id: "c1",
          status: "pending",
          table_name: "jadwal",
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      pendingConflicts: [
        {
          id: "c1",
          status: "pending",
          table_name: "jadwal",
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      loading: false,
      error: new Error("sync failed"),
      refreshConflicts: vi.fn(),
    });

    render(<ConflictsPage />);

    expect(
      screen.getByText(/Failed to load conflicts: sync failed/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Resolve 1 Pending Conflict/i }),
    );
    expect(screen.getByTestId("conflict-resolver")).toHaveTextContent(
      "resolver-open",
    );
  });
});
