/**
 * Centralized Hooks Export
 * Re-exports all custom hooks for easy importing
 */

export { useAuth } from "./useAuth";
export { useAutoSave } from "./useAutoSave";
export { useDebounce } from "./useDebounce";
export { useLocalData } from "./useLocalData";
export { useLocalStorage } from "./useLocalStorage";
export { useNetworkStatus } from "./useNetworkStatus";
export { useNotification } from "./useNotification";
export {
  useNotificationPolling,
  useAutoNotifications,
} from "./useNotificationPolling";
export { useOffline } from "./useOffline";
export { usePdfBlobUrl } from "./usePdfBlobUrl";
export { useRole } from "./useRole";
export { useSupabase } from "./useSupabase";
export { useSignedUrl } from "./useSignedUrl";
export { useSync } from "./useSync";
export { useTheme } from "./useTheme";
export { useConflicts } from "./useConflicts";

// Export types
export type { ConflictData, FieldConflict } from "./useConflicts";
