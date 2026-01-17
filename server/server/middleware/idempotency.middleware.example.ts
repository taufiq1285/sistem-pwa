/**
 * Idempotency Middleware (SERVER-SIDE)
 *
 * FASE 2 IMPLEMENTATION - LOW RISK
 * Middleware untuk handle idempotent requests di server
 * - Check untuk duplicate request IDs
 * - Return cached response jika sudah diproses
 * - Store request log untuk future checks
 *
 * FILE INI ADALAH EXAMPLE/TEMPLATE
 * Copy dan adapt sesuai dengan server framework Anda:
 * - Express.js
 * - Fastify
 * - Next.js API Routes
 * - Supabase Edge Functions
 *
 * BACKWARD COMPATIBLE:
 * - Requests without _requestId masih diproses normal
 * - Tidak break existing API
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";

// ============================================================================
// TYPES
// ============================================================================

export interface IdempotencyMiddlewareOptions {
  /**
   * Enable idempotency checking
   * Default: true
   */
  enabled?: boolean;

  /**
   * Extract requestId from request
   * Default: from req.body._requestId
   */
  extractRequestId?: (req: Request) => string | undefined;

  /**
   * Extract entity & operation from request
   * For logging purposes
   */
  extractMetadata?: (
    req: Request,
  ) => { entity: string; operation: string } | undefined;

  /**
   * Skip idempotency for certain paths
   * Default: []
   */
  skipPaths?: string[];

  /**
   * Cache results in memory (in addition to database)
   * Default: true
   */
  useMemoryCache?: boolean;

  /**
   * Memory cache TTL (ms)
   * Default: 5 minutes
   */
  memoryCacheTTL?: number;
}

// ============================================================================
// IN-MEMORY CACHE (Optional for performance)
// ============================================================================

interface CacheEntry {
  result: any;
  timestamp: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.ttl = ttl;

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  get(requestId: string): any | undefined {
    const entry = this.cache.get(requestId);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(requestId);
      return undefined;
    }

