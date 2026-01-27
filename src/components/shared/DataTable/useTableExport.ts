/**
 * useTableExport Hook
 * Provides export functionality for table data to CSV/Excel
 */

import { useCallback } from "react";

export interface ExportColumn<T> {
  key: string;
  label: string;
  formatter?: (value: any, row: T) => string;
}

export interface ExportOptions<T> {
  columns: ExportColumn<T>[];
  data: T[];
  filename?: string;
}

export function useTableExport<T>() {
  const exportToCSV = useCallback(
    ({ columns, data, filename = "export" }: ExportOptions<T>) => {
      // Create CSV header
      const headers = columns.map((col) => col.label).join(",");

      // Create CSV rows
      const rows = data.map((row) => {
        return columns
          .map((col) => {
            const value = row[col.key as keyof T];
            // Use formatter if available, otherwise convert to string
            const formattedValue = col.formatter
              ? col.formatter(value, row)
              : String(value ?? "");

            // Escape quotes and wrap in quotes if contains comma
            if (formattedValue.includes(",") || formattedValue.includes('"')) {
              return `"${formattedValue.replace(/"/g, '""')}"`;
            }
            return formattedValue;
          })
          .join(",");
      });

      // Combine header and rows
      const csv = [headers, ...rows].join("\n");

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);
    },
    []
  );

  const exportToJSON = useCallback(
    ({ data, filename = "export" }: { data: T[]; filename?: string }) => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.json`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    },
    []
  );

  return {
    exportToCSV,
    exportToJSON,
  };
}
