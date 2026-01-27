/**
 * Enhanced Table Component
 * Provides better styling, hover effects, and visual improvements
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Re-export TableBody for convenience
export { TableBody };

interface EnhancedTableProps {
  children: React.ReactNode;
  className?: string
}

export function EnhancedTable({ children, className }: EnhancedTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <Table>
        {children}
      </Table>
    </div>
  );
}

export function EnhancedTableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <TableHeader className={cn("bg-muted/50", className)} {...props} />
  );
}

export function EnhancedTableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <TableRow
      className={cn(
        "hover:bg-muted/50 transition-colors border-b border-border/50",
        className
      )}
      {...props}
    />
  );
}

export function EnhancedTableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return (
    <TableHead
      className={cn(
        "font-semibold text-foreground px-4 py-3 text-sm whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

export function EnhancedTableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <TableCell
      className={cn(
        "px-4 py-3 text-sm align-middle",
        className
      )}
      {...props}
    />
  );
}

