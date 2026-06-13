/**
 * DataTable Component
 * Generic reusable data table with sorting, filtering, pagination, and column visibility
 */

// PERBAIKAN: Impor useEffect
import { useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableToolbar } from "./DataTableToolbar";
import type { DataTableProps, DataTableState } from "./DataTable.types";

// ============================================================================
// COMPONENT
// ============================================================================

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
  showPagination = true,
  searchable = false,
  searchPlaceholder = "Search...",
  enableRowSelection = false,
  onRowSelectionChange,
  enableColumnVisibility = false,
  hiddenColumns = [],
  showToolbar = true,
  toolbarActions,
  className,
  isLoading = false,
  emptyMessage = "No data available",
}: DataTableProps<TData, TValue>) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [sorting, setSorting] = useState<DataTableState["sorting"]>([]);
  const [columnFilters, setColumnFilters] = useState<
    DataTableState["columnFilters"]
  >([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<
    DataTableState["rowSelection"]
  >({});

  // Initialize column visibility with hidden columns
  const [columnVisibility, setColumnVisibility] = useState<
    DataTableState["columnVisibility"]
  >(() => {
    const visibility: DataTableState["columnVisibility"] = {};
    hiddenColumns.forEach((columnId) => {
      visibility[columnId] = false;
    });
    return visibility;
  });

  // ============================================================================
  // TABLE INSTANCE
  // ============================================================================

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Notify parent of row selection changes
  // PERBAIKAN: Menggunakan useEffect untuk side-effect dan memperbaiki dependensi
  useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [onRowSelectionChange, enableRowSelection, table]); // 'rowSelection' dihapus krn sdh ter-cover 'table'

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, rIndex) => (
        <TableRow key={rIndex}>
          {columns.map((_, cIndex) => {
            const widths = [
              "w-[60%]",
              "w-[80%]",
              "w-[50%]",
              "w-[70%]",
              "w-[40%]",
            ];
            const widthClass = widths[cIndex % widths.length];
            return (
              <TableCell key={cIndex} className="p-4">
                <div
                  className={cn("skeleton-shimmer h-4 rounded-xs", widthClass)}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ));
    }

    if (table.getRowModel().rows?.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">{emptyMessage}</p>
              {(globalFilter || columnFilters.length > 0) && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((row) => (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() && "selected"}
        className="hover:bg-muted/50"
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {showToolbar && (
        <DataTableToolbar
          table={table}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          enableColumnVisibility={enableColumnVisibility}
          toolbarActions={toolbarActions}
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableCaption className="sr-only">
            Tabel data dengan fitur sortir, filter, dan paginasi.
          </TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortState = header.column.getIsSorted();
                  const ariaSort =
                    sortState === "asc"
                      ? "ascending"
                      : sortState === "desc"
                        ? "descending"
                        : "none";

                  return (
                    <TableHead key={header.id} aria-sort={ariaSort}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          showSelectedCount={enableRowSelection}
        />
      )}
    </div>
  );
}

export default DataTable;
