/**
 * Bulk Actions Bar
 * Shows action bar when rows are selected
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, Power, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onSelectAll: () => void;
  actions?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
    confirmMessage?: string;
  }[];
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  isAllSelected,
  isSomeSelected,
  onSelectAll,
  actions = [],
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 mb-4 rounded-lg border bg-muted/50 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isSomeSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all"
        />
        <Badge variant="secondary" className="font-semibold">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={() => {
              if (action.confirmMessage && !confirm(action.confirmMessage)) {
                return;
              }
              action.onClick();
            }}
            className="font-semibold"
          >
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Pre-configured bulk actions for common use cases
export const BulkActions = {
  delete: (onClick: () => void, count?: number) => ({
    label: "Delete",
    icon: Trash2,
    onClick,
    variant: "destructive" as const,
    confirmMessage: `Are you sure you want to delete ${count || ""} ${count === 1 ? "item" : "items"}?`,
  }),

  activate: (onClick: () => void) => ({
    label: "Activate",
    icon: Power,
    onClick,
    variant: "outline" as const,
  }),

  deactivate: (onClick: () => void) => ({
    label: "Deactivate",
    icon: PowerOff,
    onClick,
    variant: "outline" as const,
  }),
};