    return entry.result;
  }

  set(requestId: string, result: any): void {
    this.cache.set(requestId, {
      result,
      timestamp: Date.now(),
    });
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if request was already processed (database)
 */
async function checkDatabaseForRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<{
  exists: boolean;
  status?: string;
  result?: any;
  created_at?: string;
} | null> {
  try {
    const { data, error } = await supabase.rpc("check_request_idempotency", {
      p_request_id: requestId,
    });

    if (error) {
      console.error("Failed to check idempotency:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Exception checking idempotency:", error);
    return null;
  }
}

/**
 * Log request start
 */
async function logRequestStart(
  supabase: SupabaseClient,
  requestId: string,
  entity: string,
  operation: string,
  userId?: string,
): Promise<void> {
  try {
    await supabase.rpc("log_request_start", {
      p_request_id: requestId,
      p_entity: entity,
      p_operation: operation,
      p_user_id: userId || null,
    });
  } catch (error) {
    console.error("Failed to log request start:", error);
  }
}

/**
 * Log request completion
 */
async function logRequestComplete(
  supabase: SupabaseClient,
  requestId: string,
  result: any,
  status: "completed" | "failed" = "completed",
  error?: string,
): Promise<void> {
  try {
    await supabase.rpc("log_request_complete", {
      p_request_id: requestId,
      p_result: result,
      p_status: status,
      p_error: error || null,
    });
  } catch (err) {
    console.error("Failed to log request completion:", err);
  }
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

/**
 * Create idempotency middleware
 *
 * @param supabase - Supabase client
 * @param options - Middleware options
 * @returns Express middleware
 *
 * @example
 * ```typescript
 * import { createIdempotencyMiddleware } from './middleware/idempotency.middleware';
 *
 * const idempotency = createIdempotencyMiddleware(supabase, {
 *   enabled: true,
 *   skipPaths: ['/health', '/metrics']
 * });
 *
 * app.post('/api/kuis/submit', idempotency, async (req, res) => {
 *   // Your handler code
 *   // If duplicate detected, middleware already responded
 * });
 * ```
 */
export function createIdempotencyMiddleware(
  supabase: SupabaseClient,
  options: IdempotencyMiddlewareOptions = {},
) {
  const config: Required<IdempotencyMiddlewareOptions> = {
    enabled: options.enabled ?? true,
    extractRequestId: options.extractRequestId || ((req) => req.body._requestId),
    extractMetadata:
      options.extractMetadata ||
      (() => ({
        entity: "unknown",
        operation: "unknown",
      })),
    skipPaths: options.skipPaths || [],
    useMemoryCache: options.useMemoryCache ?? true,
    memoryCacheTTL: options.memoryCacheTTL ?? 5 * 60 * 1000,
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if disabled
    if (!config.enabled) {
      return next();
    }

    // Skip certain paths
    if (config.skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Extract requestId from request
    const requestId = config.extractRequestId(req);

    // If no requestId, proceed normally (backward compatible)
    if (!requestId) {
      return next();
    }

    console.log(`🔍 Checking idempotency for: ${requestId}`);

    try {
      // 1. Check memory cache first (fast path)
      if (config.useMemoryCache) {
        const cachedResult = memoryCache.get(requestId);
        if (cachedResult) {
          console.log(`⚡ Returning cached result for: ${requestId}`);
          return res.status(200).json(cachedResult);
        }
      }

      // 2. Check database
      const existing = await checkDatabaseForRequest(supabase, requestId);

      if (existing?.exists) {
        console.log(`📋 Request already processed: ${requestId}`);

        // If completed, return the stored result
        if (existing.status === "completed" && existing.result) {
          console.log(`✅ Returning stored result for: ${requestId}`);

          // Cache in memory for next time
          if (config.useMemoryCache) {
            memoryCache.set(requestId, existing.result);
          }

          return res.status(200).json(existing.result);
        }

        // If still processing, tell client to retry
        if (existing.status === "processing") {
          console.log(`⏳ Request still processing: ${requestId}`);
          return res.status(409).json({
            error: "Request is currently being processed",
            message: "Please retry in a few seconds",
            requestId,
          });
        }

        // If failed, tell client about the error
        if (existing.status === "failed") {
          console.log(`❌ Request previously failed: ${requestId}`);
          return res.status(500).json({
            error: "Request previously failed",
            message: "Please check your request and try again",
            requestId,
          });
        }
      }

      // 3. Request is new - log start and proceed
      const metadata = config.extractMetadata(req);
      if (metadata) {
        const userId = (req as any).user?.id; // Adjust based on your auth
        await logRequestStart(
          supabase,
          requestId,
          metadata.entity,
          metadata.operation,
          userId,
        );
      }

      // 4. Intercept response to log completion
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);

      let statusCode = 200;

      // Override status to capture it
      res.status = function (code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      // Override json to log completion
      res.json = function (body: any) {
        // Log completion asynchronously (don't block response)
        const isSuccess = statusCode >= 200 && statusCode < 300;

        logRequestComplete(
          supabase,
          requestId,
          isSuccess ? body : null,
          isSuccess ? "completed" : "failed",
          isSuccess ? undefined : JSON.stringify(body),
        ).then(() => {
          // Cache successful responses
          if (isSuccess && config.useMemoryCache) {
            memoryCache.set(requestId, body);
          }
        });

        return originalJson(body);
      };

      // Proceed to route handler
      next();
    } catch (error) {
      console.error("Idempotency middleware error:", error);
      // On error, proceed anyway (fail open for safety)
      next();
    }
  };
}

// ============================================================================
// STANDALONE FUNCTIONS (for manual use)
// ============================================================================

/**
 * Manually check and handle idempotency
 *
 * Use this in API handlers that don't use middleware
 *
 * @example
 * ```typescript
 * export async function POST(req: Request) {
 *   const body = await req.json();
 *   const requestId = body._requestId;
 *
 *   if (requestId) {
 *     const existing = await handleIdempotency(supabase, requestId);
 *     if (existing) {
 *       return new Response(JSON.stringify(existing.result), {
 *         status: 200,
 *         headers: { 'Content-Type': 'application/json' }
 *       });
 *     }
 *   }
 *
 *   // Process request normally...
 * }
 * ```
 */
export async function handleIdempotency(
  supabase: SupabaseClient,
  requestId: string,
): Promise<{ result: any } | null> {
  const existing = await checkDatabaseForRequest(supabase, requestId);

  if (existing?.exists && existing.status === "completed" && existing.result) {
    return { result: existing.result };
  }

  return null;
}

/**
 * Wrap an async function with idempotency
 *
 * @example
 * ```typescript
 * const submitQuiz = withIdempotency(
 *   supabase,
 *   async (data) => {
 *     // Your logic here
 *     return { success: true, score: 85 };
 *   }
 * );
 *
 * // Call it
 * const result = await submitQuiz(requestId, data, 'kuis_jawaban', 'create');
 * ```
 */
export function withIdempotency<T>(
  supabase: SupabaseClient,
  handler: (data: any) => Promise<T>,
) {
  return async (
    requestId: string,
    data: any,
    entity: string,
    operation: string,
  ): Promise<T> => {
    // Check if already processed
    const existing = await checkDatabaseForRequest(supabase, requestId);

    if (existing?.exists && existing.status === "completed" && existing.result) {
      console.log(`✅ Idempotent return for: ${requestId}`);
      return existing.result as T;
    }

    // Log start
    await logRequestStart(supabase, requestId, entity, operation);

    try {
      // Execute handler
      const result = await handler(data);

      // Log success
      await logRequestComplete(supabase, requestId, result, "completed");

      return result;
    } catch (error) {
      // Log failure
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      await logRequestComplete(supabase, requestId, null, "failed", errorMsg);

      throw error;
    }
  };
}

// ============================================================================
// STATS & MONITORING
// ============================================================================

/**
 * Get idempotency statistics
 */
export async function getIdempotencyStats(supabase: SupabaseClient): Promise<{
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  processingRequests: number;
  memoryCacheSize: number;
}> {
  const { data, error } = await supabase
    .from("request_log")
    .select("status")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

  if (error || !data) {
    return {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      processingRequests: 0,
      memoryCacheSize: memoryCache.size(),
    };
  }

  const stats = data.reduce(
    (acc, row) => {
      acc.totalRequests++;
      if (row.status === "completed") acc.completedRequests++;
      if (row.status === "failed") acc.failedRequests++;
      if (row.status === "processing") acc.processingRequests++;
      return acc;
    },
    {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      processingRequests: 0,
      memoryCacheSize: memoryCache.size(),
    },
  );

  return stats;
}
