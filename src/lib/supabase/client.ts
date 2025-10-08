/**
 * Supabase Client Configuration
 * 
 * This is the main Supabase client used throughout the app.
 * It handles authentication, database queries, and real-time subscriptions.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'sistem-praktikum-pwa',
    },
  },
});

// Export types for use in other files
export type SupabaseClient = typeof supabase;