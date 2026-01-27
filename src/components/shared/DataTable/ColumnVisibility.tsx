/**
 * Column Visibility Dropdown
 * Allows users to show/hide table columns
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";

interface ColumnVisibilityOption {
  id: string;
  label: string;
  visible: boolean;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnVisibilityOption[];
  onColumnToggle: (columnId: string) => void;
  label?: string;
}

export function ColumnVisibilityDropdown({
  columns,
  onColumnToggle,
  label = "Columns",
}: ColumnVisibilityDropdownProps) {
  const visibleCount = columns.filter((col) => col.visible).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-semibold">
          <Settings2 className="h-4 w-4 mr-2" />
          {label} ({visibleCount}/{columns.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.visible}
            onCheckedChange={() => onColumnToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
