/**
 * Peminjaman & Room Booking API Extensions for Laboran
 * Extended functions for managing equipment borrowing and room bookings
 */

import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { handleSupabaseError } from '@/lib/utils/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface PeminjamanDetail {
  id: string;
  inventaris_id: string;
  inventaris_kode: string;
  inventaris_nama: string;
  peminjam_id: string;
  peminjam_nama: string;
  peminjam_nim: string;
  dosen_id: string | null;
  dosen_nama: string | null;
  dosen_nip: string | null;
  jumlah_pinjam: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string | null;
  kondisi_pinjam: string | null;
  kondisi_kembali: string | null;
  keterangan_kembali: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  denda: number | null;
  laboratorium_nama: string;
  created_at: string;
  updated_at: string | null;
}

export interface RoomBookingRequest {
  id: string;
  kelas_id: string | null;
  kelas_nama: string;
  mata_kuliah_nama: string;
  dosen_id: string;
  dosen_nama: string;
  dosen_nip: string;
  laboratorium_id: string;
  laboratorium_nama: string;
  laboratorium_kode: string;
  laboratorium_kapasitas: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tanggal_praktikum: string | null;
  minggu_ke: number | null;
  topik: string | null;
  deskripsi: string | null;
  catatan: string | null;
  created_at: string | null;
}

interface PeminjamanQueryRow {
  id: unknown;
  inventaris_id: unknown;
  peminjam_id: unknown;
  dosen_id: unknown;
  jumlah_pinjam: unknown;
  keperluan: unknown;
  tanggal_pinjam: unknown;
  tanggal_kembali_rencana: unknown;
  tanggal_kembali_aktual: unknown;
  kondisi_pinjam: unknown;
  kondisi_kembali: unknown;
  keterangan_kembali: unknown;
  status: unknown;
  rejection_reason: unknown;
  approved_by: unknown;
  approved_at: unknown;
  denda: unknown;
  created_at: unknown;
  updated_at: unknown;
  inventaris?: {
    kode_barang?: string;
    nama_barang?: string;
    laboratorium?: {
      nama_lab?: string;
    };
  };
  peminjam?: {
    nim?: string;
    user?: {
      full_name?: string;
    };
  };
  dosen?: {
    nip?: string;
    user?: {
      full_name?: string;
    };
  };
}

// ============================================================================
// PEMINJAMAN (EQUIPMENT BORROWING) - ENHANCED
// ============================================================================

/**
 * Get all peminjaman with full details
 */
