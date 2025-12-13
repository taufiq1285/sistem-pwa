/**
 * useConflicts Hook
 *
 * FASE 3 - Week 4: Manual Conflict Resolution
 * Fetch and manage conflicts from conflict_log table
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

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

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("conflict_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setConflicts(data || []);
    } catch (err) {
      console.error("Error fetching conflicts:", err);
      setError(err as Error);
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
            .from(conflict.table_name)
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
