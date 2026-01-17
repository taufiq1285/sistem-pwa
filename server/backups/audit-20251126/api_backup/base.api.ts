/**
 * Base API Layer
 * Core API utilities for all API modules - CRUD operations with error handling
 */

import { supabase } from '@/lib/supabase/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  QueryParams,
  SupabaseQueryOptions,
} from '@/types/api.types';
import {
  handleError,
  logError,
  BaseApiError,
  NotFoundError,
} from '@/lib/utils/errors';

// =NPM==========================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Base query options
 */
interface BaseQueryOptions extends SupabaseQueryOptions {
  throwOnEmpty?: boolean;
}

/**
 * Filter options for queries
 */
interface FilterOptions {
  column: string;
  // PERBAIKAN: Kita kembalikan ke 'any' karena filter bisa menerima tipe apa saja
   
  value: any;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
}

// ============================================================================
// GENERIC QUERY FUNCTIONS
// ============================================================================

/**
 * Generic SELECT query
 * @param table - Table name
 * @param options - Query options
 * @returns Array of records
 */
 
export async function query<T = any>(
  table: string,
  options: BaseQueryOptions = {}
): Promise<T[]> {
  // Check if offline - return empty array instead of throwing error
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return [] as T[];
  }

  try {
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .select(options.select || '*');

    // Apply ordering
    if (options.order) {
      queryBuilder = queryBuilder.order(
        options.order.column,
        { ascending: options.order.ascending ?? true }
      );
    }

    // Apply limit
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    // Apply offset
    if (options.offset) {
      queryBuilder = queryBuilder.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = options.single
      ? await queryBuilder.single()
      : await queryBuilder;

    if (error) {
      throw handleError(error);
    }

    if (options.throwOnEmpty && (!data || (Array.isArray(data) && data.length === 0))) {
      throw new NotFoundError(`No records found in ${table}`);
    }

    return (Array.isArray(data) ? data : [data]) as T[];
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `query:${table}`);
    throw apiError;
  }
}

/**
 * Generic SELECT query with filters
 * @param table - Table name
 * @param filters - Filter conditions
 * @param options - Query options
 * @returns Array of records
 */
 
export async function queryWithFilters<T = any>(
  table: string,
  filters: FilterOptions[],
  options: BaseQueryOptions = {}
): Promise<T[]> {
  // Check if offline - return empty array instead of throwing error
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return [] as T[];
  }

  try {
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .select(options.select || '*');

    // Apply filters
    filters.forEach((filter) => {
      const operator = filter.operator || 'eq';
      switch (operator) {
        case 'eq':
          queryBuilder = queryBuilder.eq(filter.column, filter.value);
          break;
        case 'neq':
          queryBuilder = queryBuilder.neq(filter.column, filter.value);
          break;
        case 'gt':
          queryBuilder = queryBuilder.gt(filter.column, filter.value);
          break;
        case 'gte':
          queryBuilder = queryBuilder.gte(filter.column, filter.value);
          break;
        case 'lt':
          queryBuilder = queryBuilder.lt(filter.column, filter.value);
          break;
        case 'lte':
          queryBuilder = queryBuilder.lte(filter.column, filter.value);
          break;
        case 'like':
          queryBuilder = queryBuilder.like(filter.column, filter.value);
          break;
        case 'ilike':
          queryBuilder = queryBuilder.ilike(filter.column, filter.value);
          break;
        case 'in':
          queryBuilder = queryBuilder.in(filter.column, filter.value);
          break;
        case 'is':
          queryBuilder = queryBuilder.is(filter.column, filter.value);
          break;
      }
    });

    // Apply ordering
    if (options.order) {
      queryBuilder = queryBuilder.order(
        options.order.column,
        { ascending: options.order.ascending ?? true }
      );
    }

    // Apply limit
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    // Apply offset
    if (options.offset) {
      queryBuilder = queryBuilder.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw handleError(error);
    }

    if (options.throwOnEmpty && (!data || data.length === 0)) {
      throw new NotFoundError(`No records found in ${table}`);
    }

    return (data || []) as T[];
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `queryWithFilters:${table}`);
    throw apiError;
  }
}

/**
 * Get single record by ID
 * @param table - Table name
 * @param id - Record ID
 * @param options - Query options
 * @returns Single record
 */
 
