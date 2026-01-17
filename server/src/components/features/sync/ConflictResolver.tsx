/**
 * ConflictResolver Component
 *
 * FASE 3 - Week 4: Manual Conflict Resolution UI
 * Purpose: Display and resolve data conflicts between local and server
 * Priority: High
 *
 * Features:
 * - List pending conflicts
 * - Show field-by-field comparison
 * - Allow user to choose winner per field
 * - Preview merged result
 * - Resolve or reject conflicts
 */

import React, { useState } from "react";
import { useConflicts } from "@/lib/hooks/useConflicts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConflictFieldRow } from "./ConflictFieldRow";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import type { ConflictData } from "@/lib/hooks/useConflicts";

interface ConflictResolverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConflictResolver({
  open,
  onOpenChange,
}: ConflictResolverProps) {
  const {
    pendingConflicts,
    loading,
    error,
    resolveConflict,
    rejectConflict,
    getFieldConflicts,
    refreshConflicts,
  } = useConflicts();

  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(
    null,
  );
  const [fieldWinners, setFieldWinners] = useState<
    Record<string, "local" | "remote">
  >({});
  const [resolving, setResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Select a conflict to resolve
  const handleSelectConflict = (conflict: ConflictData) => {
    setSelectedConflict(conflict);
    setResolutionError(null);

    // Initialize field winners (default to remote for safety)
    const fieldConflicts = getFieldConflicts(conflict);
    const initialWinners: Record<string, "local" | "remote"> = {};
    fieldConflicts.forEach((fc) => {
      initialWinners[fc.field] = "remote"; // Safe default
    });
    setFieldWinners(initialWinners);
  };

  // Handle field winner change
  const handleFieldWinnerChange = (
    field: string,
    winner: "local" | "remote",
  ) => {
    setFieldWinners((prev) => ({
      ...prev,
      [field]: winner,
    }));
  };

  // Build merged data from field winners
  const buildMergedData = (): any => {
    if (!selectedConflict) return {};

    const merged: any = {};
    const local = selectedConflict.client_data || {};
    const remote = selectedConflict.server_data || {};

    // Add all fields from both
    const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const field of allFields) {
      const winner = fieldWinners[field];
      if (winner === "local") {
        merged[field] = local[field];
      } else {
        // Default to remote (safer)
        merged[field] = remote[field];
      }
    }

    return merged;
  };

  // Resolve conflict
  const handleResolve = async () => {
    if (!selectedConflict) return;

    try {
      setResolving(true);
      setResolutionError(null);

      const mergedData = buildMergedData();

      // Determine overall winner
      const localCount = Object.values(fieldWinners).filter(
        (w) => w === "local",
      ).length;
      const remoteCount = Object.values(fieldWinners).filter(
        (w) => w === "remote",
      ).length;
      const winner: "local" | "remote" | "merged" =
        localCount === 0 ? "remote" : remoteCount === 0 ? "local" : "merged";

      await resolveConflict(selectedConflict.id, mergedData, winner);

      // Success - close dialog and refresh
      setSelectedConflict(null);
      setFieldWinners({});
      await refreshConflicts();

      // Close if no more conflicts
      if (pendingConflicts.length <= 1) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Error resolving conflict:", err);
      setResolutionError(
        err instanceof Error ? err.message : "Failed to resolve conflict",
      );
    } finally {
      setResolving(false);
    }
  };

  // Reject conflict (use remote)
  const handleReject = async () => {
    if (!selectedConflict) return;

    try {
      setResolving(true);
      setResolutionError(null);

      await rejectConflict(selectedConflict.id);

      setSelectedConflict(null);
      setFieldWinners({});
      await refreshConflicts();

      if (pendingConflicts.length <= 1) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Error rejecting conflict:", err);
      setResolutionError(
        err instanceof Error ? err.message : "Failed to reject conflict",
      );
    } finally {
      setResolving(false);
    }
  };

  // Get entity display name
  const getEntityName = (tableName: string): string => {
    const names: Record<string, string> = {
      attempt_kuis: "Quiz Attempt",
      jawaban: "Quiz Answer",
      nilai: "Grade",
      kehadiran: "Attendance",
      materi: "Material",
      soal: "Question",
    };
    return names[tableName] || tableName;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conflict Resolution</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading conflicts...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conflict Resolution</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load conflicts: {error.message}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (pendingConflicts.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conflict Resolution</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <h3 className="font-semibold">No Conflicts Found</h3>
              <p className="text-sm text-muted-foreground">
                All your data is synchronized successfully!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Resolve Data Conflicts</DialogTitle>
          <DialogDescription>
            {pendingConflicts.length} conflict
            {pendingConflicts.length !== 1 ? "s" : ""} need
            {pendingConflicts.length === 1 ? "s" : ""} your attention
          </DialogDescription>
        </DialogHeader>

        {selectedConflict ? (
          // Conflict Resolution View
          <div className="space-y-4">
            {/* Conflict Info */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {getEntityName(selectedConflict.table_name)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Conflict detected on{" "}
                    {formatTimestamp(selectedConflict.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedConflict.local_version !== null && (
                    <Badge variant="outline">
                      Local v{selectedConflict.local_version}
                    </Badge>
                  )}
                  {selectedConflict.remote_version !== null && (
                    <Badge variant="outline">
                      Server v{selectedConflict.remote_version}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {resolutionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resolutionError}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="fields" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fields">Field by Field</TabsTrigger>
                <TabsTrigger value="preview">Preview Merged</TabsTrigger>
              </TabsList>

              {/* Field-by-field comparison */}
              <TabsContent value="fields" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Choose which value to keep for each field. Blue = Local
                    (your device), Green = Server.
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {getFieldConflicts(selectedConflict).map(
                      (fieldConflict) => (
                        <ConflictFieldRow
                          key={fieldConflict.field}
                          conflict={fieldConflict}
                          selectedWinner={
                            fieldWinners[fieldConflict.field] || "remote"
                          }
                          onWinnerChange={(winner) =>
                            handleFieldWinnerChange(fieldConflict.field, winner)
                          }
                        />
                      ),
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Preview merged result */}
              <TabsContent value="preview">
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This is what will be saved after resolving the conflict.
                    </AlertDescription>
                  </Alert>

                  <ScrollArea className="h-[400px]">
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(buildMergedData(), null, 2)}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedConflict(null)}
                disabled={resolving}
              >
                Back to List
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={resolving}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject (Use Server)
              </Button>
              <Button onClick={handleResolve} disabled={resolving}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {resolving ? "Resolving..." : "Resolve Conflict"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Conflict List View
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {pendingConflicts.map((conflict) => {
                const fieldCount = getFieldConflicts(conflict).length;
                return (
                  <div
                    key={conflict.id}
                    className="border rounded-lg p-4 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSelectConflict(conflict)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">
                          {getEntityName(conflict.table_name)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {fieldCount} field{fieldCount !== 1 ? "s" : ""} in
                          conflict
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(conflict.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {conflict.local_version !== null &&
                          conflict.remote_version !== null && (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                Local v{conflict.local_version}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Server v{conflict.remote_version}
                              </Badge>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {!selectedConflict && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
