/**
 * Versioned Update API
 *
 * FASE 3 - Week 4: Optimistic Locking Integration
 * Provides safe update functions with version checking
 */

import { supabase } from "@/lib/supabase/client";
import { smartConflictResolver } from "@/lib/offline/smart-conflict-resolver";

export interface VersionedUpdateResult<T = any> {
  success: boolean;
  data?: T;
  newVersion?: number;
  error?: string;
  conflict?: {
    local: any;
    remote: any;
    localVersion: number;
    remoteVersion: number;
  };
}

/**
 * Safe update with version checking using RPC function
 *
 * @param tableName - Table to update
 * @param id - Record ID
 * @param expectedVersion - Expected version from local data
 * @param updates - Data to update
 * @returns Result with success status, new version, or conflict info
 */
export async function safeUpdateWithVersion<T = any>(
  tableName: string,
  id: string,
  expectedVersion: number,
  updates: Partial<T>,
): Promise<VersionedUpdateResult<T>> {
  try {
    // Call the database function
    const { data, error } = await supabase.rpc("safe_update_with_version", {
      p_table_name: tableName,
      p_id: id,
      p_expected_version: expectedVersion,
      p_data: updates as any,
    });

    if (error) {
      console.error("[VersionedUpdate] RPC Error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Cast result to proper type
    const result = (Array.isArray(data) ? data[0] : data) as {
      success: boolean;
      new_version: number;
      error: string | null;
    } | null;

    if (!result || !result.success) {
      // Version conflict detected
      console.warn("[VersionedUpdate] Version conflict detected", {
        table: tableName,
        id,
        expected: expectedVersion,
        error: result?.error,
      });

      // Fetch current remote data
      const { data: remoteData, error: fetchError } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !remoteData) {
        return {
          success: false,
          error:
            result?.error || "Version conflict and failed to fetch remote data",
        };
      }

      return {
        success: false,
        error: result?.error || undefined,
        conflict: {
          local: updates,
          remote: remoteData,
          localVersion: expectedVersion,
          remoteVersion: result?.new_version || 0,
        },
      };
    }

    // Success
    return {
      success: true,
      newVersion: result.new_version,
      data: updates as T,
    };
  } catch (err) {
    console.error("[VersionedUpdate] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Update with automatic conflict resolution
 *
 * Uses smart conflict resolver to handle conflicts automatically
 * Falls back to LWW if no business rule applies
 *
 * @param tableName - Table to update
 * @param id - Record ID
 * @param expectedVersion - Expected version
 * @param updates - Data to update
 * @param localTimestamp - Timestamp of local change
 * @returns Result with resolved data
 */
export async function updateWithAutoResolve<T = any>(
  tableName: string,
  id: string,
  expectedVersion: number,
  updates: Partial<T>,
  localTimestamp?: string | number,
): Promise<VersionedUpdateResult<T>> {
  // Try safe update first
  const result = await safeUpdateWithVersion<T>(
    tableName,
    id,
    expectedVersion,
    updates,
  );

  // If no conflict, return success
  if (result.success) {
    return result;
  }

  // If conflict, use smart resolver
  if (result.conflict) {
    console.log(
      "[VersionedUpdate] Auto-resolving conflict with smart resolver",
    );

    const resolution = smartConflictResolver.resolve({
      dataType: tableName,
      id,
      local: result.conflict.local,
      remote: result.conflict.remote,
      localTimestamp: localTimestamp || Date.now(),
      remoteTimestamp: result.conflict.remote.updated_at || Date.now(),
    });

    // Apply resolved data
    if (resolution.data) {
      // Direct update (no version check this time, we already resolved)
      const { data: updatedData, error: updateError } = await supabase
        .from(tableName as any)
        .update(resolution.data)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          error: updateError.message,
        };
      }

      return {
        success: true,
        data: updatedData as T,
        newVersion: (updatedData as any)?._version || 0,
      };
    }
  }

  // Return original error if can't resolve
  return result;
}

/**
 * Update with conflict logging for manual resolution
 *
 * If version conflict occurs, logs to conflict_log table
 * User must manually resolve via ConflictResolver UI
 *
 * @param tableName - Table to update
 * @param id - Record ID
 * @param expectedVersion - Expected version
 * @param updates - Data to update
 * @returns Result with conflict logged
 */
export async function updateWithConflictLog<T = any>(
  tableName: string,
  id: string,
  expectedVersion: number,
  updates: Partial<T>,
): Promise<VersionedUpdateResult<T>> {
  const result = await safeUpdateWithVersion<T>(
    tableName,
    id,
    expectedVersion,
    updates,
  );

  // If no conflict, return success
  if (result.success) {
    return result;
  }

  // If conflict, log it
  if (result.conflict) {
    console.log("[VersionedUpdate] Logging conflict for manual resolution");

    try {
      const { error: logError } = await supabase.rpc("log_conflict", {
        p_entity: tableName,
        p_record_id: id,
        p_local_version: result.conflict.localVersion,
        p_remote_version: result.conflict.remoteVersion,
        p_local_data: result.conflict.local,
        p_remote_data: result.conflict.remote,
      });

      if (logError) {
        console.error("[VersionedUpdate] Failed to log conflict:", logError);
      } else {
        console.log("[VersionedUpdate] Conflict logged successfully");
      }
    } catch (err) {
      console.error("[VersionedUpdate] Error logging conflict:", err);
    }
  }

  return result;
}

/**
 * Check version conflict before update
 *
 * Useful for showing warning to user before attempting update
 *
 * @param tableName - Table to check
 * @param id - Record ID
 * @param expectedVersion - Expected version
 * @returns Conflict check result
 */
export async function checkVersionConflict(
  tableName: string,
  id: string,
  expectedVersion: number,
): Promise<{
  hasConflict: boolean;
  currentVersion?: number;
  message?: string;
}> {
  try {
    const { data, error } = await supabase.rpc("check_version_conflict", {
      p_table_name: tableName,
      p_id: id,
      p_expected_version: expectedVersion,
    });

    if (error) {
      console.error("[VersionedUpdate] Check conflict error:", error);
      return {
        hasConflict: true,
        message: error.message,
      };
    }

    const result = (Array.isArray(data) ? data[0] : data) as {
      has_conflict: boolean;
      current_version: number;
      message: string;
    } | null;

    return {
      hasConflict: result?.has_conflict || false,
      currentVersion: result?.current_version,
      message: result?.message,
    };
  } catch (err) {
    console.error("[VersionedUpdate] Check conflict exception:", err);
    return {
      hasConflict: true,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Helper: Extract version from data
 */
export function getVersion(data: any): number {
  return data?._version || data?.version || 1;
}

/**
 * Helper: Add version to data
 */
export function withVersion<T>(
  data: T,
  version: number,
): T & { _version: number } {
  return {
    ...data,
    _version: version,
  };
}
