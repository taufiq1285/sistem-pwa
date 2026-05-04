import { StrictMode } from "react";
import { createRoot as createReactRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { logger } from "@/lib/utils/logger";
import {
  checkForServiceWorkerUpdate,
  onUpdateAvailable,
  onUpdateInstalled,
  registerServiceWorker,
  skipWaiting,
} from "@/lib/pwa/register-sw";
import { startSupabaseWarmup } from "@/lib/supabase/warmup";
import { initializeSyncManager } from "@/lib/offline/sync-manager";
import { UpdatePrompt } from "@/components/common/UpdatePrompt";

createReactRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const shouldRunSupabaseWarmup = navigator.onLine;
const stopSupabaseWarmup = shouldRunSupabaseWarmup
  ? startSupabaseWarmup()
  : () => {};

if (!shouldRunSupabaseWarmup) {
  logger.info("⏸️ Skipping Supabase warm-up on offline startup");
}

window.addEventListener(
  "beforeunload",
  () => {
    stopSupabaseWarmup();
  },
  { once: true },
);

// ============================================================================
// OFFLINE SYNC MANAGER INITIALIZATION
// ============================================================================

const bootstrapSyncManager = () => {
  initializeSyncManager().catch((error) => {
    logger.warn("⚠️ SyncManager initialization failed (non-fatal):", error);
  });
};

if (navigator.onLine) {
  bootstrapSyncManager();
} else {
  logger.info(
    "⏸️ Deferring SyncManager initialization until connection returns",
  );
  window.addEventListener(
    "online",
    () => {
      bootstrapSyncManager();
    },
    { once: true },
  );
}

// ============================================================================
// PWA UPDATE PROMPT
// ============================================================================

const isDevelopment = import.meta.env.DEV && import.meta.env.MODE !== "test";

if (isDevelopment) {
  logger.info("🔧 Development Mode: PWA enabled for testing");
} else {
  logger.info("🚀 Production Mode: PWA enabled");
}

const updatePromptContainer = document.createElement("div");
updatePromptContainer.id = "pwa-update-root";
document.body.appendChild(updatePromptContainer);

const updatePromptRoot = createReactRoot(updatePromptContainer);
let updateRegistration: ServiceWorkerRegistration | null = null;
let updatePromptOpen = false;
let updatePromptUpdating = false;

function renderUpdatePrompt() {
  updatePromptRoot.render(
    <UpdatePrompt
      open={updatePromptOpen && !isDevelopment}
      isUpdating={updatePromptUpdating}
      onDismiss={() => {
        updatePromptOpen = false;
        updatePromptUpdating = false;
        renderUpdatePrompt();
      }}
      onUpdate={async () => {
        updatePromptUpdating = true;
        renderUpdatePrompt();

        logger.info("🔄 Activating new service worker...");

        try {
          if (updateRegistration?.waiting) {
            updateRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
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
            return;
          }

          await skipWaiting();
        } catch (error) {
          updatePromptUpdating = false;
          logger.error("❌ Failed to activate new service worker", error);
          renderUpdatePrompt();
        }
      }}
    />,
  );
}

renderUpdatePrompt();

onUpdateAvailable((registration) => {
  logger.info("🔄 New Service Worker version available", {
    waiting: registration.waiting?.state,
    active: registration.active?.state,
  });

  updateRegistration = registration;
  updatePromptOpen = true;
  updatePromptUpdating = false;
  renderUpdatePrompt();
});

onUpdateInstalled(() => {
  updateRegistration = null;
  updatePromptOpen = false;
  updatePromptUpdating = false;
  renderUpdatePrompt();
});

// Register Service Worker
registerServiceWorker({
  swPath: "/sw.js",
  scope: "/",
  checkUpdateInterval: 5 * 60 * 1000,
  enableAutoUpdate: true,
  onSuccess: async (registration) => {
    logger.info("✅ Service Worker registered successfully", {
      scope: registration.scope,
      active: registration.active?.state,
    });

    const updated = await checkForServiceWorkerUpdate(registration, {
      source: "on-success",
      logOfflineAsInfo: true,
    });

    if (updated) {
      logger.info("🔄 Initial update check completed");
    }
  },
  onError: (error) => {
    logger.error("❌ Service Worker registration failed", error);
  },
});

/**
 * Auto-update when user is idle (no activity for IDLE_TIMEOUT ms)
 * and there is a waiting service worker.
 *
 * Safe: does NOT fire during active input events (click, keydown, scroll, touchstart).
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

      logger.info("[SW] User idle — applying waiting update automatically");
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

setupIdleAutoUpdate();

// ============================================================================
// BLANK SCREEN RECOVERY
// ============================================================================

if ("serviceWorker" in navigator) {
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
  logger.info("✅ Service Worker API supported");
} else {
  logger.warn("⚠️ Service Worker API not supported in this browser");
}

if ("ononline" in window && "onoffline" in window) {
  logger.info("✅ Online/Offline events supported");
} else {
  logger.warn("⚠️ Online/Offline events not supported");
}

// ============================================================================
// UPDATE CHECK ON FOCUS/RESUME
// ============================================================================

if ("serviceWorker" in navigator) {
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
