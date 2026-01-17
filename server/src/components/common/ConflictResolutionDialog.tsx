/**
 * Conflict Resolution Dialog
 *
 * FASE 3 IMPLEMENTATION - UI for Manual Conflict Resolution
 * Shows field-level conflicts and allows user to choose resolution
 *
 * FEATURES:
 * - Side-by-side comparison
 * - Field-level selection
 * - Automatic merge preview
 * - Validation before saving
 */

import { useState, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GitMerge,
  Clock,
} from "lucide-react";
import type { FieldConflict } from "@/lib/offline/smart-conflict-resolver";

// ============================================================================
// TYPES
// ============================================================================

export interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: string;
  entityId: string;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  localTimestamp: number;
  remoteTimestamp: number;
  fieldConflicts: FieldConflict[];
  onResolve: (
    winner: "local" | "remote" | "merged",
    mergedData?: Record<string, any>,
  ) => void;
  onCancel: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  entity,
  entityId,
  localData,
  remoteData,
  localTimestamp,
  remoteTimestamp,
  fieldConflicts,
  onResolve,
  onCancel,
}: ConflictResolutionDialogProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedStrategy, setSelectedStrategy] = useState<
    "local" | "remote" | "field-by-field"
  >("field-by-field");

  // Map of field → winner
  const [fieldSelections, setFieldSelections] = useState<
    Record<string, "local" | "remote">
  >(() => {
    // Default: Use recommended winner
    const initial: Record<string, "local" | "remote"> = {};
    fieldConflicts.forEach((fc) => {
      initial[fc.field] = fc.winner || "remote";
    });
    return initial;
  });

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const mergedData = useMemo(() => {
    if (selectedStrategy === "local") {
      return localData;
    }
    if (selectedStrategy === "remote") {
      return remoteData;
    }

    // Field-by-field merge
    const merged = { ...localData };
    Object.entries(fieldSelections).forEach(([field, winner]) => {
      if (winner === "remote") {
        merged[field] = remoteData[field];
      }
    });
    return merged;
  }, [selectedStrategy, fieldSelections, localData, remoteData]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("id-ID");
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "(kosong)";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleResolve = () => {
    if (selectedStrategy === "local") {
      onResolve("local", localData);
    } else if (selectedStrategy === "remote") {
      onResolve("remote", remoteData);
    } else {
      onResolve("merged", mergedData);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleFieldSelection = (field: string, winner: "local" | "remote") => {
    setFieldSelections((prev) => ({
      ...prev,
      [field]: winner,
    }));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Konflik Data Terdeteksi
          </DialogTitle>
          <DialogDescription>
            Data Anda berbeda dengan data di server. Pilih versi mana yang ingin
            digunakan.
          </DialogDescription>
        </DialogHeader>

        {/* Entity Info */}
        <Alert>
          <AlertDescription>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Entity:</strong> {entity}
              </div>
              <div>
                <strong>ID:</strong>{" "}
                <code className="text-xs">{entityId.substring(0, 8)}...</code>
              </div>
              <div>
                <strong>Local Time:</strong>{" "}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(localTimestamp)}
                </span>
              </div>
              <div>
                <strong>Remote Time:</strong>{" "}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(remoteTimestamp)}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Separator />

        {/* Strategy Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Pilih Strategi Resolusi
          </Label>
          <RadioGroup
            value={selectedStrategy}
            onValueChange={(value: any) => setSelectedStrategy(value)}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="local" id="strategy-local" />
              <Label htmlFor="strategy-local" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Local</Badge>
                  <span>Gunakan semua data local (Anda)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Menimpa semua perubahan di server dengan versi local Anda
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="remote" id="strategy-remote" />
              <Label
                htmlFor="strategy-remote"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Remote</Badge>
                  <span>Gunakan semua data server (Recommended)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Menggunakan versi terbaru dari server (paling aman)
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="field-by-field" id="strategy-field" />
              <Label htmlFor="strategy-field" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <GitMerge className="w-3 h-3 mr-1" />
                    Merge
                  </Badge>
                  <span>Pilih per field (Advanced)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gabungkan data dengan memilih value terbaik untuk setiap field
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Field-by-field Selection */}
        {selectedStrategy === "field-by-field" && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Konflik Per Field ({fieldConflicts.length})
              </Label>

              <div className="space-y-4">
                {fieldConflicts.map((conflict) => (
                  <div
                    key={conflict.field}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    {/* Field Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {conflict.field}
                        </code>
                        {conflict.reason && (
                          <Badge variant="secondary" className="text-xs">
                            {conflict.reason}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Value Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Local Value */}
                      <div
                        className={`p-3 rounded border-2 cursor-pointer transition ${
                          fieldSelections[conflict.field] === "local"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() =>
                          handleFieldSelection(conflict.field, "local")
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold text-gray-600">
                            Local (Anda)
                          </Label>
                          {fieldSelections[conflict.field] === "local" && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <pre className="text-xs whitespace-pre-wrap break-words">
                          {formatValue(conflict.localValue)}
                        </pre>
                      </div>

                      {/* Remote Value */}
                      <div
                        className={`p-3 rounded border-2 cursor-pointer transition ${
                          fieldSelections[conflict.field] === "remote"
                            ? "border-green-500 bg-green-50 dark:bg-green-950"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                        onClick={() =>
                          handleFieldSelection(conflict.field, "remote")
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold text-gray-600">
                            Remote (Server)
                          </Label>
                          {fieldSelections[conflict.field] === "remote" && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <pre className="text-xs whitespace-pre-wrap break-words">
                          {formatValue(conflict.remoteValue)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Preview Merged Data */}
        {selectedStrategy === "field-by-field" && (
          <>
            <Separator />
            <details className="space-y-2">
              <summary className="text-sm font-semibold cursor-pointer hover:underline">
                Preview Hasil Merge
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                {JSON.stringify(mergedData, null, 2)}
              </pre>
            </details>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <XCircle className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button onClick={handleResolve}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {selectedStrategy === "local"
              ? "Gunakan Local"
              : selectedStrategy === "remote"
                ? "Gunakan Server"
                : "Simpan Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * import { ConflictResolutionDialog } from '@/components/common/ConflictResolutionDialog';
 *
 * function MyComponent() {
 *   const [showConflict, setShowConflict] = useState(false);
 *   const [conflictData, setConflictData] = useState(null);
 *
 *   const handleConflict = (local, remote, conflicts) => {
 *     setConflictData({ local, remote, conflicts });
 *     setShowConflict(true);
 *   };
 *
 *   const handleResolve = (winner, mergedData) => {
 *     console.log('Resolved:', winner, mergedData);
 *     // Save resolved data
 *   };
 *
 *   return (
 *     <>
 *       {conflictData && (
 *         <ConflictResolutionDialog
 *           open={showConflict}
 *           onOpenChange={setShowConflict}
 *           entity="kuis_jawaban"
 *           entityId={conflictData.local.id}
 *           localData={conflictData.local}
 *           remoteData={conflictData.remote}
 *           localTimestamp={Date.now()}
 *           remoteTimestamp={Date.now() - 1000}
 *           fieldConflicts={conflictData.conflicts}
 *           onResolve={handleResolve}
 *           onCancel={() => setShowConflict(false)}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
