import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerServiceWorker } from "./lib/pwa/register-sw";
// ❌ DISABLED: Sync Manager tidak dalam scope proposal penelitian
// import { initializeSyncManager } from "./lib/offline/sync-manager";
import { logger } from "@/lib/utils/logger";

// Render app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ============================================================================
// SERVICE WORKER - FORCE CLEAR OLD VERSION FIRST
// ============================================================================

const isDevelopment = import.meta.env.DEV;
const enablePWAInDev = import.meta.env.VITE_PWA_DEV !== "false";

// Flag to prevent handling update multiple times
let updateHandled = false;

/**
 * Check Service Worker version
 * Returns version string or null if unable to determine
 */
async function checkSWVersion(
  registration: ServiceWorkerRegistration,
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!registration.active) {
      resolve(null);
      return;
    }

    const messageChannel = new MessageChannel();
    registration.active.postMessage({ type: "GET_VERSION" }, [
      messageChannel.port2,
    ]);

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data?.version || null);
    };

    // Timeout after 1 second
    setTimeout(() => resolve(null), 1000);
  });
}

/**
 * Force unregister OLD Service Workers only
 * Production-safe: Only unregisters if version mismatch
 */
async function forceUnregisterOldSW(): Promise<void> {
  const TARGET_VERSION = "v1.0.2";

  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (registrations.length === 0) {
        logger.info("[SW Cleanup] No existing Service Workers");
        return;
      }

      logger.info(
        `[SW Cleanup] Checking ${registrations.length} Service Worker(s)`,
      );

      let unregisteredCount = 0;

      for (const registration of registrations) {
        try {
          // Check version first
          const version = await checkSWVersion(registration);

          if (version === TARGET_VERSION) {
            logger.info(`[SW Cleanup] ✅ Current version OK: ${version}`);
            continue; // Skip unregistering current version
          }

          // Old version detected or unable to determine - unregister
          if (version) {
            logger.info(
              `[SW Cleanup] Found old version: ${version} (target: ${TARGET_VERSION})`,
            );
          } else {
            logger.info("[SW Cleanup] Found unversioned SW, will unregister");
          }

          const success = await registration.unregister();
          if (success) {
            logger.info(
              "[SW Cleanup] ✅ Unregistered old SW:",
              registration.scope,
            );
            unregisteredCount++;
          }
        } catch (err) {
          logger.error("[SW Cleanup] ❌ Failed to process registration:", err);
        }
      }

      // Only clear caches if we unregistered something
      if (unregisteredCount > 0) {
        logger.info("[SW Cleanup] Clearing old caches...");
        const cacheNames = await caches.keys();

        for (const cacheName of cacheNames) {
          // Only delete old version caches
          if (!cacheName.includes(TARGET_VERSION.replace("v", ""))) {
            await caches.delete(cacheName);
            logger.info("[SW Cleanup] 🗑️ Deleted old cache:", cacheName);
          }
        }

        logger.info(
          `[SW Cleanup] ✅ Cleanup complete (${unregisteredCount} SW unregistered)`,
        );
      } else {
        logger.info("[SW Cleanup] ✅ No cleanup needed, all SW up to date");
      }
    } catch (error) {
      logger.error("[SW Cleanup] Error during cleanup:", error);
    }
  }
}

if (!isDevelopment || enablePWAInDev) {
  // Enable full SW functionality
  logger.info(
    isDevelopment
      ? "🔧 Development Mode: Service Worker ENABLED for PWA testing"
      : "🚀 Production Mode: Service Worker ENABLED",
  );

  // Force clear old SW first, then register new one
  forceUnregisterOldSW()
    .then(() => {
      logger.info("[SW] Starting fresh registration...");

      // Wait a bit for cleanup to complete
      setTimeout(() => {
        registerServiceWorker({
          onSuccess: (registration) => {
            logger.info("✅ Service Worker registered successfully");
            logger.info("Scope:", registration.scope);

            // ❌ DISABLED: Sync Manager initialization tidak dalam scope proposal
            // initializeSyncManager().catch((error) => {
            //   logger.error("Failed to initialize sync manager:", error);
            // });
          },
          onUpdate: (registration) => {
            // Prevent handling the same update multiple times
            if (updateHandled) {
              logger.info("[SW] Update already handled, skipping...");
              return;
            }

            updateHandled = true;

            logger.info("New service worker version available");
            logger.info("Refresh page to activate new version");

            // Auto-activate update without prompting
            // This will reload the page once via controllerchange event
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
              logger.info("New version will activate on next page load");
            }
          },
          onError: (error) => {
            logger.error("❌ Service Worker registration failed:", error);
          },
          enableAutoUpdate: false, // Disabled to prevent update loops
          checkUpdateInterval: 60 * 60 * 1000, // Check every hour
        });
      }, 500); // Wait 500ms after cleanup
    })
    .catch((error) => {
      logger.error("[SW] Cleanup failed, proceeding anyway:", error);
    });
} else {
  // Development: SW disabled
  logger.info(
    "🔧 Development Mode: Service Worker disabled (set VITE_PWA_DEV=true to enable)",
  );

  // Unregister any existing service workers from previous sessions
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        logger.info("Unregistered old service worker");
      });
    });
  }
}
