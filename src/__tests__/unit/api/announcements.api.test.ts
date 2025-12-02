/**
 * Announcements API Unit Tests
 * Tests for system announcements management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllAnnouncements,
  getAnnouncementStats,
  createAnnouncement,
  deleteAnnouncement,
} from '../../../lib/api/announcements.api';

vi.mock('../../../lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../../lib/middleware', () => ({
  requirePermission: vi.fn((permission, fn) => fn),
  requirePermissionAndOwnership: vi.fn((permission, config, paramIndex, fn) => fn),
}));

import { supabase } from '../../../lib/supabase/client';

const mockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
});

const mockAnnouncements = [
  {
    id: '1',
    judul: 'Test Announcement',
    konten: 'Content',
    prioritas: 'high',
    tanggal_selesai: '2025-12-31',
    users: { full_name: 'Admin', role: 'admin' },
  },
];

describe('Announcements API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllAnnouncements', () => {
    it('should fetch all announcements', async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: mockAnnouncements, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getAllAnnouncements();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('penulis');
    });
  });

  describe('getAnnouncementStats', () => {
    it('should calculate stats correctly', async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: mockAnnouncements, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getAnnouncementStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('highPriority');
    });
  });

  describe('createAnnouncement', () => {
    it('should create announcement', async () => {
      const builder = mockQueryBuilder();
      builder.insert.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await createAnnouncement({
        judul: 'New',
        konten: 'Content',
        prioritas: 'normal',
        penulis_id: 'user-1',
      } as any);

      expect(builder.insert).toHaveBeenCalled();
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete announcement', async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await deleteAnnouncement('1');

      expect(builder.delete).toHaveBeenCalled();
    });
  });
});
