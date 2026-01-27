/**
 * Row Selection Column Component
 * Checkbox column for table row selection
 */

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface RowSelectionHeaderProps {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function RowSelectionHeader({
  checked,
  indeterminate,
  onCheckedChange,
  className,
}: RowSelectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={onCheckedChange}
        aria-label="Select all rows"
      />
    </div>
  );
}

interface RowSelectionCellProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function RowSelectionCell({
  checked,
  onCheckedChange,
  className,
}: RowSelectionCellProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label="Select row"
      />
    </div>
  );
}
