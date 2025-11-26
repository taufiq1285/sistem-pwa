/**
 * Application Configuration
 *
 * Central configuration for the entire application.
 * Contains app metadata, feature flags, API settings, and environment-specific configs.
 */

// ============================================================================
// APP METADATA
// ============================================================================

export const APP_CONFIG = {
  name: 'Sistem Praktikum PWA',
  version: '1.0.0',
  description: 'Progressive Web App untuk Manajemen Praktikum Laboratorium',
  author: 'Your Team Name',

  // App URLs
  urls: {
    base: typeof window !== 'undefined' ? window.location.origin : '',
    api: import.meta.env.VITE_SUPABASE_URL || '',
    cdn: '/assets',
  },
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  // Offline & PWA Features
  offlineMode: true,
  backgroundSync: true,
  pushNotifications: true,
  installPrompt: true,

  // Core Features
  quiz: {
    enabled: true,
    offlineAttempts: true,
    autoSave: true,
    conflictResolution: true,
    maxAttemptsPerQuiz: 3,
  },

  materi: {
    enabled: true,
    offlineDownload: true,
    fileUpload: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },

  peminjaman: {
    enabled: true,
    approvalWorkflow: true,
    overdueNotifications: true,
  },

  reports: {
    enabled: true,
    export: true,
    analytics: true,
  },

  // Debug & Development
  debug: import.meta.env.DEV,
  logging: import.meta.env.DEV ? 'verbose' : 'error',
  performanceMonitoring: true,
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

    // Realtime settings
    realtime: {
      enabled: true,
      channels: ['quiz_updates', 'materi_updates', 'notification_updates'],
    },

    // Auth settings
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },

  // Request settings
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second

  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    perMinutes: 1,
  },
} as const;

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================

export const STORAGE_CONFIG = {
  // LocalStorage keys
  localStorage: {
    theme: 'app-theme',
    language: 'app-language',
    userPreferences: 'app-user-preferences',
    authToken: 'app-auth-token',
    lastSync: 'app-last-sync',
  },

  // SessionStorage keys
  sessionStorage: {
    tempData: 'app-temp-data',
    formDraft: 'app-form-draft',
  },

  // IndexedDB
  indexedDB: {
    name: 'sistem_praktikum_pwa',
    version: 1,
    quota: 100 * 1024 * 1024, // 100MB
  },

  // Cache Storage
  cacheStorage: {
    name: 'sistem-praktikum-cache-v1',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
} as const;

export default {
  APP_CONFIG,
  FEATURES,
  API_CONFIG,
  STORAGE_CONFIG,
};
