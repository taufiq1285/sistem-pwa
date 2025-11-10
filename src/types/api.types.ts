/**
 * API Types
 * Common types for API layer - responses, errors, pagination, etc.
 */

// ============================================================================
// HTTP METHODS
// ============================================================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: PaginationMeta;
  success: boolean;
  error?: ApiError;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * API Error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  timestamp?: string;
}

/**
 * Error codes as const object (can be used as both type and value)
 */
export const ApiErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',
  SYNC_ERROR: 'SYNC_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Error codes type (extracted from const object)
 */
export type ApiErrorCodeType = typeof ApiErrorCode[keyof typeof ApiErrorCode];

// ============================================================================
// REQUEST CONFIG
// ============================================================================

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  method: ApiMethod;
  url: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: RetryConfig;
  offline?: OfflineConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoff?: 'linear' | 'exponential';
  retryOn?: number[]; // HTTP status codes to retry
}

/**
 * Offline configuration
 */
export interface OfflineConfig {
  enabled: boolean;
  queueRequest?: boolean;
  priority?: number; // 1-10, higher = more important
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

/**
 * Common query parameters
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

/**
 * Filter operator
 */
export type FilterOperator = 
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'like'    // contains
  | 'ilike'   // case-insensitive contains
  | 'in'      // in array
  | 'is'      // is null/not null
  | 'not';    // not

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

// ============================================================================
// CRUD OPERATION TYPES
// ============================================================================

/**
 * Create operation payload
 */
export interface CreatePayload<T = Record<string, unknown>> {
  data: T;
}

/**
 * Update operation payload
 */
export interface UpdatePayload<T = Record<string, unknown>> {
  id: string;
  data: Partial<T>;
}

/**
 * Delete operation payload
 */
export interface DeletePayload {
  id: string;
  soft?: boolean; // soft delete vs hard delete
}

/**
 * Bulk operation payload
 */
export interface BulkOperationPayload<T = Record<string, unknown>> {
  ids: string[];
  data?: Partial<T>;
  operation: 'create' | 'update' | 'delete';
}

// ============================================================================
// API STATE
// ============================================================================

/**
 * API loading state
 */
export interface ApiLoadingState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: ApiError | null;
}

/**
 * API mutation state
 */
export interface ApiMutationState extends ApiLoadingState {
  isIdle: boolean;
  reset: () => void;
}

// ============================================================================
// SUPABASE SPECIFIC
// ============================================================================

/**
 * Supabase query options
 */
export interface SupabaseQueryOptions {
  select?: string;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
  single?: boolean;
}

/**
 * Supabase filter
 */
export interface SupabaseFilter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

// ============================================================================
// CACHE CONFIG
// ============================================================================

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl?: number; // Time to live in seconds
  key?: string;
  invalidateOn?: string[]; // Events that invalidate cache
}

// ============================================================================
// WEBHOOK / REALTIME
// ============================================================================

/**
 * Realtime subscription config
 */
export interface RealtimeConfig {
  enabled: boolean;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: Record<string, unknown>) => void;
}