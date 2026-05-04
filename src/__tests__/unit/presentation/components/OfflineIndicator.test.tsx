import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";

const mockUseNetworkStatus = vi.fn();

vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

describe("OfflineIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tidak tampil saat online dan hideWhenOnline aktif", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      status: "online",
      quality: { effectiveType: "4g", latency: 40 },
    });

    render(<OfflineIndicator />);

    expect(screen.queryByText(/Mode Offline/i)).not.toBeInTheDocument();
  });

  it("menampilkan copy offline berbahasa Indonesia saat offline", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      status: "offline",
      quality: null,
    });

    render(<OfflineIndicator />);

    expect(screen.getByText("Mode Offline")).toBeInTheDocument();
    expect(
      screen.getByText("Snapshot lokal aktif di perangkat ini"),
    ).toBeInTheDocument();
  });

  it("menampilkan status koneksi tidak stabil saat jaringan buruk", () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      status: "unstable",
      quality: { effectiveType: "3g", latency: 800 },
    });

    render(<OfflineIndicator hideWhenOnline={false} />);

    expect(screen.getByText("Koneksi Tidak Stabil")).toBeInTheDocument();
    expect(
      screen.getByText("Beberapa sinkronisasi mungkin tertunda"),
    ).toBeInTheDocument();
  });
});
