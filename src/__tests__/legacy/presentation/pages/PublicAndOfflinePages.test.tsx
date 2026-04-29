import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomePage } from "@/pages/public/HomePage";
import OfflinePage from "@/pages/public/OfflinePage";
import MahasiswaOfflineSyncPage from "@/pages/mahasiswa/OfflineSyncPage";

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

vi.mock("@/components/ui/button-enhanced", () => ({
  ButtonEnhanced: ({ asChild, children, leadingIcon, ...props }: any) =>
    asChild ? (
      children
    ) : (
      <button {...props}>
        {leadingIcon}
        {children}
      </button>
    ),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock("@/lib/hooks/useSync", () => ({
  useSync: () => ({
    processQueue: vi.fn().mockResolvedValue(undefined),
    stats: { pending: 0, failed: 0, completed: 0 },
    isProcessing: false,
    isReady: true,
  }),
}));

vi.mock("@/lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => ({
    isOnline: false,
    isOffline: true,
    isUnstable: false,
    status: "offline",
    quality: undefined,
    lastChanged: Date.now(),
    isReady: true,
  }),
}));

vi.mock("@/lib/api/kuis.api", () => ({
  getOfflineAttemptSyncItemsForMahasiswa: vi.fn().mockResolvedValue([]),
  syncPendingOfflineQuizSubmissions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Public + Offline Placeholder Pages", () => {
  it("HomePage menampilkan hero utama dan tombol auth", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /kelola praktikum lebih mudah/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /akademi kebidanan mega buana/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Masuk" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Daftar" })).toBeInTheDocument();
  });

  it("OfflinePage placeholder tampil", () => {
    render(<OfflinePage />);

    expect(screen.getByText(/Anda Sedang Offline/i)).toBeInTheDocument();
  });

  it("Mahasiswa OfflineSyncPage placeholder tampil", () => {
    render(<MahasiswaOfflineSyncPage />);

    expect(screen.getByText(/Sinkronisasi Offline/i)).toBeInTheDocument();
  });
});
