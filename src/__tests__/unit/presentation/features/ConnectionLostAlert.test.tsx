/**
 * ConnectionLostAlert Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionLostAlert } from "@/components/features/kuis/attempt/ConnectionLostAlert";

const mockUseNetworkStatus = vi.fn();
const mockUseSyncContext = vi.fn();

vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

vi.mock("@/providers/SyncProvider", () => ({
  useSyncContext: () => mockUseSyncContext(),
}));

function buildNetworkStatus(overrides = {}) {
  return {
    isOnline: true,
    isOffline: false,
    isUnstable: false,
    ...overrides,
  };
}

function buildSyncContext(overrides = {}) {
  return {
    stats: { pending: 0, completed: 0, failed: 0, total: 0 },
    isProcessing: false,
    ...overrides,
  };
}

describe("ConnectionLostAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue(buildNetworkStatus());
    mockUseSyncContext.mockReturnValue(buildSyncContext());
  });

  describe("saat online dan stabil", () => {
    it("tidak merender apapun saat online dan tidak ada sync", () => {
      const { container } = render(<ConnectionLostAlert />);
      expect(container.firstChild).toBeNull();
    });

    it("menampilkan sync status saat sedang memproses", () => {
      mockUseSyncContext.mockReturnValue(
        buildSyncContext({
          isProcessing: true,
          stats: { pending: 3, completed: 0, failed: 0, total: 3 },
        }),
      );
      render(<ConnectionLostAlert />);
      expect(
        screen.getByText(/Menyinkronkan 3 jawaban ke server/),
      ).toBeInTheDocument();
    });
  });

  describe("saat offline", () => {
    beforeEach(() => {
      mockUseNetworkStatus.mockReturnValue(
        buildNetworkStatus({ isOnline: false, isOffline: true }),
      );
    });

    it("menampilkan alert offline", () => {
      render(<ConnectionLostAlert />);
      expect(
        screen.getByText("Tidak Ada Koneksi Internet"),
      ).toBeInTheDocument();
    });

    it("menampilkan pesan bahwa jawaban disimpan lokal", () => {
      render(<ConnectionLostAlert />);
      expect(
        screen.getByText(/Jawaban akan disimpan secara lokal/),
      ).toBeInTheDocument();
    });

    it("menampilkan badge pending sync saat ada pending items", () => {
      mockUseSyncContext.mockReturnValue(
        buildSyncContext({
          stats: { pending: 5, completed: 0, failed: 0, total: 5 },
        }),
      );
      render(<ConnectionLostAlert />);
      expect(
        screen.getByText(/5 jawaban menunggu sinkronisasi/),
      ).toBeInTheDocument();
    });

    it("tidak menampilkan sync status saat showSyncStatus=false", () => {
      mockUseSyncContext.mockReturnValue(
        buildSyncContext({
          stats: { pending: 5, completed: 0, failed: 0, total: 5 },
        }),
      );
      render(<ConnectionLostAlert showSyncStatus={false} />);
      expect(screen.queryByText(/5 jawaban/)).not.toBeInTheDocument();
    });
  });

  describe("saat koneksi tidak stabil", () => {
    it("menampilkan alert koneksi tidak stabil", () => {
      mockUseNetworkStatus.mockReturnValue(
        buildNetworkStatus({ isUnstable: true, isOffline: false }),
      );
      render(<ConnectionLostAlert />);
      expect(screen.getByText("Koneksi Tidak Stabil")).toBeInTheDocument();
    });
  });
});
