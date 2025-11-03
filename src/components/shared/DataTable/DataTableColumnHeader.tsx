/**
 * DataTableColumnHeader Component
 * Sortable column header with visual sort indicators
 */

import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Column } from '@tanstack/react-table';

// ============================================================================
// TYPES
// ============================================================================

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const isSortable = column.getCanSort();
  const isSorted = column.getIsSorted();
  const canHide = column.getCanHide();

  // If not sortable and can't hide, just return title
  if (!isSortable && !canHide) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* Dropdown menu for sort options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {isSortable && (
              <>
                {isSorted === 'desc' ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : isSorted === 'asc' ? (
                  <ArrowUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="ml-2 h-4 w-4" />
                )}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {/* Sort Ascending */}
          {isSortable && (
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Asc
            </DropdownMenuItem>
          )}

          {/* Sort Descending */}
          {isSortable && (
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Desc
            </DropdownMenuItem>
          )}

          {/* Separator */}
          {isSortable && canHide && <DropdownMenuSeparator />}

          {/* Hide Column */}
          {canHide && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Hide
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default DataTableColumnHeader;