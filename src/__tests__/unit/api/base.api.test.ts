/**
 * Base API Unit Tests
 *
 * Tests for core API wrapper functions:
 * - Query functions
 * - CRUD operations
 * - Utility functions
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  query,
  queryWithFilters,
  getById,
  getPaginated,
  insert,
  insertMany,
  update,
  updateMany,
  remove,
  removeMany,
  exists,
  count,
  withApiResponse,
} from '../../../lib/api/base.api';
import { supabase } from '../../../lib/supabase/client';
import { NotFoundError, BaseApiError } from '../../../lib/utils/errors';

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../../lib/utils/errors', () => ({
  handleError: vi.fn((error) => error),
  logError: vi.fn(),
  BaseApiError: class BaseApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'BaseApiError';
    }
    toJSON() {
      return { name: this.name, message: this.message };
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
}));

// ============================================================================
// TEST HELPERS
// ============================================================================

const mockQueryBuilder = () => {
  let resolveValue = { data: null, error: null };

  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    // Make builder awaitable - returns a promise that resolves to resolveValue
    then: vi.fn((onFulfilled) => Promise.resolve(resolveValue).then(onFulfilled)),
    // Helper method to set what the builder resolves to
    _setResolveValue: (value: any) => {
      resolveValue = value;
      return builder;
    },
  };
  return builder;
};

const mockData = [
  { id: '1', name: 'Test 1', value: 10 },
  { id: '2', name: 'Test 2', value: 20 },
  { id: '3', name: 'Test 3', value: 30 },
];

// ============================================================================
// QUERY FUNCTIONS TESTS
// ============================================================================

describe('Base API - Query Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query', () => {
    it('should fetch all records from a table', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await query('test_table');

      expect(supabase.from).toHaveBeenCalledWith('test_table');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockData); // Returns array directly
    });

    it('should apply select option', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await query('test_table', { select: 'id,name', single: true });

      expect(builder.select).toHaveBeenCalledWith('id,name');
    });

    it('should apply order option', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await query('test_table', {
        order: { column: 'name', ascending: false },
      });

      expect(builder.order).toHaveBeenCalledWith('name', { ascending: false });
    });

    it('should apply limit option', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await query('test_table', { limit: 5 });

      expect(builder.limit).toHaveBeenCalledWith(5);
    });

    it('should apply offset with range', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await query('test_table', { offset: 10, limit: 5 });

      expect(builder.range).toHaveBeenCalledWith(10, 14);
    });

    it('should throw NotFoundError when throwOnEmpty is true and no data', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: [], error: null });
      (supabase.from as any).mockReturnValue(builder);

      await expect(
        query('test_table', { throwOnEmpty: true })
      ).rejects.toThrow('No records found');
    });

    it('should return empty array when offline', async () => {
      const originalNavigator = global.navigator;
      Object.defineProperty(global, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      const result = await query('test_table');

      expect(result).toEqual([]);

      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });
  });

  describe('queryWithFilters', () => {
    it('should apply eq filter', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await queryWithFilters('test_table', [
        { column: 'status', value: 'active', operator: 'eq' },
      ]);

      expect(builder.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should apply multiple filters', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await queryWithFilters('test_table', [
        { column: 'status', value: 'active' },
        { column: 'value', value: 10, operator: 'gt' },
      ]);

      expect(builder.eq).toHaveBeenCalledWith('status', 'active');
      expect(builder.gt).toHaveBeenCalledWith('value', 10);
    });

    it('should apply all filter operators', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await queryWithFilters('test_table', [
        { column: 'a', value: 1, operator: 'neq' },
        { column: 'b', value: 2, operator: 'gte' },
        { column: 'c', value: 3, operator: 'lt' },
        { column: 'd', value: 4, operator: 'lte' },
        { column: 'e', value: 'test%', operator: 'like' },
        { column: 'f', value: 'test%', operator: 'ilike' },
        { column: 'g', value: [1, 2, 3], operator: 'in' },
        { column: 'h', value: null, operator: 'is' },
      ]);

      expect(builder.neq).toHaveBeenCalled();
      expect(builder.gte).toHaveBeenCalled();
      expect(builder.lt).toHaveBeenCalled();
      expect(builder.lte).toHaveBeenCalled();
      expect(builder.like).toHaveBeenCalled();
      expect(builder.ilike).toHaveBeenCalled();
      expect(builder.in).toHaveBeenCalled();
      expect(builder.is).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch single record by ID', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({ data: mockData[0], error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await getById('test_table', '1');

      expect(builder.eq).toHaveBeenCalledWith('id', '1');
      expect(builder.single).toHaveBeenCalled();
      expect(result).toEqual(mockData[0]);
    });

    it('should throw NotFoundError when record not found', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await expect(getById('test_table', 'nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getPaginated', () => {
    it('should return paginated results with metadata', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });

      // Mock count query
      const countBuilder = {
        ...mockQueryBuilder(),
        select: vi.fn().mockResolvedValue({ count: 25, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(countBuilder) // First call for count
        .mockReturnValueOnce(builder); // Second call for data

      const result = await getPaginated('test_table', {
        page: 1,
        pageSize: 10,
      });

      expect(result.data).toEqual(mockData);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        totalItems: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should calculate correct pagination for last page', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });

      const countBuilder = {
        ...mockQueryBuilder(),
        select: vi.fn().mockResolvedValue({ count: 25, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(builder);

      const result = await getPaginated('test_table', {
        page: 3,
        pageSize: 10,
      });

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });

    it('should apply sorting', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ data: mockData, error: null });

      const countBuilder = {
        ...mockQueryBuilder(),
        select: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(builder);

      await getPaginated('test_table', {
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'desc',
      });

      expect(builder.order).toHaveBeenCalledWith('name', { ascending: false });
    });
  });
});

// ============================================================================
// CRUD OPERATIONS TESTS
// ============================================================================

describe('Base API - CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('insert', () => {
    it('should insert single record', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({ data: mockData[0], error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await insert('test_table', { name: 'New Item' });

      expect(builder.insert).toHaveBeenCalledWith({ name: 'New Item' });
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();
      expect(result).toEqual(mockData[0]);
    });

    it('should throw error when insert fails', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await expect(
        insert('test_table', { name: 'New Item' })
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('insertMany', () => {
    it('should insert multiple records', async () => {
      const builder = mockQueryBuilder();
      (builder.select as any).mockResolvedValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const records = [{ name: 'Item 1' }, { name: 'Item 2' }];
      const result = await insertMany('test_table', records);

      expect(builder.insert).toHaveBeenCalledWith(records);
      expect(result).toEqual(mockData);
    });
  });

  describe('update', () => {
    it('should update record by ID', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({
        data: { ...mockData[0], name: 'Updated' },
        error: null,
      });
      (supabase.from as any).mockReturnValue(builder);

      const result = await update('test_table', '1', { name: 'Updated' });

      expect(builder.update).toHaveBeenCalledWith({ name: 'Updated' });
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundError when record not found', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: null });
      (supabase.from as any).mockReturnValue(builder);

      await expect(
        update('test_table', 'nonexistent', { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateMany', () => {
    it('should update multiple records with filters', async () => {
      const builder = mockQueryBuilder();
      (builder.select as any).mockResolvedValue({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await updateMany(
        'test_table',
        [{ column: 'status', value: 'active' }],
        { archived: true }
      );

      expect(builder.update).toHaveBeenCalledWith({ archived: true });
      expect(builder.eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toEqual(mockData);
    });
  });

  describe('remove', () => {
    it('should delete record by ID', async () => {
      const builder = mockQueryBuilder();
      (builder.eq as any).mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await remove('test_table', '1');

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toBe(true);
    });
  });

  describe('removeMany', () => {
    it('should delete multiple records with filters', async () => {
      const builder = mockQueryBuilder();
      builder._setResolveValue({ error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await removeMany('test_table', [
        { column: 'status', value: 'deleted' },
      ]);

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('status', 'deleted');
      expect(result).toBe(true);
    });
  });
});

// ============================================================================
// UTILITY FUNCTIONS TESTS
// ============================================================================

describe('Base API - Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({ data: { id: '1' }, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await exists('test_table', '1');

      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      (supabase.from as any).mockReturnValue(builder);

      const result = await exists('test_table', 'nonexistent');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const builder = mockQueryBuilder();
      builder.single.mockRejectedValue(new Error('DB Error'));
      (supabase.from as any).mockReturnValue(builder);

      const result = await exists('test_table', '1');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all records', async () => {
      const builder = mockQueryBuilder();
      // Set what the builder resolves to (count returns { count, error })
      builder._setResolveValue({ count: 42, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await count('test_table');

      expect(result).toBe(42);
      expect(builder.select).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
    });

    it('should count records with filters', async () => {
      const builder = mockQueryBuilder();
      // Set what the builder resolves to (count returns { count, error })
      builder._setResolveValue({ count: 10, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await count('test_table', [
        { column: 'status', value: 'active' },
      ]);

      expect(result).toBe(10);
      expect(builder.select).toHaveBeenCalledWith('*', {
        count: 'exact',
        head: true,
      });
      expect(builder.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should return 0 when count is null', async () => {
      const builder = mockQueryBuilder();
      // Set what the builder resolves to (count returns { count, error })
      builder._setResolveValue({ count: null, error: null });
      (supabase.from as any).mockReturnValue(builder);

      const result = await count('test_table');

      expect(result).toBe(0);
    });
  });

  describe('withApiResponse', () => {
    it('should wrap successful response', async () => {
      const mockFn = vi.fn().mockResolvedValue({ id: '1', name: 'Test' });

      const result = await withApiResponse(mockFn);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '1', name: 'Test' });
      expect(result.timestamp).toBeDefined();
    });

    it('should wrap error response', async () => {
      const error = new BaseApiError('Test error');
      const mockFn = vi.fn().mockRejectedValue(error);

      const result = await withApiResponse(mockFn);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Test error');
      expect(result.error).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Base API - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete CRUD workflow', async () => {
    const builder = mockQueryBuilder();

    // Insert
    builder.single.mockResolvedValueOnce({
      data: { id: 'new-id', name: 'Test' },
      error: null,
    });
    (supabase.from as any).mockReturnValue(builder);

    const inserted = await insert('test_table', { name: 'Test' });
    expect(inserted.id).toBe('new-id');

    // Read
    builder.single.mockResolvedValueOnce({
      data: { id: 'new-id', name: 'Test' },
      error: null,
    });
    const fetched = await getById('test_table', 'new-id');
    expect(fetched.name).toBe('Test');

    // Update
    builder.single.mockResolvedValueOnce({
      data: { id: 'new-id', name: 'Updated' },
      error: null,
    });
    const updated = await update('test_table', 'new-id', { name: 'Updated' });
    expect(updated.name).toBe('Updated');

    // Delete
    (builder.eq as any).mockResolvedValueOnce({ error: null });
    const deleted = await remove('test_table', 'new-id');
    expect(deleted).toBe(true);
  });
});