export async function getById<T = any>(
  table: string,
  id: string,
  options: BaseQueryOptions = {}
): Promise<T> {
  try {
    const { data, error } = await supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .select(options.select || '*')
      .eq('id', id)
      .single();

    if (error) {
      throw handleError(error);
    }

    if (!data) {
      throw new NotFoundError(`Record with id ${id} not found in ${table}`);
    }

    return data as T;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getById:${table}:${id}`);
    throw apiError;
  }
}

/**
 * Get paginated results
 * @param table - Table name
 * @param params - Query parameters with pagination
 * @param options - Query options
 * @returns Paginated response
 */
 
export async function getPaginated<T = any>(
  table: string,
  params: QueryParams = {},
  options: BaseQueryOptions = {}
): Promise<PaginatedResponse<T>> {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || params.limit || 10;
    const offset = (page - 1) * pageSize;

    // Get total count
    const { count, error: countError } = await supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw handleError(countError);
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get data
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .select(options.select || '*')
      .range(offset, offset + pageSize - 1);

    // Apply ordering
    if (params.sortBy) {
      queryBuilder = queryBuilder.order(
        params.sortBy,
        { ascending: params.sortOrder === 'asc' }
      );
    } else if (options.order) {
      queryBuilder = queryBuilder.order(
        options.order.column,
        { ascending: options.order.ascending ?? true }
      );
    }

    // Apply search
    if (params.search && options.select) {
      // Extract first text column for search
      const searchColumn = options.select.split(',')[0].trim();
      queryBuilder = queryBuilder.ilike(searchColumn, `%${params.search}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw handleError(error);
    }

    const pagination: PaginationMeta = {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      data: (data || []) as T[],
      pagination,
      success: true,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getPaginated:${table}`);
    throw apiError;
  }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Insert single record
 * @param table - Table name
 * @param data - Record data
 * @returns Inserted record
 */
 
export async function insert<T = any>(
  table: string,
  data: Partial<T>
): Promise<T> {
  try {
    const { data: result, error } = await supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw handleError(error);
    }

    if (!result) {
      throw new BaseApiError('Insert failed - no data returned');
    }

    return result as T;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `insert:${table}`);
    throw apiError;
  }
}

/**
 * Insert multiple records
 * @param table - Table name
 * @param data - Array of records
 * @returns Inserted records
 */
 
export async function insertMany<T = any>(
  table: string,
  data: Partial<T>[]
): Promise<T[]> {
  try {
    const { data: result, error } = await supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .insert(data)
      .select();

    if (error) {
      throw handleError(error);
    }

    return (result || []) as T[];
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `insertMany:${table}`);
    throw apiError;
  }
}

/**
 * Update record by ID
 * @param table - Table name
 * @param id - Record ID
 * @param data - Update data
 * @returns Updated record
 */
 
export async function update<T = any>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<T> {
  try {
    const { data: result, error } = await supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleError(error);
    }

    if (!result) {
      throw new NotFoundError(`Record with id ${id} not found in ${table}`);
    }

    return result as T;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `update:${table}:${id}`);
    throw apiError;
  }
}

/**
 * Update multiple records with filters
 * @param table - Table name
 * @param filters - Filter conditions
 * @param data - Update data
 * @returns Updated records
 */
 
export async function updateMany<T = any>(
  table: string,
  filters: FilterOptions[],
  data: Partial<T>
): Promise<T[]> {
  try {
    // PERBAIKAN 'prefer-const': 'const' diubah menjadi 'let'
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .update(data);

    // PERBAIKAN 'prefer-const': Menggunakan logic 'switch' yang aman
    filters.forEach((filter) => {
      const operator = filter.operator || 'eq';
      switch (operator) {
        case 'eq':
          queryBuilder = queryBuilder.eq(filter.column, filter.value);
          break;
        case 'neq':
          queryBuilder = queryBuilder.neq(filter.column, filter.value);
          break;
        case 'gt':
          queryBuilder = queryBuilder.gt(filter.column, filter.value);
          break;
        case 'gte':
          queryBuilder = queryBuilder.gte(filter.column, filter.value);
          break;
        case 'lt':
          queryBuilder = queryBuilder.lt(filter.column, filter.value);
          break;
        case 'lte':
          queryBuilder = queryBuilder.lte(filter.column, filter.value);
          break;
        case 'like':
          queryBuilder = queryBuilder.like(filter.column, filter.value);
          break;
        case 'ilike':
          queryBuilder = queryBuilder.ilike(filter.column, filter.value);
          break;
        case 'in':
          queryBuilder = queryBuilder.in(filter.column, filter.value);
          break;
        case 'is':
          queryBuilder = queryBuilder.is(filter.column, filter.value);
          break;
      }
    });

    const { data: result, error } = await queryBuilder.select();

    if (error) {
      throw handleError(error);
    }

    return (result || []) as T[];
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateMany:${table}`);
    throw apiError;
  }
}

/**
 * Delete record by ID
 * @param table - Table name
 * @param id - Record ID
 * @returns Success status
 */
