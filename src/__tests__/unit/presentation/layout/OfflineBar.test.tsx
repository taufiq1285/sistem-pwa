import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfflineBar } from "@/components/layout/OfflineBar";

const mockUseNetworkStatus = vi.fn();
const mockUseSyncContext = vi.fn();
const mockProcessQueue = vi.fn();

vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

vi.mock("@/providers/SyncProvider", () => ({
  useSyncContext: () => mockUseSyncContext(),
}));

describe("OfflineBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 0 },
      processQueue: mockProcessQueue,
      isProcessing: false,
    });
  });

  it("menampilkan banner offline dan jumlah pending changes", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false, isOffline: true });
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 2 },
      processQueue: mockProcessQueue,
      isProcessing: false,
    });

    render(<OfflineBar />);

    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
    expect(screen.getByText(/you have 2 unsaved changes/i)).toBeInTheDocument();
  });

  it("menampilkan state online kembali dan proses sync manual", async () => {
    const user = userEvent.setup();

    mockUseNetworkStatus.mockReturnValue({ isOnline: false, isOffline: true });
    mockUseSyncContext.mockReturnValue({
      stats: { pending: 3 },
      processQueue: mockProcessQueue,
      isProcessing: false,
    });

    const { rerender } = render(<OfflineBar />);

    mockUseNetworkStatus.mockReturnValue({ isOnline: true, isOffline: false });
    rerender(<OfflineBar />);

    expect(screen.getByText(/you are back online/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sync now/i }));

    await waitFor(() => {
      expect(mockProcessQueue).toHaveBeenCalledTimes(1);
    });
  });
});