export async function getAllPeminjaman(params?: {
  status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
  laboratorium_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: PeminjamanDetail[]; count: number }> {
  try {
    let query = supabase
      .from('peminjaman')
      .select(`
        id,
        inventaris_id,
        peminjam_id,
        dosen_id,
        jumlah_pinjam,
        keperluan,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        tanggal_kembali_aktual,
        kondisi_pinjam,
        kondisi_kembali,
        keterangan_kembali,
        status,
        rejection_reason,
        approved_by,
        approved_at,
        denda,
        created_at,
        updated_at,
        peminjam:mahasiswa!peminjaman_peminjam_id_fkey(
          nim,
          user:users!mahasiswa_user_id_fkey(
            full_name
          )
        ),
        dosen:dosen!peminjaman_dosen_id_fkey(
          nip,
          user:users!dosen_user_id_fkey(
            full_name
          )
        ),
        inventaris:inventaris!peminjaman_inventaris_id_fkey(
          kode_barang,
          nama_barang,
          laboratorium:laboratorium!inventaris_laboratorium_id_fkey(
            id,
            nama_lab
          )
        )
      `, { count: 'exact' });

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.laboratorium_id) {
      query = query.eq('inventaris.laboratorium.id', params.laboratorium_id);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const mappedData = ((data ?? []) as unknown as PeminjamanQueryRow[]).map((item) => ({
      id: item.id,
      inventaris_id: item.inventaris_id,
      inventaris_kode: item.inventaris?.kode_barang || '-',
      inventaris_nama: item.inventaris?.nama_barang || 'Unknown',
      peminjam_id: item.peminjam_id,
      peminjam_nama: item.peminjam?.user?.full_name || 'Unknown',
      peminjam_nim: item.peminjam?.nim || '-',
      dosen_id: item.dosen_id,
      dosen_nama: item.dosen?.user?.full_name || null,
      dosen_nip: item.dosen?.nip || null,
      jumlah_pinjam: item.jumlah_pinjam,
      keperluan: item.keperluan,
      tanggal_pinjam: item.tanggal_pinjam,
      tanggal_kembali_rencana: item.tanggal_kembali_rencana,
      tanggal_kembali_aktual: item.tanggal_kembali_aktual,
      kondisi_pinjam: item.kondisi_pinjam,
      kondisi_kembali: item.kondisi_kembali,
      keterangan_kembali: item.keterangan_kembali,
      status: item.status,
      rejection_reason: item.rejection_reason,
      approved_by: item.approved_by,
      approved_at: item.approved_at,
      denda: item.denda,
      laboratorium_nama: item.inventaris?.laboratorium?.nama_lab || '-',
      created_at: item.created_at,
      updated_at: item.updated_at,
    })) as PeminjamanDetail[];

    return {
      data: mappedData,
      count: count || 0,
    };
  } catch (error) {
    logger.error('Failed to fetch peminjaman', { params, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Mark peminjaman as returned
 */
export async function markAsReturned(
  peminjamanId: string,
  kondisiKembali: 'baik' | 'rusak_ringan' | 'rusak_berat' | 'maintenance',
  keterangan?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('peminjaman')
      .update({
        status: 'returned',
        tanggal_kembali_aktual: new Date().toISOString(),
        kondisi_kembali: kondisiKembali,
        keterangan_kembali: keterangan || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', peminjamanId)
      .eq('status', 'approved'); // Only mark as returned if currently approved

    if (error) throw error;
  } catch (error) {
    logger.error('Failed to mark peminjaman as returned', { peminjamanId, error });
    throw handleSupabaseError(error);
  }
}

// ============================================================================
// ROOM BOOKING APPROVAL (via jadwal_praktikum)
// ============================================================================

/**
 * Get pending room booking requests (jadwal with is_active = false)
 * Uses separate queries to avoid complex nested joins
 */
export async function getPendingRoomBookings(limit: number = 50): Promise<RoomBookingRequest[]> {
  try {
    // Step 1: Get jadwal_praktikum data
    const { data, error } = await supabase
      .from('jadwal_praktikum')
      .select('id, kelas_id, laboratorium_id, hari, jam_mulai, jam_selesai, tanggal_praktikum, minggu_ke, topik, deskripsi, catatan, created_at')
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data || data.length === 0) {
      return [];
    }

    // Step 2: Extract unique IDs
    const kelasIds = [...new Set(data.map(item => item.kelas_id).filter((id): id is string => id !== null))];
    const labIds = [...new Set(data.map(item => item.laboratorium_id).filter((id): id is string => id !== null))];

    // Step 3: Fetch related data in parallel
    const [kelasData, labData] = await Promise.all([
      kelasIds.length > 0
        ? supabase
            .from('kelas')
            .select('id, nama_kelas, mata_kuliah_id, dosen_id')
            .in('id', kelasIds)
        : Promise.resolve({ data: [] }),
      labIds.length > 0
        ? supabase
            .from('laboratorium')
            .select('id, kode_lab, nama_lab, kapasitas')
            .in('id', labIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Step 4: Get mata_kuliah and dosen IDs from kelas
    const mataKuliahIds = [...new Set((kelasData.data || []).map((k: any) => k.mata_kuliah_id).filter((id): id is string => id !== null))];
    const dosenIds = [...new Set((kelasData.data || []).map((k: any) => k.dosen_id).filter((id): id is string => id !== null))];

    // Step 5: Fetch mata_kuliah, dosen, and users
    const [mataKuliahData, dosenData] = await Promise.all([
      mataKuliahIds.length > 0
        ? supabase
            .from('mata_kuliah')
            .select('id, nama_mk')
            .in('id', mataKuliahIds)
        : Promise.resolve({ data: [] }),
      dosenIds.length > 0
        ? supabase
            .from('dosen')
            .select('id, nip, user_id')
            .in('id', dosenIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Step 6: Get user names for dosen
    const userIds = [...new Set((dosenData.data || []).map((d: any) => d.user_id).filter((id): id is string => id !== null))];
    const { data: userData } = userIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', userIds)
      : { data: [] };

    // Step 7: Create lookup maps
    const labMap = new Map((labData.data || []).map((lab: any) => [lab.id, lab]));
    const mataKuliahMap = new Map((mataKuliahData.data || []).map((mk: any) => [mk.id, mk]));
    const userMap = new Map((userData || []).map((user: any) => [user.id, user]));
    const dosenMap = new Map((dosenData.data || []).map((dosen: any) => [dosen.id, dosen]));
    const kelasMap = new Map((kelasData.data || []).map((kelas: any) => [kelas.id, kelas]));

    // Step 8: Map data with relationships
    return data.map((item) => {
      const kelas = kelasMap.get(item.kelas_id as string);
      const mataKuliah = kelas ? mataKuliahMap.get(kelas.mata_kuliah_id) : null;
      const dosen = kelas ? dosenMap.get(kelas.dosen_id) : null;
      const user = dosen ? userMap.get(dosen.user_id) : null;
      const lab = labMap.get(item.laboratorium_id as string);

      return {
        id: item.id as string,
        kelas_id: item.kelas_id as string | null,
        kelas_nama: kelas?.nama_kelas || '-',
        mata_kuliah_nama: mataKuliah?.nama_mk || 'Unknown',
        dosen_id: dosen?.id || '-',
        dosen_nama: user?.full_name || 'Unknown',
        dosen_nip: dosen?.nip || '-',
        laboratorium_id: item.laboratorium_id as string,
        laboratorium_nama: lab?.nama_lab || '-',
        laboratorium_kode: lab?.kode_lab || '-',
        laboratorium_kapasitas: lab?.kapasitas || 0,
        hari: item.hari as string,
        jam_mulai: item.jam_mulai as string,
        jam_selesai: item.jam_selesai as string,
        tanggal_praktikum: item.tanggal_praktikum as string | null,
        minggu_ke: item.minggu_ke as number | null,
        topik: item.topik as string | null,
        deskripsi: item.deskripsi as string | null,
        catatan: item.catatan as string | null,
        created_at: item.created_at as string | null,
      };
    });
  } catch (error) {
    logger.error('Failed to fetch pending room bookings', { limit, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Approve room booking (set jadwal is_active = true)
 */
export async function approveRoomBooking(jadwalId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('jadwal_praktikum')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jadwalId)
      .eq('is_active', false); // Only approve if still pending

    if (error) throw error;
  } catch (error) {
    logger.error('Failed to approve room booking', { jadwalId, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Reject room booking (delete jadwal or mark inactive)
 */
export async function rejectRoomBooking(jadwalId: string, reason?: string): Promise<void> {
  try {
    // For now, we'll delete the jadwal since there's no rejection_reason field
    // In future, add rejection tracking fields to jadwal_praktikum
    const { error } = await supabase
      .from('jadwal_praktikum')
      .delete()
      .eq('id', jadwalId)
      .eq('is_active', false); // Only delete if still pending

    if (error) throw error;

    // TODO: Add rejection reason tracking when schema supports it
    if (reason) {
      logger.info('Rejection reason:', reason);
    }
  } catch (error) {
    logger.error('Failed to reject room booking', { jadwalId, reason, error });
    throw handleSupabaseError(error);
  }
}
