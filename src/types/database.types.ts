/**
 * Supabase Database Types
 * 
 * TODO: Generate these types from Supabase CLI:
 * npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
 * 
 * For now, using a placeholder type
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // TODO: Add table types after running database migrations
      [key: string]: any;
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
  };
}