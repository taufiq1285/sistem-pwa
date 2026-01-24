/**
 * Offline Module Index
 * Exports all offline-related functionality
 */

// Network detection
export { networkDetector } from "./network-detector";
export type { NetworkStatus, NetworkQuality } from "./network-detector";

// Offline authentication
export {
  offlineLogin,
  storeOfflineCredentials,
  storeOfflineSession,
  storeUserData,
  restoreOfflineSession,
  clearOfflineSession,
  clearOfflineCredentials,
  clearAllOfflineAuthData,
  isOfflineLoginAvailable,
  getStoredUserData,
} from "./offline-auth";

// API helper
export {
  isOffline,
  withOfflineFallback,
  withOfflineFallbackAll,
  shouldSkipApiCall,
  logOfflineMode,
  logApiError,
  type OfflineFallback,
} from "./offline-api-helper";
