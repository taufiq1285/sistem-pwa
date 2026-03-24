/**
 * Online-First Authentication Manager (Deprecated / Merged)
 * All functionalities have been merged into offline-auth.ts to break circular dependency chunks.
 */

export {
  recordOnlineLogin,
  getOnlineLoginRecord,
  hasLoggedInOnlineBefore,
  canLoginOffline,
  clearOnlineLoginRecord,
  secureOfflineLogin,
} from "./offline-auth";
