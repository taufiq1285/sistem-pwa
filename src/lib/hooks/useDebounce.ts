/**
 * useDebounce Hook
 *
 * Purpose: React hook for debouncing values
 * Priority: High
 * Dependencies: React
 *
 * Usage:
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 */

import { useState, useEffect } from 'react';

/**
 * Debounce a value - updates only after the specified delay has elapsed
 * since the last change
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This will only run 500ms after the user stops typing
 *   fetchSearchResults(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
