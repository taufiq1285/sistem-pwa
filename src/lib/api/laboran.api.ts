/**
 * Laboran API
 * API functions for Laboran dashboard and management
 */

import { supabase } from '@/lib/supabase/client';
import type { 
  EquipmentCondition 
} from '@/types/inventaris.types';

// ============================================================================
// TYPES
// ============================================================================

export interface LaboranStats {
  totalLab: number;
  totalInventaris: number;
  pendingApprovals: number;
  lowStockAlerts: number;
}

export interface PendingApproval {
  id: string;
  peminjam_nama: string;
  peminjam_nim: string;
  inventaris_nama: string;
  inventaris_kode: string;
  laboratorium_nama: string;
  jumlah_pinjam: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  created_at: string;
}

export interface InventoryAlert {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kategori: string;
  jumlah: number;
  jumlah_tersedia: number;
  kondisi: EquipmentCondition;
  laboratorium_nama: string;
  laboratorium_kode: string;
}

export interface LabScheduleToday {
  id: string;
  mata_kuliah_nama: string;
  kelas_nama: string;
  dosen_nama: string;
  laboratorium_nama: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tanggal_praktikum: string;
  topik: string;
}

export interface ApprovalAction {
  peminjaman_id: string;
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Get dashboard statistics for laboran
 */
export async function getLaboranStats(): Promise<LaboranStats> {
  try {
    // Get total laboratorium
    const { count: totalLab } = await supabase
      .from('laboratorium')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total inventaris
    const { count: totalInventaris } = await supabase
      .from('inventaris')
      .select('*', { count: 'exact', head: true });

    // Get pending approvals count
    const { count: pendingApprovals } = await supabase
      .from('peminjaman')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get low stock alerts count (jumlah_tersedia < 5)
    const { count: lowStockAlerts } = await supabase
      .from('inventaris')
      .select('*', { count: 'exact', head: true })
      .lt('jumlah_tersedia', 5)
      .eq('is_available_for_borrowing', true);

    return {
      totalLab: totalLab || 0,
      totalInventaris: totalInventaris || 0,
      pendingApprovals: pendingApprovals || 0,
      lowStockAlerts: lowStockAlerts || 0,
    };
  } catch (error) {
    console.error('Error fetching laboran stats:', error);
    throw error;
  }
}

// ============================================================================
// PENDING APPROVALS
// ============================================================================

/**
 * Get pending peminjaman approvals
 */
export async function getPendingApprovals(limit: number = 10): Promise<PendingApproval[]> {
  try {
    const { data, error } = await supabase
      .from('peminjaman')
      .select(`
        id,
        jumlah_pinjam,
        keperluan,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        created_at,
        peminjam:mahasiswa!peminjaman_peminjam_id_fkey(
          nim,
          user:users!mahasiswa_user_id_fkey(
            full_name
          )
        ),
        inventaris:inventaris!peminjaman_inventaris_id_fkey(
          kode_barang,
          nama_barang,
          laboratorium:laboratorium!inventaris_laboratorium_id_fkey(
            nama_lab
          )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      peminjam_nama: item.peminjam?.user?.full_name || 'Unknown',
      peminjam_nim: item.peminjam?.nim || '-',
      inventaris_nama: item.inventaris?.nama_barang || 'Unknown',
      inventaris_kode: item.inventaris?.kode_barang || '-',
      laboratorium_nama: item.inventaris?.laboratorium?.nama_lab || '-',
      jumlah_pinjam: item.jumlah_pinjam,
      keperluan: item.keperluan,
      tanggal_pinjam: item.tanggal_pinjam,
      tanggal_kembali_rencana: item.tanggal_kembali_rencana,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
}

// ============================================================================
// INVENTORY ALERTS
// ============================================================================

/**
 * Get inventory items with low stock
 */
export async function getInventoryAlerts(limit: number = 10): Promise<InventoryAlert[]> {
  try {
    const { data, error } = await supabase
      .from('inventaris')
      .select(`
        id,
        kode_barang,
        nama_barang,
        kategori,
        jumlah,
        jumlah_tersedia,
        kondisi,
        laboratorium:laboratorium!inventaris_laboratorium_id_fkey(
          kode_lab,
          nama_lab
        )
      `)
      .lt('jumlah_tersedia', 5)
      .eq('is_available_for_borrowing', true)
      .order('jumlah_tersedia', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      kategori: item.kategori || 'Umum',
      jumlah: item.jumlah,
      jumlah_tersedia: item.jumlah_tersedia,
      kondisi: item.kondisi,
      laboratorium_nama: item.laboratorium?.nama_lab || '-',
      laboratorium_kode: item.laboratorium?.kode_lab || '-',
    }));
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    throw error;
  }
}

// ============================================================================
// LAB SCHEDULE
// ============================================================================

/**
 * Get lab schedule for today
 */
export async function getLabScheduleToday(limit: number = 10): Promise<LabScheduleToday[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('jadwal')
      .select(`
        id,
        hari,
        jam_mulai,
        jam_selesai,
        tanggal_praktikum,
        topik,
        kelas:kelas!jadwal_praktikum_kelas_id_fkey(
          nama_kelas,
          mata_kuliah:mata_kuliah!kelas_mata_kuliah_id_fkey(
            nama_mk
          ),
          dosen:dosen!kelas_dosen_id_fkey(
            user:users!dosen_user_id_fkey(
              full_name
            )
          )
        ),
        laboratorium:laboratorium!jadwal_praktikum_laboratorium_id_fkey(
          nama_lab
        )
      `)
      .eq('tanggal_praktikum', today)
      .eq('is_active', true)
      .order('jam_mulai', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      mata_kuliah_nama: item.kelas?.mata_kuliah?.nama_mk || 'Unknown',
      kelas_nama: item.kelas?.nama_kelas || '-',
      dosen_nama: item.kelas?.dosen?.user?.full_name || 'Unknown',
      laboratorium_nama: item.laboratorium?.nama_lab || '-',
      hari: item.hari,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      tanggal_praktikum: item.tanggal_praktikum,
      topik: item.topik || '-',
    }));
  } catch (error) {
    console.error('Error fetching lab schedule today:', error);
    throw error;
  }
}

// ============================================================================
// APPROVAL ACTIONS
// ============================================================================

/**
 * Approve peminjaman request
 */
export async function approvePeminjaman(peminjamanId: string): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('peminjaman')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', peminjamanId)
      .eq('status', 'pending'); // Only update if still pending

    if (error) throw error;
  } catch (error) {
    console.error('Error approving peminjaman:', error);
    throw error;
  }
}

/**
 * Reject peminjaman request
 */
export async function rejectPeminjaman(
  peminjamanId: string, 
  rejectionReason: string
): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('peminjaman')
      .update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq('id', peminjamanId)
      .eq('status', 'pending'); // Only update if still pending

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting peminjaman:', error);
    throw error;
  }
}

/**
 * Process approval action (approve or reject)
 */
export async function processApproval(action: ApprovalAction): Promise<void> {
  if (action.status === 'approved') {
    await approvePeminjaman(action.peminjaman_id);
  } else if (action.status === 'rejected') {
    if (!action.rejection_reason) {
      throw new Error('Rejection reason is required');
    }
    await rejectPeminjaman(action.peminjaman_id, action.rejection_reason);
  } else {
    throw new Error('Invalid approval action');
  }
}