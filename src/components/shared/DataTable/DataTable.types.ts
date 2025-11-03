/**
 * DataTable Types & Interfaces
 * Type definitions for generic DataTable component
 */

import type { 
  ColumnDef, 
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
  RowSelectionState
} from '@tanstack/react-table';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Generic DataTable Props
 */
export interface DataTableProps<TData, TValue = unknown> {
  // Required
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  
  // Optional - Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
  
  // Optional - Filtering
  searchable?: boolean;
  searchPlaceholder?: string;
  filterableColumns?: FilterableColumn<TData>[];
  
  // Optional - Selection
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  
  // Optional - Visibility
  enableColumnVisibility?: boolean;
  hiddenColumns?: string[];
  
  // Optional - Toolbar
  showToolbar?: boolean;
  toolbarActions?: React.ReactNode;
  
  // Optional - Styling
  className?: string;
  
  // Optional - Loading & Empty States
  isLoading?: boolean;
  emptyMessage?: string;
}

// ============================================================================
// COLUMN TYPES
// ============================================================================

/**
 * Filterable Column Configuration
 */
export interface FilterableColumn<TData> {
  id: string;
  title: string;
  options?: FilterOption[];
  // For custom filter components
  filterFn?: (row: TData, columnId: string, filterValue: unknown) => boolean;
}

/**
 * Filter Option for Select/Checkbox Filters
 */
export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// TABLE STATE TYPES
// ============================================================================

/**
 * Complete Table State
 */
export interface DataTableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  globalFilter: string;
}

/**
 * Table Config for Persistence
 */
export interface DataTableConfig {
  pageSize: number;
  columnVisibility: VisibilityState;
  columnOrder?: string[];
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination Props
 */
export interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

// ============================================================================
// TOOLBAR TYPES
// ============================================================================

/**
 * Toolbar Props
 */
export interface DataTableToolbarProps<TData> {
  // Search
  searchable?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filterableColumns?: FilterableColumn<TData>[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  
  // Column Visibility
  enableColumnVisibility?: boolean;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  allColumns: Array<{
    id: string;
    label: string;
    canHide: boolean;
  }>;
  
  // Custom Actions
  toolbarActions?: React.ReactNode;
  
  // Reset
  onReset?: () => void;
}

// ============================================================================
// COLUMN HEADER TYPES
// ============================================================================

/**
 * Sortable Column Header Props
 */
export interface DataTableColumnHeaderProps {
  column: {
    id: string;
    getIsSorted: () => false | 'asc' | 'desc';
    toggleSorting: (desc?: boolean) => void;
    getCanSort: () => boolean;
    getCanHide: () => boolean;
  };
  title: string;
  className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Column Meta Information
 */
export interface ColumnMeta {
  label?: string;
  description?: string;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  filterVariant?: 'text' | 'select' | 'range' | 'date';
  enableSorting?: boolean;
  enableHiding?: boolean;
}

/**
 * Row Actions Configuration
 */
export interface RowAction<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  disabled?: (row: TData) => boolean;
  show?: (row: TData) => boolean;
}

/**
 * Bulk Actions Configuration
 */
export interface BulkAction<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (rows: TData[]) => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: (rows: TData[]) => boolean;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Export Configuration
 */
export interface ExportConfig {
  filename?: string;
  formats?: ('csv' | 'excel' | 'json')[];
  includeHeaders?: boolean;
  selectedOnly?: boolean;
}

// ============================================================================
// RE-EXPORTS FROM @tanstack/react-table
// ============================================================================

export type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';