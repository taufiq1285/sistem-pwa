/**
 * Announcements API for Admin
 * Full CRUD for managing system announcements
 */

import { supabase } from '@/lib/supabase/client';
import type { Pengumuman, CreatePengumumanData } from '@/types/common.types';

export interface AnnouncementStats {
  total: number;
  active: number;
  highPriority: number;
  scheduled: number;
}

/**
 * Get all announcements with filters
 */
export async function getAllAnnouncements(): Promise<Pengumuman[]> {
  try {
    const { data, error } = await supabase
      .from('pengumuman')
      .select(`
        id,
        judul,
        konten,
        tipe,
        prioritas,
        target_role,
        created_at,
        updated_at,
        tanggal_mulai,
        tanggal_selesai,
        attachment_url,
        penulis_id,
        users!pengumuman_penulis_id_fkey(full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      penulis: item.users ? { full_name: item.users.full_name, role: item.users.role } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
}

/**
 * Get announcement statistics
 */
export async function getAnnouncementStats(): Promise<AnnouncementStats> {
  try {
    const announcements = await getAllAnnouncements();
    const now = new Date().toISOString();

    return {
      total: announcements.length,
      active: announcements.filter(a => {
        const isActive = (!a.tanggal_selesai || a.tanggal_selesai > now);
        return isActive;
      }).length,
      highPriority: announcements.filter(a => a.prioritas === 'high').length,
      scheduled: announcements.filter(a => a.tanggal_mulai && a.tanggal_mulai > now).length,
    };
  } catch (error) {
    console.error('Error fetching announcement stats:', error);
    return { total: 0, active: 0, highPriority: 0, scheduled: 0 };
  }
}

/**
 * Create new announcement
 */
export async function createAnnouncement(data: CreatePengumumanData): Promise<void> {
  try {
    const { error } = await supabase
      .from('pengumuman')
      .insert(data as any);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pengumuman')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}
