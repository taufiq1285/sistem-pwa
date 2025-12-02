/**
 * Peminjaman Extensions API Unit Tests
 * Tests for equipment borrowing and room booking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllPeminjaman,
  markAsReturned,
  getPendingRoomBookings,
  approveRoomBooking,
  rejectRoomBooking,
} from '../../../lib/api/peminjaman-extensions';

vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../../lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../../lib/utils/errors', () => ({
  handleSupabaseError: vi.fn((error) => error),
}));

import { supabase } from '../../../lib/supabase/client';

const mockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
});

describe('Peminjaman Extensions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPeminjaman', () => {
    it('should fetch all peminjaman with details', async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [
          {
            id: '1',
            inventaris_id: 'inv-1',
            peminjam_id: 'mhs-1',
            status: 'pending',
            inventaris: { kode_barang: 'ALT001', nama_barang: 'Item 1', laboratorium: { nama_lab: 'Lab 1' } },
            peminjam: { nim: '123', user: { full_name: 'User' } },
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getAllPeminjaman();

      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should apply status filter', async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [], count: 0, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await getAllPeminjaman({ status: 'approved' });

      expect(builder.eq).toHaveBeenCalledWith('status', 'approved');
    });
  });

  describe('markAsReturned', () => {
    it('should mark peminjaman as returned', async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await markAsReturned('pinjam-1', 'baik', 'Test');

      expect(builder.update).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('status', 'approved');
    });
  });

  describe('getPendingRoomBookings', () => {
    it('should fetch pending room bookings', async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [{ id: 'jadwal-1', kelas_id: 'kelas-1', laboratorium_id: 'lab-1' }],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [{ id: 'kelas-1', nama_kelas: 'Kelas A', mata_kuliah_id: 'mk-1', dosen_id: 'dosen-1' }],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [{ id: 'lab-1', kode_lab: 'LAB1', nama_lab: 'Lab 1', kapasitas: 30 }],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: [{ id: 'mk-1', nama_mk: 'Mata Kuliah' }],
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: [{ id: 'dosen-1', nip: '123', user_id: 'user-1' }],
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: [{ id: 'user-1', full_name: 'Dosen Name' }],
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder as any)
        .mockReturnValueOnce(kelasBuilder as any)
        .mockReturnValueOnce(labBuilder as any)
        .mockReturnValueOnce(mkBuilder as any)
        .mockReturnValueOnce(dosenBuilder as any)
        .mockReturnValueOnce(userBuilder as any);

      const result = await getPendingRoomBookings();

      expect(result).toHaveLength(1);
    });
  });

  describe('approveRoomBooking', () => {
    it('should approve room booking', async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await approveRoomBooking('jadwal-1');

      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: true }));
    });
  });

  describe('rejectRoomBooking', () => {
    it('should reject and delete room booking', async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await rejectRoomBooking('jadwal-1', 'Not available');

      expect(builder.delete).toHaveBeenCalled();
    });
  });
});
