/**
 * Reports API Unit Tests
 * Tests for generating reports and statistics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBorrowingStats,
  getEquipmentStats,
  getLabUsageStats,
  getTopBorrowedItems,
  getBorrowingTrends,
  getLabUtilization,
  getRecentActivities,
} from '../../../lib/api/reports.api';

vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../../lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../../../lib/utils/errors', () => ({
  handleSupabaseError: vi.fn((error) => error),
}));

import { supabase } from '../../../lib/supabase/client';

const mockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
});

describe('Reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBorrowingStats', () => {
    it('should calculate borrowing statistics', async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { status: 'pending', jumlah_pinjam: 2 },
          { status: 'approved', jumlah_pinjam: 5 },
          { status: 'returned', jumlah_pinjam: 3 },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getBorrowingStats();

      expect(stats).toHaveProperty('total_borrowings', 3);
      expect(stats).toHaveProperty('pending', 1);
      expect(stats).toHaveProperty('total_equipment_borrowed', 10);
    });
  });

  describe('getEquipmentStats', () => {
    it('should calculate equipment statistics', async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 3, kategori: 'Alat Medis' },
          { jumlah: 5, jumlah_tersedia: 0, kategori: 'Elektronik' },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      expect(stats).toHaveProperty('total_items', 2);
      expect(stats).toHaveProperty('out_of_stock', 1);
    });
  });

  describe('getLabUsageStats', () => {
    it('should calculate lab usage statistics', async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [{ kapasitas: 30 }],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getLabUsageStats();

      expect(stats).toHaveProperty('total_labs');
      expect(stats).toHaveProperty('total_capacity');
    });
  });

  describe('getTopBorrowedItems', () => {
    it('should return top borrowed items', async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          {
            inventaris_id: 'inv-1',
            jumlah_pinjam: 5,
            inventaris: { kode_barang: 'ALT001', nama_barang: 'Item 1', kategori: 'Cat1' },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getTopBorrowedItems(10);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('total_borrowed');
    });
  });

  describe('getBorrowingTrends', () => {
    it('should return borrowing trends', async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [
          { created_at: '2024-01-01', status: 'approved' },
          { created_at: '2024-01-01', status: 'rejected' },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getBorrowingTrends(30);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getLabUtilization', () => {
    it('should calculate lab utilization', async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: 'lab-1',
            jam_mulai: '08:00',
            jam_selesai: '10:00',
            laboratorium: { kode_lab: 'LAB1', nama_lab: 'Lab 1' },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRecentActivities', () => {
    it('should return recent activities', async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [
          {
            id: '1',
            status: 'pending',
            created_at: '2024-01-01',
            peminjam: { user: { full_name: 'User' } },
            inventaris: { nama_barang: 'Item' },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('type');
    });
  });
});
