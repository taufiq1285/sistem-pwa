/**
 * Table Skeleton Loading Component
 * Provides animated skeleton placeholders for table loading states
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  columnWidths?: string[];
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  columnWidths,
}: TableSkeletonProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="px-4 py-3 font-semibold">
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="hover:bg-muted/50 transition-colors border-b border-border/50"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex} className="px-4 py-3">
                  <Skeleton
                    className="h-4"
                    style={{
                      width: columnWidths?.[colIndex] || "100%",
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
