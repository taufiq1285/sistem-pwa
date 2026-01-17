/**
 * Fetch with Timeout Utility
 *
 * Provides timeout handling for fetch requests and Promises
 * to prevent hanging requests when network is slow/unreliable
 */

/**
 * Wrap any Promise with a timeout
 * If the promise doesn't resolve within the timeout period, it will be rejected
 *
 * @param promise - The promise to wrap with timeout
 * @param timeoutMs - Timeout in milliseconds (default: 8000ms = 8 seconds)
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that will reject if timeout is exceeded
 *
 * @example
 * ```ts
 * const data = await fetchWithTimeout(
 *   supabase.from('users').select('*'),
 *   5000
 * );
 * ```
 */
export async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 8000,
  errorMessage: string = "Request timeout",
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Create a fetch function with built-in timeout
 * Returns a fetch function that will automatically timeout after specified duration
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Fetch function with timeout
 *
 * @example
 * ```ts
 * const fetchWithTimeout = createFetchWithTimeout(5000);
 * const response = await fetchWithTimeout('https://api.example.com/data');
 * ```
 */
export function createFetchWithTimeout(timeoutMs: number = 8000) {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if it's an abort error
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }

      throw error;
    }
  };
}

/**
 * Retry a promise with exponential backoff
 * Useful for network requests that might fail temporarily
 *
 * @param fn - Function that returns a Promise
 * @param maxRetries - Maximum number of retry attempts
 * @param initialDelay - Initial delay in milliseconds
 * @returns Promise with retry logic
 *
 * @example
 * ```ts
 * const data = await retryWithBackoff(
 *   () => fetchWithTimeout(apiCall(), 5000),
 *   3,
 *   1000
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Race multiple promises with timeout
 * Returns the first promise to resolve, or rejects if all fail or timeout
 *
 * @param promises - Array of promises to race
 * @param timeoutMs - Timeout in milliseconds
 * @returns First resolved promise or timeout error
 *
 * @example
 * ```ts
 * const data = await raceWithTimeout([
 *   fetchFromCache(),
 *   fetchFromNetwork()
 * ], 3000);
 * ```
 */
export async function raceWithTimeout<T>(
  promises: Promise<T>[],
  timeoutMs: number = 8000,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Race timeout")), timeoutMs);
  });

  return Promise.race([...promises, timeoutPromise]);
}

/**
 * Check if an error is a timeout error
 *
 * @param error - Error to check
 * @returns true if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("timeout") ||
      error.message.includes("Timeout") ||
      error.name === "AbortError" ||
      error.name === "TimeoutError"
    );
  }
  return false;
}

/**
 * Create a timeout controller
 * Useful for managing timeout across multiple operations
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object with abort controller and cleanup function
 *
 * @example
 * ```ts
 * const { controller, cleanup } = createTimeoutController(5000);
 * try {
 *   const response = await fetch(url, { signal: controller.signal });
 *   return response;
 * } finally {
 *   cleanup();
 * }
 * ```
 */
export function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
    },
    abort: () => {
      clearTimeout(timeoutId);
      controller.abort();
    },
  };
}

/**
 * Default timeout values for different operation types
 */
export const TIMEOUT_DEFAULTS = {
  /** Fast operations - UI interactions, cached data */
  FAST: 3000,

  /** Normal operations - Most API calls */
  NORMAL: 8000,

  /** Slow operations - Large data fetches, file uploads */
  SLOW: 15000,

  /** Very slow operations - Batch operations, reports */
  VERY_SLOW: 30000,
} as const;

/**
 * Timeout configuration for network quality
 */
export const TIMEOUT_BY_NETWORK = {
  /** Fast connection (4G, WiFi) */
  FAST: 5000,

  /** Normal connection (3G) */
  NORMAL: 10000,

  /** Slow connection (2G, slow 3G) */
  SLOW: 20000,

  /** Offline or very poor connection */
  OFFLINE: 3000,
} as const;

/**
 * Detect network quality and get recommended timeout
 *
 * @returns Recommended timeout in milliseconds based on connection type
 */
export function getRecommendedTimeout(): number {
  type NavigatorWithConnection = Navigator & {
    connection?: any;
    mozConnection?: any;
    webkitConnection?: any;
  };

  const nav = navigator as NavigatorWithConnection;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) {
    return TIMEOUT_DEFAULTS.NORMAL;
  }

  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case "4g":
      return TIMEOUT_BY_NETWORK.FAST;
    case "3g":
      return TIMEOUT_BY_NETWORK.NORMAL;
    case "2g":
    case "slow-2g":
      return TIMEOUT_BY_NETWORK.SLOW;
    default:
      return TIMEOUT_DEFAULTS.NORMAL;
  }
}
