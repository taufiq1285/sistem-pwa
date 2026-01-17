/**
 * Idempotency Utilities
 *
 * FASE 2 IMPLEMENTATION - LOW RISK
 * Utility functions untuk prevent duplicate operations
 * - Generate unique request IDs
 * - Add idempotency to queue data
 * - Client-side deduplication helpers
 *
 * BACKWARD COMPATIBLE:
 * - requestId is optional
 * - Existing code without requestId still works
 * - Only new operations get requestId
 */

import type { SyncEntity, SyncOperation } from "@/types/offline.types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Idempotency configuration
 */
export interface IdempotencyConfig {
  /**
   * Enable idempotency keys
   * Default: true
   */
  enabled?: boolean;
  /**
   * Custom prefix for request IDs
   * Default: "req"
   */
  prefix?: string;
  /**
   * Include timestamp in request ID
   * Default: true
   */
  includeTimestamp?: boolean;
}

/**
 * Request metadata
 */
export interface RequestMetadata {
  requestId: string;
  entity: SyncEntity;
  operation: SyncOperation;
  timestamp: number;
  userId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<IdempotencyConfig> = {
  enabled: true,
  prefix: "req",
  includeTimestamp: true,
};

// ============================================================================
// REQUEST ID GENERATION
// ============================================================================

/**
 * Generate unique request ID for idempotency
 *
 * Format: {prefix}_{entity}_{operation}_{timestamp}_{random}
 * Example: req_kuis_create_1702736400000_abc123
 *
 * @param entity - Entity type
 * @param operation - Operation type
 * @param config - Optional config
 * @returns Unique request ID
 *
 * @example
 * ```typescript
 * const requestId = generateRequestId("kuis", "create");
 * // "req_kuis_create_1702736400000_abc123"
 * ```
 */
export function generateRequestId(
  entity: SyncEntity,
  operation: SyncOperation,
  config: IdempotencyConfig = {},
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enabled) {
    return "";
  }

  const parts: string[] = [finalConfig.prefix, entity, operation];

  // Add timestamp if enabled
  if (finalConfig.includeTimestamp) {
    parts.push(Date.now().toString());
  }

  // Add random suffix for uniqueness
  const random = Math.random().toString(36).substring(2, 8);
  parts.push(random);

  return parts.join("_");
}

/**
 * Parse request ID to extract metadata
 *
 * @param requestId - Request ID to parse
 * @returns Parsed metadata or null if invalid
 *
 * @example
 * ```typescript
 * const metadata = parseRequestId("req_kuis_create_1702736400000_abc123");
 * // { prefix: "req", entity: "kuis", operation: "create", timestamp: 1702736400000, random: "abc123" }
 * ```
 */
export function parseRequestId(requestId: string): {
  prefix: string;
  entity: string;
  operation: string;
  timestamp?: number;
  random: string;
} | null {
  const parts = requestId.split("_");

  if (parts.length < 4) {
    return null;
  }

  const result: {
    prefix: string;
    entity: string;
    operation: string;
    timestamp?: number;
    random: string;
  } = {
    prefix: parts[0],
    entity: parts[1],
    operation: parts[2],
    random: parts[parts.length - 1],
  };

  // Try to parse timestamp if present
  if (parts.length >= 5) {
    const timestamp = parseInt(parts[3], 10);
    if (!isNaN(timestamp)) {
      result.timestamp = timestamp;
    }
  }

  return result;
}

// ============================================================================
// DATA ENHANCEMENT
// ============================================================================

/**
 * Add idempotency key to data object
 *
 * SAFE: Does not modify original data object
 *
 * @param data - Original data
 * @param entity - Entity type
 * @param operation - Operation type
 * @param config - Optional config
 * @returns Enhanced data with _requestId
 *
 * @example
 * ```typescript
 * const originalData = { judul: "Quiz 1", kelas_id: "123" };
 * const enhancedData = addIdempotencyKey(originalData, "kuis", "create");
 * // { judul: "Quiz 1", kelas_id: "123", _requestId: "req_kuis_create_..." }
 *
 * // Original data unchanged
 * console.log(originalData); // { judul: "Quiz 1", kelas_id: "123" }
 * ```
 */
export function addIdempotencyKey<T extends Record<string, unknown>>(
  data: T,
  entity: SyncEntity,
  operation: SyncOperation,
  config: IdempotencyConfig = {},
): T & { _requestId?: string } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enabled) {
    return { ...data };
  }

  // Check if already has requestId
  if (data._requestId) {
    return { ...data };
  }

  const requestId = generateRequestId(entity, operation, config);

  return {
    ...data,
    _requestId: requestId,
  };
}

/**
 * Extract idempotency key from data
 *
 * @param data - Data object
 * @returns Request ID or undefined
 *
 * @example
 * ```typescript
 * const data = { judul: "Quiz 1", _requestId: "req_kuis_create_123" };
 * const requestId = extractIdempotencyKey(data);
 * // "req_kuis_create_123"
 * ```
 */
export function extractIdempotencyKey(
  data: Record<string, unknown>,
): string | undefined {
  return data._requestId as string | undefined;
}

/**
 * Remove idempotency key from data (for server submission)
 *
 * @param data - Data with idempotency key
 * @returns Data without _requestId
 *
 * @example
 * ```typescript
 * const data = { judul: "Quiz 1", _requestId: "req_kuis_create_123" };
 * const clean = removeIdempotencyKey(data);
 * // { judul: "Quiz 1" }
 * ```
 */
