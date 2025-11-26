/**
 * Helper Utilities
 *
 * Purpose: Common helper functions for data manipulation and utilities
 * Priority: High
 * Dependencies: None
 */

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID
 * @returns A unique identifier string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Deep clone an object or array
 * @param obj - Object to clone
 * @returns Deep cloned copy of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as T;
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * Check if an object or array is empty
 * @param obj - Object or array to check
 * @returns True if empty, false otherwise
 */
export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }

  if (typeof obj === 'string' || Array.isArray(obj)) {
    return obj.length === 0;
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }

  return false;
}

/**
 * Group array items by a key
 * @param arr - Array to group
 * @param key - Key to group by
 * @returns Object with grouped items
 */
export function groupBy<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T
): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Remove duplicate items from an array
 * @param arr - Array to process
 * @param key - Optional key to determine uniqueness for objects
 * @returns Array with duplicates removed
 */
export function unique<T>(arr: T[], key?: keyof T): T[] {
  if (!key) {
    return Array.from(new Set(arr));
  }

  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}

/**
 * Split array into chunks of specified size
 * @param arr - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Omit specified keys from an object
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without specified keys
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick specified keys from an object
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only specified keys
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Clamp a number between min and max values
 * @param num - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 * @param value - Value to check
 * @returns True if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely parse JSON with fallback value
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Debounce a function
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
 * Throttle a function
 * @param func - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: unknown, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
