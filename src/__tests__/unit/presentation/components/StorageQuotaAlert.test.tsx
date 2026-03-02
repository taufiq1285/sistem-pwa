import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StorageQuotaAlert } from "@/components/common/StorageQuotaAlert";

vi.mock("@/lib/hooks/useSync", () => ({
  useSync: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseSync = vi.mocked(await import("@/lib/hooks/useSync")).useSync;
const mockToast = vi.mocked(await import("sonner")).toast;

describe("StorageQuotaAlert", () => {
  const originalStorage = navigator.storage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSync.mockReturnValue({
      clearCompleted: vi.fn().mockResolvedValue(3),
    } as any);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: originalStorage,
    });
  });

  it("tidak merender saat storage API tidak didukung", async () => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: undefined,
    });

    const { container } = render(<StorageQuotaAlert alwaysShow />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("menampilkan warning saat usage melewati threshold", async () => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: 90,
          quota: 100,
        }),
      },
    });

    render(<StorageQuotaAlert warningThreshold={80} />);

    expect(await screen.findByText("Storage Hampir Penuh")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("mode compact menampilkan persentase penggunaan", async () => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: 50,
          quota: 100,
        }),
      },
    });

    render(<StorageQuotaAlert compact alwaysShow />);

    expect(await screen.findByText("50% used")).toBeInTheDocument();
  });

  it("menjalankan clear queue dan menampilkan toast sukses", async () => {
    const clearCompleted = vi.fn().mockResolvedValue(5);
    mockUseSync.mockReturnValue({ clearCompleted } as any);

    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: vi
          .fn()
          .mockResolvedValueOnce({ usage: 85, quota: 100 })
          .mockResolvedValueOnce({ usage: 70, quota: 100 }),
      },
    });

    render(<StorageQuotaAlert warningThreshold={80} />);

    const clearBtn = await screen.findByRole("button", {
      name: "Bersihkan Sync Queue",
    });

    await userEvent.click(clearBtn);

    await waitFor(() => {
      expect(clearCompleted).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith(
        "5 sync items dihapus. Storage diperbarui.",
      );
    });
  });
});
