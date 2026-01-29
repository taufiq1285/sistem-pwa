/**
 * useConflicts Hook
 *
 * FASE 3 - Week 4: Manual Conflict Resolution
 * Fetch and manage conflicts from conflict_log table
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import { cacheAPI } from "@/lib/offline/api-cache";
import type { CacheEntry } from "@/lib/offline/api-cache";

export interface ConflictData {
  id: string;
  queue_item_id: string | null;
  user_id: string;
  table_name: string;
  record_id: string;
  client_data: any;
  server_data: any;
  resolution_strategy: string;
  resolved_data: any | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  local_version: number | null;
  remote_version: number | null;
  status: "pending" | "resolved" | "rejected";
  winner: "local" | "remote" | "merged" | null;
}

export interface FieldConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  winner?: "local" | "remote";
  reason?: string;
}

interface UseConflictsReturn {
  conflicts: ConflictData[];
  pendingConflicts: ConflictData[];
  loading: boolean;
  error: Error | null;
  refreshConflicts: () => Promise<void>;
  resolveConflict: (
    conflictId: string,
    resolvedData: any,
    winner: "local" | "remote" | "merged",
  ) => Promise<void>;
  rejectConflict: (conflictId: string) => Promise<void>;
  getFieldConflicts: (conflict: ConflictData) => FieldConflict[];
}

export function useConflicts(): UseConflictsReturn {
  const { user } = useAuth();
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch conflicts from database
  const fetchConflicts = useCallback(async () => {
    if (!user) {
      setConflicts([]);
      setLoading(false);
      return;
    }

    // ✅ Check if offline - skip fetch but keep cached data
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    try {
      setLoading(true);
      setError(null);

      // ✅ Use cacheAPI for offline support
      const data = await cacheAPI(
        `conflicts_${user.id}`,
        async () => {
          const { data, error: fetchError } = await supabase
            .from("conflict_log")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (fetchError) throw fetchError;

          return data;
        },
        {
          ttl: 5 * 60 * 1000, // 5 minutes cache
          staleWhileRevalidate: true,
        },
      );

      // Transform database rows to ConflictData interface
      const transformedData: ConflictData[] = (data || []).map((row: any) => ({
        id: row.id,
        queue_item_id: row.queue_item_id,
        user_id: row.user_id,
        table_name: row.table_name,
        record_id: row.record_id,
        client_data: row.client_data,
        server_data: row.remote_data, // remote_data maps to server_data
        resolution_strategy: row.resolution_strategy,
        resolved_data: row.resolved_data,
        resolved_by: row.resolved_by,
        resolved_at: row.resolved_at,
        created_at: row.created_at,
        local_version: row.local_version,
        remote_version: row.remote_version,
        status: row.status,
        winner: row.winner,
      }));

      setConflicts(transformedData);

      if (isOffline) {
        console.log("ℹ️ Offline mode - showing cached conflicts");
      }
    } catch (err) {
      console.error("Error fetching conflicts:", err);

      // ✅ Don't set error in offline mode - it's expected
      if (isOffline) {
        console.log(
          "ℹ️ Offline mode - conflict fetch failed (using cached data if available)",
        );
      } else {
        setError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);

  // Get pending conflicts
  const pendingConflicts = conflicts.filter((c) => c.status === "pending");

  // Refresh conflicts
  const refreshConflicts = useCallback(async () => {
    await fetchConflicts();
  }, [fetchConflicts]);

  // Resolve conflict
  const resolveConflict = useCallback(
    async (
      conflictId: string,
      resolvedData: any,
      winner: "local" | "remote" | "merged",
    ) => {
      if (!user) throw new Error("User not authenticated");

      try {
        // Update conflict_log
        const { error: updateError } = await supabase
          .from("conflict_log")
          .update({
            resolved_data: resolvedData,
            winner,
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
            status: "resolved",
          })
          .eq("id", conflictId)
          .eq("user_id", user.id); // Security: only update own conflicts

        if (updateError) throw updateError;

        // Get the conflict to apply the resolved data
        const conflict = conflicts.find((c) => c.id === conflictId);
        if (conflict) {
          // Apply resolved data to the actual table
          const { error: applyError } = await supabase
            .from(conflict.table_name as any)
            .update(resolvedData)
            .eq("id", conflict.record_id);

          if (applyError) {
            console.warn("Failed to apply resolved data:", applyError);
            // Don't throw - conflict is marked resolved even if apply fails
          }
        }

        // Refresh conflicts list
        await refreshConflicts();
      } catch (err) {
        console.error("Error resolving conflict:", err);
        throw err;
      }
    },
    [user, conflicts, refreshConflicts],
  );

  // Reject conflict (keep remote)
  const rejectConflict = useCallback(
    async (conflictId: string) => {
      if (!user) throw new Error("User not authenticated");

      try {
        const { error: updateError } = await supabase
          .from("conflict_log")
          .update({
            winner: "remote",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
            status: "rejected",
          })
          .eq("id", conflictId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        await refreshConflicts();
      } catch (err) {
        console.error("Error rejecting conflict:", err);
        throw err;
      }
    },
    [user, refreshConflicts],
  );

  // Get field-level conflicts
  const getFieldConflicts = useCallback(
    (conflict: ConflictData): FieldConflict[] => {
      const fieldConflicts: FieldConflict[] = [];
      const local = conflict.client_data || {};
      const remote = conflict.server_data || {};

      // Get all unique fields
      const allFields = new Set([
        ...Object.keys(local),
        ...Object.keys(remote),
      ]);

      for (const field of allFields) {
        const localValue = local[field];
        const remoteValue = remote[field];

        // Skip if identical
        if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
          continue;
        }

        // Skip metadata fields
        if (
          field === "id" ||
          field === "created_at" ||
          field === "updated_at"
        ) {
          continue;
        }

        fieldConflicts.push({
          field,
          localValue,
          remoteValue,
        });
      }

      return fieldConflicts;
    },
    [],
  );

  return {
    conflicts,
    pendingConflicts,
    loading,
    error,
    refreshConflicts,
    resolveConflict,
    rejectConflict,
    getFieldConflicts,
  };
}
