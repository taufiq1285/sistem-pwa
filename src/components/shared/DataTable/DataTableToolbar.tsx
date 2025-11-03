/**
 * DataTableToolbar Component
 * Toolbar with search, filters, column visibility, and custom actions
 */

import { X, Search, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Table } from '@tanstack/react-table';

// ============================================================================
// TYPES
// ============================================================================

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchable?: boolean;
  searchPlaceholder?: string;
  enableColumnVisibility?: boolean;
  toolbarActions?: React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DataTableToolbar<TData>({
  table,
  searchable = false,
  searchPlaceholder = 'Search...',
  enableColumnVisibility = false,
  toolbarActions,
  className,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || table.getState().globalFilter;

  // Get all columns that can be hidden
  const hidableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide())
    .map((column) => ({
      id: column.id,
      label: column.columnDef.header as string || column.id,
      isVisible: column.getIsVisible(),
    }));

  // Reset all filters
  const handleReset = () => {
    table.resetColumnFilters();
    table.setGlobalFilter('');
  };

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* Left Section - Search & Filters */}
      <div className="flex flex-1 items-center gap-2">
        {/* Global Search */}
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getState().globalFilter as string) ?? ''}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Reset Filters Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right Section - Actions & Column Visibility */}
      <div className="flex items-center gap-2">
        {/* Custom Toolbar Actions */}
        {toolbarActions}

        {/* Column Visibility Toggle */}
        {enableColumnVisibility && hidableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {hidableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.isVisible}
                  onCheckedChange={(value) =>
                    table.getColumn(column.id)?.toggleVisibility(!!value)
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default DataTableToolbar;