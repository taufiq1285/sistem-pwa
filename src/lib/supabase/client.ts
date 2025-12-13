/**
 * Supabase Client Configuration
 *
 * This is the main Supabase client used throughout the app.
 * It handles authentication, database queries, and real-time subscriptions.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");
}

/**
 * Custom fetch with timeout for Supabase
 * Prevents hanging requests on slow/unreliable connections
 * Using 30s timeout to allow for slow network and auth operations
 */
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for all operations

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Create Supabase client with TypeScript types and custom fetch
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "sistem-praktikum-pwa",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // Use custom fetch with timeout
    fetch: customFetch,
  },
});

// Export types for use in other files
export type SupabaseClient = typeof supabase;
