import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { logger } from "@/lib/utils/logger";
import {
  checkForServiceWorkerUpdate,
  registerServiceWorker,
  skipWaiting,
} from "@/lib/pwa/register-sw";
import { startSupabaseWarmup } from "@/lib/supabase/warmup";
import { initializeSyncManager } from "@/lib/offline/sync-manager";

// Render app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Start lightweight Supabase warm-up (safe, non-intrusive)
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

// Saat startup offline, tunda init sync manager supaya app shell/auth bisa tampil lebih cepat.
const bootstrapSyncManager = () => {
  initializeSyncManager().catch((error) => {
    logger.warn("⚠️ SyncManager initialization failed (non-fatal):", error);
  });
};

if (navigator.onLine) {
  bootstrapSyncManager();
} else {
  logger.info("⏸️ Deferring SyncManager initialization until connection returns");
  window.addEventListener(
    "online",
    () => {
      bootstrapSyncManager();
    },
    { once: true },
  );
}

// ============================================================================
// PWA SERVICE WORKER REGISTRATION
// ============================================================================

const isDevelopment = import.meta.env.DEV;

if (isDevelopment) {
  logger.info("🔧 Development Mode: PWA enabled for testing");
} else {
  logger.info("🚀 Production Mode: PWA enabled");
}

// Register Service Worker
registerServiceWorker({
  swPath: "/sw.js", // Default path from vite-plugin-pwa
  scope: "/",
  checkUpdateInterval: 5 * 60 * 1000, // ✅ Check every 5 minutes (lebih cepat untuk ujian)
  enableAutoUpdate: true,

  // Called when Service Worker is successfully registered
  onSuccess: async (registration) => {
    logger.info("✅ Service Worker registered successfully", {
      scope: registration.scope,
      active: registration.active?.state,
    });

    // ✅ IMMEDIATE UPDATE CHECK: Cek update segera setelah registrasi
    // Ini memastikan user dapat update terbaru saat pertama buka aplikasi
    const updated = await checkForServiceWorkerUpdate(registration, {
      source: "on-success",
      logOfflineAsInfo: true,
    });

    if (updated) {
      logger.info("🔄 Initial update check completed");
    }
  },

  // Called when a new Service Worker version is available
  onUpdate: (registration) => {
    logger.info("🔄 New Service Worker version available", {
      waiting: registration.waiting?.state,
      active: registration.active?.state,
    });

    // Show update notification to user
    if (isDevelopment) {
      // In development, auto-reload for easier testing
      logger.info("🔧 Dev mode: Auto-reloading for update");
    } else {
      // In production, show notification
      showUpdateAvailableNotification();
    }
  },

  // Called when registration fails
  onError: (error) => {
    logger.error("❌ Service Worker registration failed", error);
  },
});

/**
 * Show update available notification to user
 */
function showUpdateAvailableNotification() {
  // Remove existing notification if any
  const existing = document.getElementById("pwa-update-notification");
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.id = "pwa-update-notification";
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="flex: 1">
      <div style="font-weight: 600; margin-bottom: 4px;">Update Tersedia!</div>
      <div style="font-size: 14px; opacity: 0.9;">Versi baru aplikasi sudah tersedia.</div>
    </div>
    <button id="pwa-update-btn" style="
      background: white;
      color: #667eea;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    ">Update</button>
    <button id="pwa-dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
    ">✕</button>
  `;

  // Add styles for animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Add notification to DOM
  document.body.appendChild(notification);

  // Handle update button click
  document
    .getElementById("pwa-update-btn")
    ?.addEventListener("click", async () => {
      // ✅ PERBAIKAN: Skip waiting dulu untuk mengaktifkan service worker baru
      logger.info("🔄 Activating new service worker...");
      await skipWaiting();
      // skipWaiting akan otomatis reload halaman setelah service worker aktif
    });

  // Handle dismiss button click
  document.getElementById("pwa-dismiss-btn")?.addEventListener("click", () => {
    notification.remove();
  });
}

// Log PWA status
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

// ✅ Cek update setiap kali aplikasi dibuka/difocus kembali
// Ini berguna untuk PWA yang sering dibuka-tutup
if ("serviceWorker" in navigator) {
  window.addEventListener("focus", () => {
    void checkForServiceWorkerUpdate(undefined, {
      source: "focus",
      silentWhenOffline: true,
      logOfflineAsInfo: true,
    });
  });

  // ✅ Juga cek saat visibility berubah (tab aktif lagi)
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
