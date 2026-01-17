const fs = require('fs');

const files = {
  'src/lib/utils/debounce.ts': `/**
 * Debounce Utility
 *
 * Purpose: Standalone debounce utility functions
 * Priority: High
 * Dependencies: None
 */

/**
 * Debounce a function - delays execution until after wait period has elapsed
 * since the last time it was invoked
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const context = this;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Debounce with immediate first call - executes immediately on first call,
 * then debounces subsequent calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function with immediate first call
 */
export function debounceImmediate<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let immediate = true;

  return function (this: unknown, ...args: Parameters<T>) {
    const context = this;

    if (immediate) {
      func.apply(context, args);
      immediate = false;
    }

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      immediate = true;
    }, wait);
  };
}

/**
 * Default export for convenience
 */
export default debounce;
`,
  'src/lib/hooks/useDebounce.ts': `/**
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
 * \`\`\`tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This will only run 500ms after the user stops typing
 *   fetchSearchResults(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * \`\`\`
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
`
};

for (const [path, content] of Object.entries(files)) {
  fs.writeFileSync(path, content);
  console.log('Written:', path);
}

console.log('Done!');
