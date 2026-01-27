/**
 * useRowSelection Hook
 * Manages row selection state for tables with checkboxes
 */

import { useState, useCallback } from "react";

export interface RowSelectionOptions<T> {
  data: T[];
  getKey: (item: T) => string | number;
  initialSelected?: Set<string | number>;
}

export function useRowSelection<T>({
  data,
  getKey,
  initialSelected = new Set(),
}: RowSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] =
    useState<Set<string | number>>(initialSelected);

  // Toggle single row selection
  const toggleRow = useCallback(
    (item: T) => {
      const id = getKey(item);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    [getKey],
  );

  // Toggle all rows selection
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = new Set(data.map(getKey));
      // If all are selected, clear selection
      if (prev.size === data.length && data.length > 0) {
        return new Set();
      }
      // Otherwise select all
      return allIds;
    });
  }, [data, getKey]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Select specific rows
  const selectRows = useCallback(
    (items: T[]) => {
      setSelectedIds(new Set(items.map(getKey)));
    },
    [getKey],
  );

  // Check if a row is selected
  const isSelected = useCallback(
    (item: T) => {
      return selectedIds.has(getKey(item));
    },
    [selectedIds, getKey],
  );

  // Check if all rows are selected
  const isAllSelected = data.length > 0 && selectedIds.size === data.length;

  // Check if some (but not all) rows are selected
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  // Get selected items
  const selectedItems = data.filter((item) => selectedIds.has(getKey(item)));

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected,
    isSomeSelected,
    isSelected,
    toggleRow,
    toggleAll,
    clearSelection,
    selectRows,
  };
}
