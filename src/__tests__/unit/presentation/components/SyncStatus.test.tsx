import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyncStatus } from "@/components/common/SyncStatus";

vi.mock("@/providers/SyncProvider", () => ({
  useSyncContext: vi.fn(),
}));

vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}));

const mockUseSyncContext = vi.mocked(
  await import("@/providers/SyncProvider"),
).useSyncContext;

const mockUseNetworkStatus = vi.mocked(
  await import("@/lib/hooks/useNetworkStatus"),
).useNetworkStatus;

describe("SyncStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
    } as any);
  });

  it("menampilkan All Synced saat tidak ada pending dan failed", () => {
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 0, failed: 0, completed: 5 },
      isProcessing: false,
    } as any);

    render(<SyncStatus />);

    expect(screen.getByText("All Synced")).toBeInTheDocument();
  });

  it("menampilkan Syncing saat isProcessing true", () => {
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 3, failed: 0, completed: 2 },
      isProcessing: true,
    } as any);

    render(<SyncStatus />);

    expect(screen.getByText("Syncing...")).toBeInTheDocument();
  });

  it("menampilkan Sync Failed saat ada failed item", () => {
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 0, failed: 1, completed: 2 },
      isProcessing: false,
    } as any);

    render(<SyncStatus />);

    expect(screen.getByText("Sync Failed")).toBeInTheDocument();
  });

  it("menampilkan Pending saat ada item pending dan online", () => {
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 4, failed: 0, completed: 1 },
      isProcessing: false,
    } as any);

    render(<SyncStatus />);

    expect(screen.getByText("4 Pending")).toBeInTheDocument();
  });

  it("mode compact tetap merender elemen status", () => {
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 0, failed: 0, completed: 10 },
      isProcessing: false,
    } as any);

    const { container } = render(<SyncStatus compact />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("menyembunyikan label detail saat showDetails=false", () => {
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 0, failed: 0, completed: 10 },
      isProcessing: false,
    } as any);

    render(<SyncStatus showDetails={false} />);

    expect(screen.queryByText("All Synced")).not.toBeInTheDocument();
  });
});
