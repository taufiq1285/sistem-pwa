/**
 * Supabase Database Helpers
 */

import { supabase } from './client';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Generic fetch function with error handling
 */
export async function fetchData<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await query;
  
  if (error) {
    console.error('Database error:', error);
    throw new Error(error.message);
  }
  
  if (!data) {
    throw new Error('No data returned');
  }
  
  return data;
}

/**
 * Check database connection
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
}

/**
 * Get table row count
 */
export async function getTableCount(tableName: string): Promise<number> {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  if (error) throw error;
  return count || 0;
}