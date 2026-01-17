/**
 * useSupabase Hook
 * Provides access to Supabase client in React components
 */

import { useMemo } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Hook for accessing Supabase client
 * Memoizes the client instance to prevent unnecessary re-renders
 * @returns Supabase client instance
 */
export function useSupabase() {
  return useMemo(() => supabase, []);
}
