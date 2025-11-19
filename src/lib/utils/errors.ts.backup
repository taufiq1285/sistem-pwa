/**
 * Error Handling Utilities
 * Custom error classes and error handling functions for API layer
 */

import type { ApiError } from '@/types/api.types';
import { ApiErrorCode } from '@/types/api.types';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base API Error Class
 */
export class BaseApiError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: Record<string, any>;
  public timestamp: string;

  constructor(
    message: string,
    code: string = ApiErrorCode.UNKNOWN,
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BaseApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Network Error
 */
export class NetworkError extends BaseApiError {
  constructor(message: string = 'Network error occurred', details?: Record<string, any>) {
    super(message, ApiErrorCode.NETWORK_ERROR, undefined, details);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends BaseApiError {
  constructor(message: string = 'Request timeout', details?: Record<string, any>) {
    super(message, ApiErrorCode.TIMEOUT, 408, details);
    this.name = 'TimeoutError';
  }
}

/**
 * Validation Error
 */
export class ValidationError extends BaseApiError {
  constructor(message: string = 'Validation failed', details?: Record<string, any>) {
    super(message, ApiErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends BaseApiError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(message, ApiErrorCode.UNAUTHORIZED, 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends BaseApiError {
  constructor(message: string = 'Access forbidden', details?: Record<string, any>) {
    super(message, ApiErrorCode.FORBIDDEN, 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends BaseApiError {
  constructor(message: string = 'Resource not found', details?: Record<string, any>) {
    super(message, ApiErrorCode.NOT_FOUND, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends BaseApiError {
  constructor(message: string = 'Resource conflict', details?: Record<string, any>) {
    super(message, ApiErrorCode.CONFLICT, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Server Error
 */
export class ServerError extends BaseApiError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super(message, ApiErrorCode.INTERNAL_ERROR, 500, details);
    this.name = 'ServerError';
  }
}

/**
 * Service Unavailable Error
 */
export class ServiceUnavailableError extends BaseApiError {
  constructor(message: string = 'Service temporarily unavailable', details?: Record<string, any>) {
    super(message, ApiErrorCode.SERVICE_UNAVAILABLE, 503, details);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Offline Error
 */
export class OfflineError extends BaseApiError {
  constructor(message: string = 'You are currently offline', details?: Record<string, any>) {
    super(message, ApiErrorCode.OFFLINE, undefined, details);
    this.name = 'OfflineError';
  }
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

/**
 * Map HTTP status code to error class
 */
export function mapStatusToError(status: number, message?: string, details?: Record<string, any>): BaseApiError {
  switch (status) {
    case 400:
      return new ValidationError(message, details);
    case 401:
      return new AuthenticationError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 409:
      return new ConflictError(message, details);
    case 408:
      return new TimeoutError(message, details);
    case 500:
      return new ServerError(message, details);
    case 503:
      return new ServiceUnavailableError(message, details);
    default:
      if (status >= 400 && status < 500) {
        return new BaseApiError(message || 'Client error', ApiErrorCode.BAD_REQUEST, status, details);
      } else if (status >= 500) {
        return new ServerError(message, details);
      }
      return new BaseApiError(message || 'Unknown error', ApiErrorCode.UNKNOWN, status, details);
  }
}

/**
 * Map error code to user-friendly message
 */
export function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    [ApiErrorCode.BAD_REQUEST]: 'Permintaan tidak valid',
    [ApiErrorCode.UNAUTHORIZED]: 'Anda harus login terlebih dahulu',
    [ApiErrorCode.FORBIDDEN]: 'Anda tidak memiliki akses ke resource ini',
    [ApiErrorCode.NOT_FOUND]: 'Data tidak ditemukan',
    [ApiErrorCode.VALIDATION_ERROR]: 'Data yang Anda masukkan tidak valid',
    [ApiErrorCode.CONFLICT]: 'Data sudah ada atau terjadi konflik',
    [ApiErrorCode.INTERNAL_ERROR]: 'Terjadi kesalahan pada server',
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 'Layanan sedang tidak tersedia',
    [ApiErrorCode.NETWORK_ERROR]: 'Terjadi kesalahan jaringan',
    [ApiErrorCode.TIMEOUT]: 'Permintaan timeout, silakan coba lagi',
    [ApiErrorCode.OFFLINE]: 'Anda sedang offline',
    [ApiErrorCode.SYNC_ERROR]: 'Gagal melakukan sinkronisasi data',
    [ApiErrorCode.UNKNOWN]: 'Terjadi kesalahan yang tidak diketahui',
  };

  return errorMessages[code] || 'Terjadi kesalahan';
}

// ============================================================================
// SUPABASE ERROR HANDLING
// ============================================================================

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: any): BaseApiError {
  // Supabase error structure
  if (error?.code) {
    const code = error.code;
    const message = error.message || 'Database error';
    const details = {
      hint: error.hint,
      details: error.details,
    };

    // Map common Supabase error codes
    switch (code) {
      case '42501': // insufficient_privilege
        return new AuthorizationError('Insufficient permissions', details);
      case '23505': // unique_violation
        return new ConflictError('Record already exists', details);
      case '23503': // foreign_key_violation
        return new ValidationError('Invalid reference', details);
      case 'PGRST116': // not found
        return new NotFoundError('Record not found', details);
      case '22P02': // invalid_text_representation
        return new ValidationError('Invalid data format', details);
      default:
        return new ServerError(message, details);
    }
  }

  // Auth errors
  if (error?.status === 401) {
    return new AuthenticationError(error.message || 'Authentication failed');
  }

  // Generic error
  return new ServerError(error?.message || 'Database operation failed');
}

// ============================================================================
// ERROR HANDLER FUNCTION
// ============================================================================

/**
 * Main error handler
 * Converts any error to BaseApiError
 */
export function handleError(error: unknown): BaseApiError {
  // Already a BaseApiError
  if (error instanceof BaseApiError) {
    return error;
  }

  // Network/Fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network request failed');
  }

  // Timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    return new TimeoutError();
  }

  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    return handleSupabaseError(error);
  }

  // HTTP response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    const message = (error as any).message || (error as any).statusText;
    return mapStatusToError(status, message);
  }

  // Standard Error
  if (error instanceof Error) {
    return new BaseApiError(error.message, ApiErrorCode.UNKNOWN);
  }

  // Unknown error
  return new BaseApiError(
    'An unknown error occurred',
    ApiErrorCode.UNKNOWN,
    undefined,
    { originalError: String(error) }
  );
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log error to console (development)
 */
export function logError(error: BaseApiError, context?: string): void {
  if (import.meta.env.DEV) {
    console.group(`🔴 API Error ${context ? `(${context})` : ''}`);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }
}

/**
 * Log error to external service (production)
 * TODO: Integrate with error tracking service (Sentry, LogRocket, etc)
 */
export function reportError(error: BaseApiError, context?: Record<string, any>): void {
  // In production, send to error tracking service
  if (!import.meta.env.DEV) {
    // TODO: Implement error reporting
    // Example: Sentry.captureException(error, { extra: context });
    console.error('Error occurred:', error.toJSON(), context);
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Check if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || 
         error instanceof TimeoutError ||
         error instanceof OfflineError;
}

/**
 * Check if error is client-side (4xx)
 */
export function isClientError(error: BaseApiError): boolean {
  return !!error.statusCode && error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Check if error is server-side (5xx)
 */
export function isServerError(error: BaseApiError): boolean {
  return !!error.statusCode && error.statusCode >= 500;
}

/**
 * Check if error should be retried
 */
export function shouldRetry(error: BaseApiError, attempt: number, maxAttempts: number): boolean {
  // Don't retry if max attempts reached
  if (attempt >= maxAttempts) {
    return false;
  }

  // Retry on network errors
  if (isNetworkError(error)) {
    return true;
  }

  // Retry on 5xx server errors
  if (isServerError(error)) {
    return true;
  }

  // Retry on timeout
  if (error instanceof TimeoutError) {
    return true;
  }

  // Don't retry 4xx client errors
  return false;
}