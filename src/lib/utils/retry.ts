/**
 * Retry Utility
 *
 * Purpose: Retry failed operations with exponential backoff
 * Priority: High
 * Dependencies: logger
 */

import { logger } from './logger';

export interface RetryOptions {
  /** Maximum number of retry attempts @default 3 */
  maxAttempts?: number;
  /** Initial delay in milliseconds before first retry @default 1000 */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries @default 30000 */
  maxDelay?: number;
  /** Whether to use exponential backoff @default true */
  exponentialBackoff?: boolean;
  /** Backoff multiplier when using exponential backoff @default 2 */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback invoked before each retry */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

export class RetryError extends Error {
  public readonly lastError: unknown;
  public readonly attempts: number;

  constructor(
    message: string,
    lastError: unknown,
    attempts: number
  ) {
    super(message);
    this.name = 'RetryError';
    this.lastError = lastError;
    this.attempts = attempts;
  }
}

/**
 * Retry an async operation with configurable backoff strategy
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    exponentialBackoff = true,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      const currentDelay = Math.min(delay, maxDelay);

      logger.warn(
        `Retry attempt ${attempt}/${maxAttempts} after ${currentDelay}ms`,
        error instanceof Error ? error.message : String(error)
      );

      onRetry?.(error, attempt, currentDelay);

      await sleep(currentDelay);

      if (exponentialBackoff) {
        delay *= backoffMultiplier;
      }
    }
  }

  throw new RetryError(
    `Failed after ${maxAttempts} attempts`,
    lastError,
    maxAttempts
  );
}

/**
 * Retry with specific error type handling
 */
export async function retryWithPredicate<T>(
  fn: () => Promise<T>,
  predicate: (error: unknown) => boolean,
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return retry(fn, {
    ...options,
    shouldRetry: (error) => predicate(error),
  });
}

/**
 * Retry only on network errors (useful for API calls)
 */
export async function retryOnNetworkError<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return retry(fn, {
    ...options,
    shouldRetry: (error) => {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return true;
      }
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        return status >= 500 || status === 408 || status === 429;
      }
      return false;
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a retry wrapper for a function
 */
export function createRetryWrapper<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => retry(() => fn(...args), options);
}
