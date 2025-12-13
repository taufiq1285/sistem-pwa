/**
 * API Idempotency Implementation Examples
 *
 * FASE 2 - Complete examples showing how to implement idempotency
 * in different scenarios and frameworks
 */

// ============================================================================
// EXAMPLE 1: Express.js with Middleware
// ============================================================================

/**
 * Express.js API with idempotency middleware
 */
import express from "express";
import { createSupabaseClient } from "@supabase/supabase-js";
import { createIdempotencyMiddleware } from "../middleware/idempotency.middleware.example";

const app = express();
const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

// Create idempotency middleware
const idempotency = createIdempotencyMiddleware(supabase, {
  enabled: true,
  extractRequestId: (req) => req.body._requestId,
  extractMetadata: (req) => {
    // Extract from URL path
    const match = req.path.match(/\/api\/(\w+)/);
    return {
      entity: match?.[1] || "unknown",
      operation: req.method.toLowerCase(),
    };
  },
  skipPaths: ["/health", "/metrics"],
});

// Apply middleware to specific routes
app.post("/api/kuis/submit", idempotency, async (req, res) => {
  try {
    const { kuis_id, jawaban, waktu_mulai, waktu_selesai } = req.body;

    // Your business logic here
    const { data, error } = await supabase.from("kuis_jawaban").insert({
      kuis_id,
      mahasiswa_id: req.user.id,
      jawaban,
      waktu_mulai,
      waktu_selesai,
    });

    if (error) throw error;

    // Calculate score
    const score = calculateScore(jawaban);

    res.json({
      success: true,
      data,
      score,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// EXAMPLE 2: Next.js API Route
// ============================================================================

/**
 * Next.js API Route with manual idempotency check
 */
import { NextApiRequest, NextApiResponse } from "next";
import { handleIdempotency } from "../middleware/idempotency.middleware.example";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { _requestId, ...data } = req.body;

  // Check idempotency manually
  if (_requestId) {
    const existing = await handleIdempotency(supabase, _requestId);
    if (existing) {
      console.log(`✅ Idempotent return for: ${_requestId}`);
      return res.status(200).json(existing.result);
    }
  }

  // Log request start if requestId present
  if (_requestId) {
    await supabase.rpc("log_request_start", {
      p_request_id: _requestId,
      p_entity: "kuis_jawaban",
      p_operation: "create",
    });
  }

  try {
    // Process the request
    const result = await processQuizSubmission(data);

    // Log completion
    if (_requestId) {
      await supabase.rpc("log_request_complete", {
        p_request_id: _requestId,
        p_result: result,
        p_status: "completed",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    // Log failure
    if (_requestId) {
      await supabase.rpc("log_request_complete", {
        p_request_id: _requestId,
        p_result: null,
        p_status: "failed",
        p_error: error.message,
      });
    }

    return res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// EXAMPLE 3: Supabase Edge Function
// ============================================================================

/**
 * Supabase Edge Function with idempotency
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Parse request
  const body = await req.json();
  const { _requestId, ...data } = body;

  // Create Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
  );

  // Check idempotency if requestId present
  if (_requestId) {
    const { data: existing, error } = await supabase.rpc(
      "check_request_idempotency",
      {
        p_request_id: _requestId,
      },
    );

    if (existing?.[0]?.exists && existing[0].status === "completed") {
      return new Response(JSON.stringify(existing[0].result), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Log start
    await supabase.rpc("log_request_start", {
      p_request_id: _requestId,
      p_entity: "kuis_jawaban",
      p_operation: "create",
    });
  }

  try {
    // Process request
    const result = await processData(supabase, data);

    // Log success
    if (_requestId) {
      await supabase.rpc("log_request_complete", {
        p_request_id: _requestId,
        p_result: result,
        p_status: "completed",
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Log failure
    if (_requestId) {
      await supabase.rpc("log_request_complete", {
        p_request_id: _requestId,
        p_result: null,
        p_status: "failed",
        p_error: error.message,
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// ============================================================================
// EXAMPLE 4: Using withIdempotency Wrapper
// ============================================================================

/**
 * Wrap business logic with idempotency
 */
import { withIdempotency } from "../middleware/idempotency.middleware.example";

// Define your business logic
async function submitQuizLogic(data: any) {
  const { kuis_id, jawaban, waktu_mulai, waktu_selesai, mahasiswa_id } = data;

  // Insert answer
  const { data: answer, error } = await supabase.from("kuis_jawaban").insert({
    kuis_id,
    mahasiswa_id,
    jawaban,
    waktu_mulai,
    waktu_selesai,
  });

  if (error) throw error;

  // Calculate score
  const score = await calculateQuizScore(kuis_id, jawaban);

  return {
    success: true,
    answer,
    score,
  };
}

// Wrap with idempotency
const submitQuizIdempotent = withIdempotency(supabase, submitQuizLogic);

// Use in API handler
app.post("/api/kuis/submit", async (req, res) => {
  try {
    const { _requestId, ...data } = req.body;

    if (_requestId) {
      // Use idempotent version
      const result = await submitQuizIdempotent(
        _requestId,
        data,
        "kuis_jawaban",
        "create",
      );
      return res.json(result);
    } else {
      // Fallback to regular processing (backward compatible)
      const result = await submitQuizLogic(data);
      return res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXAMPLE 5: Client-Side Usage
// ============================================================================

/**
 * How to call the API from client with idempotency
 */

// Using enhanced queue manager (auto-adds requestId)
import { idempotentQueueManager } from "@/lib/offline/queue-manager-idempotent";

async function submitQuizOffline(quizData: any) {
  // Queue will automatically add requestId
  await idempotentQueueManager.enqueue("kuis_jawaban", "create", quizData);

  // When synced, requestId will be sent to server
  // Server will check for duplicates
}

// Manual usage with requestId
import { generateRequestId } from "@/lib/utils/idempotency";

async function submitQuizWithIdempotency(quizData: any) {
  // Generate requestId
  const requestId = generateRequestId("kuis_jawaban", "create");

  // Add to data
  const dataWithRequestId = {
    ...quizData,
    _requestId: requestId,
  };

  // Submit to API
  const response = await fetch("/api/kuis/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataWithRequestId),
  });

  return response.json();
}

// ============================================================================
// EXAMPLE 6: Testing Idempotency
// ============================================================================

/**
 * Test that idempotency works
 */
async function testIdempotency() {
  const quizData = {
    kuis_id: "test-123",
    jawaban: { q1: "A", q2: "B" },
    waktu_mulai: new Date().toISOString(),
    waktu_selesai: new Date().toISOString(),
  };

  // First request
  const requestId = generateRequestId("kuis_jawaban", "create");
  const dataWithId = { ...quizData, _requestId: requestId };

  console.log("🔄 Submitting first request...");
  const response1 = await fetch("/api/kuis/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataWithId),
  });
  const result1 = await response1.json();
  console.log("✅ First request result:", result1);

  // Second request (same requestId - should return cached)
  console.log("🔄 Submitting duplicate request...");
  const response2 = await fetch("/api/kuis/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataWithId), // Same data & requestId
  });
  const result2 = await response2.json();
  console.log("✅ Second request result (should be identical):", result2);

  // Verify both results are identical
  console.assert(
    JSON.stringify(result1) === JSON.stringify(result2),
    "Results should be identical!",
  );
  console.log("✅ Idempotency test passed!");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function calculateScore(jawaban: any): Promise<number> {
  // Mock implementation
  return 85;
}

async function calculateQuizScore(
  kuisId: string,
  jawaban: any,
): Promise<number> {
  // Mock implementation
  return 85;
}

async function processQuizSubmission(data: any): Promise<any> {
  // Mock implementation
  return { success: true, score: 85 };
}

async function processData(supabase: any, data: any): Promise<any> {
  // Mock implementation
  return { success: true };
}
