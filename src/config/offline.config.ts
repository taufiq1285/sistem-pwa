/**
 * Offline Configuration
 */

import type { StoreName } from "@/types/offline.types";

export const OFFLINE_CONFIG = {
  enabled: true,
  showIndicator: true,
  autoSyncOnReconnect: true,
  notifyOnOffline: true,
  notifyOnOnline: true,
} as const;

export const SYNC_CONFIG = {
  autoSync: {
    enabled: true,
    interval: 30000,
    onlyWhenOnline: true,
  },
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
  },
  batch: {
    enabled: true,
    maxBatchSize: 50,
    batchDelayMs: 5000,
  },
  priority: {
    high: ["kuis_jawaban", "offline_answers"],
    medium: ["kuis", "materi"],
    low: ["metadata"],
  },
  conflictResolution: {
    strategy: "last-write-wins" as const,
    promptUser: false,
  },
} as const;

export const INDEXEDDB_CONFIG = {
  dbName: "sistem_praktikum_pwa",
  version: 1,
  quota: {
    target: 100 * 1024 * 1024,
    warning: 80 * 1024 * 1024,
    critical: 95 * 1024 * 1024,
  },
  cleanup: {
    enabled: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    runOnStartup: true,
    runInterval: 24 * 60 * 60 * 1000,
  },
} as const;

export const CACHE_CONFIG = {
  name: "sistem-praktikum-cache-v1",
  strategies: {
    static: {
      strategy: "cache-first" as const,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      maxEntries: 100,
    },
    api: {
      strategy: "network-first" as const,
      maxAge: 5 * 60 * 1000,
      maxEntries: 50,
      timeout: 5000,
    },
    images: {
      strategy: "cache-first" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      maxEntries: 60,
    },
  },
  precache: ["/", "/index.html", "/manifest.json", "/logo.svg", "/offline"],
} as const;

export const NETWORK_CONFIG = {
  checkQuality: false, // Disabled to avoid 500 errors - no /api/ping endpoint
  pingUrl: "/api/ping",
  pingInterval: 30000,
  quality: {
    good: 100,
    moderate: 500,
    poor: 1000,
  },
  throttleOnPoorNetwork: true,
  offlineDetection: {
    enabled: true,
    checkOnFocus: true,
    checkOnVisibilityChange: true,
  },
} as const;

export const BACKGROUND_SYNC_CONFIG = {
  enabled: true,
  tags: {
    quizAnswers: "sync-quiz-answers",
    offlineData: "sync-offline-data",
    periodic: "sync-periodic",
  },
  retry: {
    enabled: true,
    maxRetries: 3,
    initialDelay: 1000,
  },
} as const;

export const PERSISTENCE_CONFIG = {
  persist: {
    kuis: {
      enabled: true,
      stores: ["kuis", "kuis_soal"] as StoreName[],
      expiryDays: 7,
    },
    attempts: {
      enabled: true,
      stores: [
        "kuis_jawaban",
        "offline_answers",
        "offline_attempts",
      ] as StoreName[],
      expiryDays: 30,
    },
    materi: {
      enabled: true,
      stores: ["materi"] as StoreName[],
      expiryDays: 30,
    },
    userData: {
      enabled: true,
      stores: ["users", "kelas"] as StoreName[],
      expiryDays: 7,
    },
  },
  autoCleanup: true,
} as const;

export default {
  OFFLINE_CONFIG,
  SYNC_CONFIG,
  INDEXEDDB_CONFIG,
  CACHE_CONFIG,
  NETWORK_CONFIG,
  BACKGROUND_SYNC_CONFIG,
  PERSISTENCE_CONFIG,
};
