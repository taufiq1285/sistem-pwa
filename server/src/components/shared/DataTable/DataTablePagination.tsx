/**
 * DataTablePagination Component
 * Pagination controls with page navigation and page size selector
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";

// ============================================================================
// TYPES
// ============================================================================

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  showSelectedCount?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 50, 100],
  showSelectedCount = false,
  className,
}: DataTablePaginationProps<TData>) {
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRowsCount = table.getFilteredRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2",
        className,
      )}
    >
      {/* Left Section - Row Info */}
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {/* Selected rows count (if enabled) */}
        {showSelectedCount && selectedRowsCount > 0 && (
          <div className="font-medium">
            {selectedRowsCount} of {totalRowsCount} row(s) selected
          </div>
        )}

        {/* Total rows info */}
        <div>
          Showing {table.getRowModel().rows.length} of {totalRowsCount} results
        </div>
      </div>

      {/* Right Section - Pagination Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          {/* Page info */}
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">Go to first page</span>
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Go to previous page</span>
            </Button>

            {/* Next page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Go to next page</span>
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Go to last page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTablePagination;
