/**
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
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
