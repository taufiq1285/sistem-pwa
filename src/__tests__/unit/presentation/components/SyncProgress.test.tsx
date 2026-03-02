import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SyncProgress,
  SyncProgressCompact,
} from "@/components/common/SyncProgress";

vi.mock("@/lib/hooks/useSync", () => ({
  useSync: vi.fn(),
}));

const mockUseSync = vi.mocked(await import("@/lib/hooks/useSync")).useSync;

describe("SyncProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tidak merender apapun saat sync belum ready", () => {
    mockUseSync.mockReturnValue({
      stats: null,
      isProcessing: false,
      isReady: false,
    } as any);

    const { container } = render(<SyncProgress />);
    expect(container.firstChild).toBeNull();
  });

  it("menampilkan status proses sinkronisasi", () => {
    mockUseSync.mockReturnValue({
      stats: {
        total: 10,
        pending: 6,
        completed: 4,
        failed: 0,
        syncing: 0,
      },
      isProcessing: true,
      isReady: true,
    } as any);

    render(<SyncProgress />);

    expect(screen.getByText("Menyinkronkan...")).toBeInTheDocument();
    expect(screen.getByText("Syncing")).toBeInTheDocument();
    expect(screen.getByText("4 / 10 selesai")).toBeInTheDocument();
    expect(screen.getByText("6 pending")).toBeInTheDocument();
    expect(screen.getByText("Memproses queue...")).toBeInTheDocument();
  });

  it("menampilkan detail item gagal saat ada failure", () => {
    mockUseSync.mockReturnValue({
      stats: {
        total: 3,
        pending: 0,
        completed: 2,
        failed: 1,
        syncing: 0,
      },
      isProcessing: false,
      isReady: true,
    } as any);

    render(<SyncProgress alwaysShow />);

    expect(
      screen.getByText("1 item gagal (bisa di-retry di admin panel)"),
    ).toBeInTheDocument();
  });
});

describe("SyncProgressCompact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan ringkasan compact ketika sedang processing", () => {
    mockUseSync.mockReturnValue({
      stats: {
        pending: 2,
      },
      isProcessing: true,
      isReady: true,
    } as any);

    render(<SyncProgressCompact />);

    expect(screen.getByText("Syncing 2 items...")).toBeInTheDocument();
  });

  it("tidak merender saat idle tanpa pending", () => {
    mockUseSync.mockReturnValue({
      stats: {
        pending: 0,
      },
      isProcessing: false,
      isReady: true,
    } as any);

    const { container } = render(<SyncProgressCompact />);
    expect(container.firstChild).toBeNull();
  });
});