export async function remove(
  table: string,
  id: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .delete()
      .eq('id', id);

    if (error) {
      throw handleError(error);
    }

    return true;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `remove:${table}:${id}`);
    throw apiError;
  }
}

/**
 * Delete multiple records with filters
 * @param table - Table name
 * @param filters - Filter conditions
 * @returns Success status
 */
export async function removeMany(
  table: string,
  filters: FilterOptions[]
): Promise<boolean> {
  try {
    // PERBAIKAN 'prefer-const': 'const' diubah menjadi 'let'
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .delete();

    // PERBAIKAN 'prefer-const': Menggunakan logic 'switch' yang aman
    filters.forEach((filter) => {
      const operator = filter.operator || 'eq';
      switch (operator) {
        case 'eq':
          queryBuilder = queryBuilder.eq(filter.column, filter.value);
          break;
        case 'neq':
          queryBuilder = queryBuilder.neq(filter.column, filter.value);
          break;
        case 'gt':
          queryBuilder = queryBuilder.gt(filter.column, filter.value);
          break;
        case 'gte':
          queryBuilder = queryBuilder.gte(filter.column, filter.value);
          break;
        case 'lt':
          queryBuilder = queryBuilder.lt(filter.column, filter.value);
          break;
        case 'lte':
          queryBuilder = queryBuilder.lte(filter.column, filter.value);
          break;
        case 'like':
          queryBuilder = queryBuilder.like(filter.column, filter.value);
          break;
        case 'ilike':
          queryBuilder = queryBuilder.ilike(filter.column, filter.value);
          break;
        case 'in':
          queryBuilder = queryBuilder.in(filter.column, filter.value);
          break;
        case 'is':
          queryBuilder = queryBuilder.is(filter.column, filter.value);
          break;
      }
    });

    const { error } = await queryBuilder;

    if (error) {
      throw handleError(error);
    }

    return true;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `removeMany:${table}`);
    throw apiError;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if record exists
 * @param table - Table name
 * @param id - Record ID
 * @returns Boolean indicating existence
 */
export async function exists(
  table: string,
  id: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .select('id')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw handleError(error);
    }

    return !!data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `exists:${table}:${id}`);
    return false;
  }
}

/**
 * Count records with optional filters
 * @param table - Table name
 * @param filters - Optional filter conditions
 * @returns Record count
 */
export async function count(
  table: string,
  filters?: FilterOptions[]
): Promise<number> {
  try {
    // PERBAIKAN 'prefer-const': 'const' diubah menjadi 'let'
    let queryBuilder = supabase
      // PERBAIKAN: 'as any' diperlukan di sini untuk generic API
       
      .from(table as any)
      .select('*', { count: 'exact', head: true });

    // Apply filters
    if (filters && filters.length > 0) {
      // PERBAIKAN 'prefer-const': Menggunakan logic 'switch' yang aman
      filters.forEach((filter) => {
        const operator = filter.operator || 'eq';
        switch (operator) {
          case 'eq':
            queryBuilder = queryBuilder.eq(filter.column, filter.value);
            break;
          case 'neq':
            queryBuilder = queryBuilder.neq(filter.column, filter.value);
            break;
          case 'gt':
            queryBuilder = queryBuilder.gt(filter.column, filter.value);
            break;
          case 'gte':
            queryBuilder = queryBuilder.gte(filter.column, filter.value);
            break;
          case 'lt':
            queryBuilder = queryBuilder.lt(filter.column, filter.value);
            break;
          case 'lte':
            queryBuilder = queryBuilder.lte(filter.column, filter.value);
            break;
          case 'like':
            queryBuilder = queryBuilder.like(filter.column, filter.value);
            break;
          case 'ilike':
            queryBuilder = queryBuilder.ilike(filter.column, filter.value);
            break;
          case 'in':
            queryBuilder = queryBuilder.in(filter.column, filter.value);
            break;
          case 'is':
            queryBuilder = queryBuilder.is(filter.column, filter.value);
            break;
        }
      });
    }

    const { count, error } = await queryBuilder;

    if (error) {
      throw handleError(error);
    }

    return count || 0;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `count:${table}`);
    throw apiError;
  }
}

// ============================================================================
// WRAPPER FUNCTION FOR RESPONSE FORMAT
// ============================================================================

/**
 * Wrap API call in standard response format
 * @param fn - Async function to execute
 * @returns Standard API response
 */
export async function withApiResponse<T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const apiError = handleError(error);
    return {
      success: false,
      error: apiError.toJSON(),
      message: apiError.message,
      timestamp: new Date().toISOString(),
    };
  }
}