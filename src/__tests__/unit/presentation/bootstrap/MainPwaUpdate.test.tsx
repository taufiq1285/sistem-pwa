import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registerServiceWorkerMock = vi.fn();
const checkForServiceWorkerUpdateMock = vi.fn().mockResolvedValue(false);
const startSupabaseWarmupMock = vi.fn(() => vi.fn());
const initializeSyncManagerMock = vi.fn().mockResolvedValue(undefined);

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
  skipWaiting: vi.fn(),
  onUpdateAvailable: vi.fn(),
  onUpdateInstalled: vi.fn(),
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
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="root"></div>';
    registerServiceWorkerMock.mockReset();
    checkForServiceWorkerUpdateMock.mockReset();
    checkForServiceWorkerUpdateMock.mockResolvedValue(false);
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
    vi.useRealTimers();
    cleanup();
  });

  it("mendaftarkan service worker saat bootstrap", async () => {
    const postMessage = vi.fn();

    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue({
      waiting: { postMessage, state: "installed" },
      active: { state: "activated" },
    } as unknown as ServiceWorkerRegistration);

    await import("@/main");

    expect(registerServiceWorkerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        swPath: "/sw.js",
        scope: "/",
        enableAutoUpdate: true,
      }),
    );

    window.dispatchEvent(
      new CustomEvent("sw-update-available", {
        detail: {
          registration: {
            waiting: { postMessage, state: "installed" },
            active: { state: "activated" },
          },
        },
      }),
    );

    expect(screen.queryByText("Update Tersedia")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Versi baru aplikasi sudah tersedia."),
    ).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});