export function removeIdempotencyKey<T extends Record<string, unknown>>(
  data: T,
): Omit<T, "_requestId"> {
  const { _requestId, ...rest } = data;
  return rest as Omit<T, "_requestId">;
}

// ============================================================================
// DEDUPLICATION HELPERS
// ============================================================================

/**
 * Check if two request IDs are duplicate
 *
 * @param requestId1 - First request ID
 * @param requestId2 - Second request ID
 * @returns True if duplicate
 *
 * @example
 * ```typescript
 * const id1 = "req_kuis_create_1702736400000_abc123";
 * const id2 = "req_kuis_create_1702736400000_abc123";
 * isDuplicateRequest(id1, id2); // true
 * ```
 */
export function isDuplicateRequest(
  requestId1: string,
  requestId2: string,
): boolean {
  return requestId1 === requestId2;
}

/**
 * Check if request is expired (based on timestamp)
 *
 * @param requestId - Request ID with timestamp
 * @param maxAgeMs - Max age in milliseconds (default: 7 days)
 * @returns True if expired
 *
 * @example
 * ```typescript
 * const oldId = "req_kuis_create_1702736400000_abc123";
 * const expired = isRequestExpired(oldId, 24 * 60 * 60 * 1000); // 1 day
 * ```
 */
export function isRequestExpired(
  requestId: string,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000, // 7 days default
): boolean {
  const metadata = parseRequestId(requestId);

  if (!metadata || !metadata.timestamp) {
    return false; // Cannot determine age
  }

  const age = Date.now() - metadata.timestamp;
  return age > maxAgeMs;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Local storage key for processed requests
 */
const PROCESSED_REQUESTS_KEY = "idempotency:processed";

/**
 * Get list of processed request IDs from localStorage
 *
 * @returns Array of processed request IDs
 */
export function getProcessedRequests(): string[] {
  try {
    const stored = localStorage.getItem(PROCESSED_REQUESTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get processed requests:", error);
    return [];
  }
}

/**
 * Mark request as processed in localStorage
 *
 * @param requestId - Request ID to mark
 * @param maxEntries - Max entries to keep (default: 1000)
 */
export function markRequestProcessed(
  requestId: string,
  maxEntries: number = 1000,
): void {
  try {
    const processed = getProcessedRequests();

    // Add if not already present
    if (!processed.includes(requestId)) {
      processed.push(requestId);

      // Keep only last N entries
      const trimmed =
        processed.length > maxEntries
          ? processed.slice(-maxEntries)
          : processed;

      localStorage.setItem(PROCESSED_REQUESTS_KEY, JSON.stringify(trimmed));
    }
  } catch (error) {
    console.error("Failed to mark request processed:", error);
  }
}

/**
 * Check if request was already processed
 *
 * @param requestId - Request ID to check
 * @returns True if already processed
 */
export function wasRequestProcessed(requestId: string): boolean {
  const processed = getProcessedRequests();
  return processed.includes(requestId);
}

/**
 * Clear old processed requests (cleanup)
 *
 * @param maxAgeMs - Max age to keep (default: 7 days)
 * @returns Number of entries removed
 */
export function cleanupProcessedRequests(
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000,
): number {
  try {
    const processed = getProcessedRequests();
    const filtered = processed.filter(
      (requestId) => !isRequestExpired(requestId, maxAgeMs),
    );

    const removed = processed.length - filtered.length;

    if (removed > 0) {
      localStorage.setItem(PROCESSED_REQUESTS_KEY, JSON.stringify(filtered));
      console.log(`🧹 Cleaned up ${removed} old processed requests`);
    }

    return removed;
  } catch (error) {
    console.error("Failed to cleanup processed requests:", error);
    return 0;
  }
}

// ============================================================================
// DEBUGGING HELPERS
// ============================================================================

/**
 * Format request ID for display
 *
 * @param requestId - Request ID
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * formatRequestId("req_kuis_create_1702736400000_abc123");
 * // "req_kuis_create...abc123 (2023-12-16 10:00:00)"
 * ```
 */
export function formatRequestId(requestId: string): string {
  const metadata = parseRequestId(requestId);

  if (!metadata) {
    return requestId;
  }

  const short = `${metadata.prefix}_${metadata.entity}_${metadata.operation}...${metadata.random}`;

  if (metadata.timestamp) {
    const date = new Date(metadata.timestamp).toLocaleString("id-ID");
    return `${short} (${date})`;
  }

  return short;
}

/**
 * Get statistics about processed requests
 *
 * @returns Statistics object
 */
export function getIdempotencyStats(): {
  total: number;
  expired: number;
  recent: number;
  oldestTimestamp?: number;
  newestTimestamp?: number;
} {
  const processed = getProcessedRequests();

  let expiredCount = 0;
  let oldestTimestamp: number | undefined;
  let newestTimestamp: number | undefined;

  for (const requestId of processed) {
    const metadata = parseRequestId(requestId);

    if (metadata?.timestamp) {
      if (isRequestExpired(requestId)) {
        expiredCount++;
      }

      if (!oldestTimestamp || metadata.timestamp < oldestTimestamp) {
        oldestTimestamp = metadata.timestamp;
      }

      if (!newestTimestamp || metadata.timestamp > newestTimestamp) {
        newestTimestamp = metadata.timestamp;
      }
    }
  }

  return {
    total: processed.length,
    expired: expiredCount,
    recent: processed.length - expiredCount,
    oldestTimestamp,
    newestTimestamp,
  };
}
