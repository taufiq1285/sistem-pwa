/**
 * ConflictFieldRow Component
 *
 * FASE 3 - Week 4: Display single field conflict
 * Shows local vs remote value with choice radio buttons
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import type { FieldConflict } from "@/lib/hooks/useConflicts";

interface ConflictFieldRowProps {
  conflict: FieldConflict;
  selectedWinner: "local" | "remote";
  onWinnerChange: (winner: "local" | "remote") => void;
}

export function ConflictFieldRow({
  conflict,
  selectedWinner,
  onWinnerChange,
}: ConflictFieldRowProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "(empty)";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return String(value);
  };

  const getFieldLabel = (field: string): string => {
    // Convert snake_case to Title Case
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-base">
          {getFieldLabel(conflict.field)}
        </Label>
        <Badge variant="outline" className="text-xs">
          {conflict.field}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Local Value */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Local (Your Device)
            </Label>
            <Badge
              variant={selectedWinner === "local" ? "default" : "outline"}
              className="text-xs"
            >
              {selectedWinner === "local" ? "Selected" : ""}
            </Badge>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
            <pre className="text-sm whitespace-pre-wrap break-words">
              {formatValue(conflict.localValue)}
            </pre>
          </div>
        </div>

        {/* Remote Value */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Remote (Server)
            </Label>
            <Badge
              variant={selectedWinner === "remote" ? "default" : "outline"}
              className="text-xs"
            >
              {selectedWinner === "remote" ? "Selected" : ""}
            </Badge>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded border border-green-200 dark:border-green-800">
            <pre className="text-sm whitespace-pre-wrap break-words">
              {formatValue(conflict.remoteValue)}
            </pre>
          </div>
        </div>
      </div>

      {/* Choice Radio Buttons */}
      <RadioGroup
        value={selectedWinner}
        onValueChange={(value) => onWinnerChange(value as "local" | "remote")}
        className="flex gap-4 pt-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="local" id={`${conflict.field}-local`} />
          <Label
            htmlFor={`${conflict.field}-local`}
            className="cursor-pointer font-normal"
          >
            Use Local
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="remote" id={`${conflict.field}-remote`} />
          <Label
            htmlFor={`${conflict.field}-remote`}
            className="cursor-pointer font-normal"
          >
            Use Remote
          </Label>
        </div>
      </RadioGroup>

      {conflict.reason && (
        <div className="text-xs text-muted-foreground italic pt-1">
          💡 {conflict.reason}
        </div>
      )}
    </div>
  );
}
