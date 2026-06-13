import { StrictMode } from "react";
import { createRoot as createReactRoot } from "react-dom/client";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles/tokens.css";
import "./index.css";
import App from "./App.tsx";
import { logger } from "@/lib/utils/logger";
import {
  checkForServiceWorkerUpdate,
  registerServiceWorker,
} from "@/lib/pwa/register-sw";
import { startSupabaseWarmup } from "@/lib/supabase/warmup";
import { initializeSyncManager } from "@/lib/offline/sync-manager";

createReactRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

type IdleCallbackHandle = number;
type IdleCallback = (deadline: {
  didTimeout: boolean;
  timeRemaining: () => number;
}) => void;

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleCallback,
    options?: { timeout?: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

function scheduleIdleTask(
  task: () => void,
  options: { fallbackDelayMs?: number; timeoutMs?: number } = {},
): () => void {
  const { fallbackDelayMs = 1500, timeoutMs = 5000 } = options;
  const windowWithIdleCallback = window as WindowWithIdleCallback;
  let cancelled = false;

  const run = () => {
    if (!cancelled) {
      task();
    }
  };

  if (typeof windowWithIdleCallback.requestIdleCallback === "function") {
    const idleHandle = windowWithIdleCallback.requestIdleCallback(run, {
      timeout: timeoutMs,
    });

    return () => {
      cancelled = true;
      windowWithIdleCallback.cancelIdleCallback?.(idleHandle);
    };
  }

  const timeoutHandle = window.setTimeout(run, fallbackDelayMs);
  return () => {
    cancelled = true;
    window.clearTimeout(timeoutHandle);
  };
}

const isDevelopment = import.meta.env.DEV && import.meta.env.MODE !== "test";

let stopSupabaseWarmup = () => {};
const cancelSupabaseWarmupStart = scheduleIdleTask(() => {
  if (!navigator.onLine) {
    logger.info("Skipping Supabase warm-up on offline startup");
    return;
  }

  stopSupabaseWarmup = startSupabaseWarmup();
});

window.addEventListener(
  "beforeunload",
  () => {
    cancelSupabaseWarmupStart();
    stopSupabaseWarmup();
  },
  { once: true },
);

// ============================================================================
// OFFLINE SYNC MANAGER INITIALIZATION
// ============================================================================

const bootstrapSyncManager = () => {
  initializeSyncManager().catch((error) => {
    logger.warn("SyncManager initialization failed (non-fatal):", error);
  });
};

if (navigator.onLine) {
  scheduleIdleTask(bootstrapSyncManager, {
    fallbackDelayMs: 2500,
    timeoutMs: 8000,
  });
} else {
  logger.info("Deferring SyncManager initialization until connection returns");
  window.addEventListener(
    "online",
    () => {
      scheduleIdleTask(bootstrapSyncManager, {
        fallbackDelayMs: 1500,
        timeoutMs: 5000,
      });
    },
    { once: true },
  );
}

// ============================================================================
// PWA UPDATE BOOTSTRAP
// ============================================================================

if (isDevelopment) {
  logger.info(
    "Development Mode: PWA service worker disabled for faster startup",
  );
} else {
  logger.info("Production Mode: PWA enabled");
}

if (!isDevelopment) {
  scheduleIdleTask(() => {
    registerServiceWorker({
      swPath: "/sw.js",
      scope: "/",
      checkUpdateInterval: 5 * 60 * 1000,
      enableAutoUpdate: true,
      onSuccess: async (registration) => {
        logger.info("Service Worker registered successfully", {
          scope: registration.scope,
          active: registration.active?.state,
        });

        const updated = await checkForServiceWorkerUpdate(registration, {
          source: "on-success",
          logOfflineAsInfo: true,
        });

        if (updated) {
          logger.info("Initial update check completed");
        }
      },
      onError: (error) => {
        logger.error("Service Worker registration failed", error);
      },
    });
  });
}

/**
 * Auto-update when user is idle and there is a waiting service worker.
 */
const IDLE_TIMEOUT_MS = 2 * 60 * 1000;

function setupIdleAutoUpdate(): void {
  if (!("serviceWorker" in navigator)) return;

  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg?.waiting) return;

      logger.info("[SW] User idle - applying waiting update automatically");
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          window.location.reload();
        },
        { once: true },
      );
      window.setTimeout(() => {
        window.location.reload();
      }, 5000);
    }, IDLE_TIMEOUT_MS);
  };

  const ACTIVITY_EVENTS = [
    "click",
    "keydown",
    "scroll",
    "touchstart",
    "mousemove",
  ] as const;

  ACTIVITY_EVENTS.forEach((eventName) =>
    window.addEventListener(eventName, resetTimer, { passive: true }),
  );

  resetTimer();
}

if (!isDevelopment) {
  setupIdleAutoUpdate();
}

// ============================================================================
// BLANK SCREEN RECOVERY
// ============================================================================

if (!isDevelopment && "serviceWorker" in navigator) {
  setTimeout(async () => {
    const root = document.getElementById("root");
    const isBlank =
      !root || root.children.length === 0 || root.innerHTML.trim() === "";
    if (!isBlank) return;

    if (sessionStorage.getItem("sw_blank_recovery_attempted")) return;
    sessionStorage.setItem("sw_blank_recovery_attempted", "1");

    logger.warn("[SW] Blank screen detected, checking for waiting SW...");
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
      logger.warn(
        "[SW] Waiting SW found, forcing update to recover blank screen",
      );
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          window.location.reload();
        },
        { once: true },
      );
      window.setTimeout(() => window.location.reload(), 3000);
    }
  }, 4000);
}

if ("serviceWorker" in navigator) {
  logger.info("Service Worker API supported");
} else {
  logger.warn("Service Worker API not supported in this browser");
}

if ("ononline" in window && "onoffline" in window) {
  logger.info("Online/Offline events supported");
} else {
  logger.warn("Online/Offline events not supported");
}

// ============================================================================
// UPDATE CHECK ON FOCUS/RESUME
// ============================================================================

if (!isDevelopment && "serviceWorker" in navigator) {
  window.addEventListener("focus", () => {
    void checkForServiceWorkerUpdate(undefined, {
      source: "focus",
      silentWhenOffline: true,
      logOfflineAsInfo: true,
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkForServiceWorkerUpdate(undefined, {
        source: "visibilitychange",
        silentWhenOffline: true,
        logOfflineAsInfo: true,
      });
    }
  });
}
