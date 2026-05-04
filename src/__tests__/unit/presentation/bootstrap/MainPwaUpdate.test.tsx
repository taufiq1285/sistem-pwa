import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registerServiceWorkerMock = vi.fn();
const checkForServiceWorkerUpdateMock = vi.fn().mockResolvedValue(false);
const skipWaitingMock = vi.fn().mockResolvedValue(undefined);
const startSupabaseWarmupMock = vi.fn(() => vi.fn());
const initializeSyncManagerMock = vi.fn().mockResolvedValue(undefined);

let updateAvailableHandler:
  | ((registration: ServiceWorkerRegistration) => void)
  | null = null;
let updateInstalledHandler: (() => void) | null = null;

vi.mock("@/App", () => ({
  default: () => <div>App Mock</div>,
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/pwa/register-sw", () => ({
  registerServiceWorker: (...args: unknown[]) =>
    registerServiceWorkerMock(...args),
  checkForServiceWorkerUpdate: (...args: unknown[]) =>
    checkForServiceWorkerUpdateMock(...args),
  skipWaiting: (...args: unknown[]) => skipWaitingMock(...args),
  onUpdateAvailable: (
    callback: (registration: ServiceWorkerRegistration) => void,
  ) => {
    updateAvailableHandler = callback;
    return () => {
      updateAvailableHandler = null;
    };
  },
  onUpdateInstalled: (callback: () => void) => {
    updateInstalledHandler = callback;
    return () => {
      updateInstalledHandler = null;
    };
  },
}));

vi.mock("@/lib/supabase/warmup", () => ({
  startSupabaseWarmup: (...args: unknown[]) => startSupabaseWarmupMock(...args),
}));

vi.mock("@/lib/offline/sync-manager", () => ({
  initializeSyncManager: (...args: unknown[]) =>
    initializeSyncManagerMock(...args),
}));

describe("main.tsx PWA update bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    cleanup();
    document.body.innerHTML = '<div id="root"></div>';
    updateAvailableHandler = null;
    updateInstalledHandler = null;
    registerServiceWorkerMock.mockReset();
    checkForServiceWorkerUpdateMock.mockReset();
    checkForServiceWorkerUpdateMock.mockResolvedValue(false);
    skipWaitingMock.mockReset();
    skipWaitingMock.mockResolvedValue(undefined);
    startSupabaseWarmupMock.mockClear();
    initializeSyncManagerMock.mockClear();

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        addEventListener: vi.fn(),
        getRegistration: vi.fn().mockResolvedValue(null),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "location", {
      value: {
        reload: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("mendaftarkan service worker saat bootstrap", async () => {
    await import("@/main");

    expect(registerServiceWorkerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        swPath: "/sw.js",
        scope: "/",
        enableAutoUpdate: true,
      }),
    );
  });

  it("menampilkan prompt update dan mengaktifkan waiting worker", async () => {
    const user = userEvent.setup();
    const postMessage = vi.fn();

    await import("@/main");

    expect(updateAvailableHandler).toBeTypeOf("function");

    updateAvailableHandler?.({
      waiting: { postMessage, state: "installed" },
      active: { state: "activated" },
    } as unknown as ServiceWorkerRegistration);

    await waitFor(() => {
      expect(screen.getByText("Update Tersedia")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Perbarui Sekarang" }));

    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(skipWaitingMock).not.toHaveBeenCalled();
  });

  it("menutup prompt saat update installed event diterima", async () => {
    await import("@/main");

    updateAvailableHandler?.({
      waiting: { postMessage: vi.fn(), state: "installed" },
      active: { state: "activated" },
    } as unknown as ServiceWorkerRegistration);

    await waitFor(() => {
      expect(screen.getByText("Update Tersedia")).toBeInTheDocument();
    });

    updateInstalledHandler?.();

    await waitFor(() => {
      expect(screen.queryByText("Update Tersedia")).not.toBeInTheDocument();
    });
  });
});
