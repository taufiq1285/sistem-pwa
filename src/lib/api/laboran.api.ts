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
      .lt('jumlah_tersedia', 5);

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
        peminjam_id,
        inventaris_id
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch related data separately to avoid foreign key issues
    const peminjamIds = [...new Set(data?.map(item => item.peminjam_id).filter(Boolean))];
    const inventarisIds = [...new Set(data?.map(item => item.inventaris_id).filter(Boolean))];

    const [mahasiswaData, inventarisData] = await Promise.all([
      peminjamIds.length > 0
        ? supabase
            .from('mahasiswa')
            .select('id, nim, user_id, users!mahasiswa_user_id_fkey(full_name)')
            .in('id', peminjamIds)
        : Promise.resolve({ data: [] }),
      inventarisIds.length > 0
        ? supabase
            .from('inventaris')
            .select('id, kode_barang, nama_barang, laboratorium_id, laboratorium!inventaris_laboratorium_id_fkey(nama_lab)')
            .in('id', inventarisIds)
        : Promise.resolve({ data: [] }),
    ]);

    const mahasiswaMap = new Map(mahasiswaData.data?.map((m: any) => [m.id, m]) || []);
    const inventarisMap = new Map(inventarisData.data?.map((i: any) => [i.id, i]) || []);

    return (data || []).map((item: any) => {
      const mahasiswa = mahasiswaMap.get(item.peminjam_id);
      const inventaris = inventarisMap.get(item.inventaris_id);

      return {
        id: item.id,
        peminjam_nama: mahasiswa?.users?.full_name || 'Unknown',
        peminjam_nim: mahasiswa?.nim || '-',
        inventaris_nama: inventaris?.nama_barang || 'Unknown',
        inventaris_kode: inventaris?.kode_barang || '-',
        laboratorium_nama: inventaris?.laboratorium?.nama_lab || '-',
        jumlah_pinjam: item.jumlah_pinjam,
        keperluan: item.keperluan,
        tanggal_pinjam: item.tanggal_pinjam,
        tanggal_kembali_rencana: item.tanggal_kembali_rencana,
        created_at: item.created_at,
      };
    });
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
      .from('jadwal_praktikum')
      .select(`
        id,
        hari,
        jam_mulai,
        jam_selesai,
        tanggal_praktikum,
        topik,
        kelas_id,
        laboratorium_id
      `)
      .eq('tanggal_praktikum', today)
      .eq('is_active', true)
      .order('jam_mulai', { ascending: true })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch related data separately
    const kelasIds = [...new Set(data.map(item => item.kelas_id).filter((id): id is string => id !== null))];
    const labIds = [...new Set(data.map(item => item.laboratorium_id).filter((id): id is string => id !== null))];

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
            .select('id, nama_lab')
            .in('id', labIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch mata kuliah and dosen if we have kelas data
    const mataKuliahIds = [...new Set(kelasData.data?.map((k: any) => k.mata_kuliah_id).filter(Boolean) || [])];
    const dosenIds = [...new Set(kelasData.data?.map((k: any) => k.dosen_id).filter(Boolean) || [])];

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
            .select('id, user_id, users!dosen_user_id_fkey(full_name)')
            .in('id', dosenIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Create maps for quick lookup
    const kelasMap = new Map(kelasData.data?.map((k: any) => [k.id, k]) || []);
    const labMap = new Map(labData.data?.map((l: any) => [l.id, l]) || []);
    const mataKuliahMap = new Map(mataKuliahData.data?.map((mk: any) => [mk.id, mk]) || []);
    const dosenMap = new Map(dosenData.data?.map((d: any) => [d.id, d]) || []);

    return data.map((item: any) => {
      const kelas = kelasMap.get(item.kelas_id);
      const lab = labMap.get(item.laboratorium_id);
      const mataKuliah = kelas ? mataKuliahMap.get(kelas.mata_kuliah_id) : null;
      const dosen = kelas ? dosenMap.get(kelas.dosen_id) : null;

      return {
        id: item.id,
        mata_kuliah_nama: mataKuliah?.nama_mk || 'Unknown',
        kelas_nama: kelas?.nama_kelas || '-',
        dosen_nama: dosen?.users?.full_name || 'Unknown',
        laboratorium_nama: lab?.nama_lab || '-',
        hari: item.hari,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        tanggal_praktikum: item.tanggal_praktikum,
        topik: item.topik || '-',
      };
    });
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
// ============================================================================
// INVENTARIS CRUD
// ============================================================================

export interface CreateInventarisData {
  // REQUIRED fields
  kode_barang: string;
  nama_barang: string;
  jumlah: number;
  jumlah_tersedia: number;

  // OPTIONAL fields (all nullable in database)
  laboratorium_id?: string | null;
  kategori?: string | null;
  merk?: string | null;
  spesifikasi?: string | null;
  kondisi?: EquipmentCondition;
  tahun_pengadaan?: number | null;
  harga_satuan?: number | null;
  keterangan?: string | null;
}

export type UpdateInventarisData = Partial<CreateInventarisData>;

export interface InventarisListItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kategori: string | null;
  merk: string | null;
  spesifikasi: string | null;
  jumlah: number;
  jumlah_tersedia: number;
  kondisi: EquipmentCondition | null;
  harga_satuan: number | null;
  tahun_pengadaan: number | null;
  keterangan: string | null;
  laboratorium: {
    id: string;
    kode_lab: string;
    nama_lab: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Get all inventaris with optional filters
 */
export async function getInventarisList(params?: {
  laboratorium_id?: string;
  kategori?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: InventarisListItem[]; count: number }> {
  try {
    let query = supabase
      .from('inventaris')
      .select(`
        id,
        kode_barang,
        nama_barang,
        kategori,
        merk,
        spesifikasi,
        jumlah,
        jumlah_tersedia,
        kondisi,
        harga_satuan,
        tahun_pengadaan,
        keterangan,
        created_at,
        updated_at,
        laboratorium:laboratorium!inventaris_laboratorium_id_fkey(
          id,
          kode_lab,
          nama_lab
        )
      `, { count: 'exact' });

    // Apply filters
    if (params?.laboratorium_id) {
      query = query.eq('laboratorium_id', params.laboratorium_id);
    }

    if (params?.kategori) {
      query = query.eq('kategori', params.kategori);
    }

    if (params?.search) {
      query = query.or(`nama_barang.ilike.%${params.search}%,kode_barang.ilike.%${params.search}%`);
    }

    // Apply pagination
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data || []) as InventarisListItem[],
      count: count || 0,
    };
  } catch (error) {
    console.error('Error fetching inventaris list:', error);
    throw error;
  }
}

/**
 * Get single inventaris by ID
 */
export async function getInventarisById(id: string): Promise<InventarisListItem> {
  try {
    const { data, error } = await supabase
      .from('inventaris')
      .select(`
        id,
        kode_barang,
        nama_barang,
        kategori,
        merk,
        spesifikasi,
        jumlah,
        jumlah_tersedia,
        kondisi,
        harga_satuan,
        tahun_pengadaan,
        keterangan,
        created_at,
        updated_at,
        laboratorium:laboratorium!inventaris_laboratorium_id_fkey(
          id,
          kode_lab,
          nama_lab
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Inventaris not found');

    return data as InventarisListItem;
  } catch (error) {
    console.error('Error fetching inventaris:', error);
    throw error;
  }
}

/**
 * Create new inventaris
 */
export async function createInventaris(data: CreateInventarisData): Promise<string> {
  try {
    const { data: result, error } = await supabase
      .from('inventaris')
      .insert({
        kode_barang: data.kode_barang,
        nama_barang: data.nama_barang,
        kategori: data.kategori || null,
        merk: data.merk || null,
        spesifikasi: data.spesifikasi || null,
        jumlah: data.jumlah,
        jumlah_tersedia: data.jumlah_tersedia,
        kondisi: data.kondisi || 'baik',
        harga_satuan: data.harga_satuan || null,
        tahun_pengadaan: data.tahun_pengadaan || null,
        laboratorium_id: data.laboratorium_id || null,
        keterangan: data.keterangan || null,
      } as any)
      .select('id')
      .single();

    if (error) throw error;
    if (!result) throw new Error('Failed to create inventaris');

    return result.id;
  } catch (error) {
    console.error('Error creating inventaris:', error);
    throw error;
  }
}

/**
 * Update inventaris
 */
export async function updateInventaris(
  id: string,
  data: UpdateInventarisData
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.kode_barang !== undefined) updateData.kode_barang = data.kode_barang;
    if (data.nama_barang !== undefined) updateData.nama_barang = data.nama_barang;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.merk !== undefined) updateData.merk = data.merk;
    if (data.spesifikasi !== undefined) updateData.spesifikasi = data.spesifikasi;
    if (data.jumlah !== undefined) updateData.jumlah = data.jumlah;
    if (data.jumlah_tersedia !== undefined) updateData.jumlah_tersedia = data.jumlah_tersedia;
    if (data.kondisi !== undefined) updateData.kondisi = data.kondisi;
    if (data.harga_satuan !== undefined) updateData.harga_satuan = data.harga_satuan;
    if (data.tahun_pengadaan !== undefined) updateData.tahun_pengadaan = data.tahun_pengadaan;
    if (data.laboratorium_id !== undefined) updateData.laboratorium_id = data.laboratorium_id;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    const { error } = await supabase
      .from('inventaris')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating inventaris:', error);
    throw error;
  }
}

/**
 * Delete inventaris
 */
export async function deleteInventaris(id: string): Promise<void> {
  try {
    // Check if inventaris has active borrowings
    const { data: borrowings, error: borrowError } = await supabase
      .from('peminjaman')
      .select('id')
      .eq('inventaris_id', id)
      .in('status', ['pending', 'approved'])
      .limit(1);

    if (borrowError) throw borrowError;

    if (borrowings && borrowings.length > 0) {
      throw new Error('Cannot delete inventaris with active borrowings');
    }

    const { error } = await supabase
      .from('inventaris')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting inventaris:', error);
    throw error;
  }
}

/**
 * Update stock quantity
 */
export async function updateStock(
  id: string,
  adjustment: number,
  type: 'add' | 'subtract' | 'set'
): Promise<void> {
  try {
    // Get current stock
    const { data: current, error: fetchError } = await supabase
      .from('inventaris')
      .select('jumlah, jumlah_tersedia')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!current) throw new Error('Inventaris not found');

    let newJumlah = current.jumlah;
    let newJumlahTersedia = current.jumlah_tersedia;

    switch (type) {
      case 'add':
        newJumlah += adjustment;
        newJumlahTersedia += adjustment;
        break;
      case 'subtract':
        newJumlah = Math.max(0, current.jumlah - adjustment);
        newJumlahTersedia = Math.max(0, current.jumlah_tersedia - adjustment);
        break;
      case 'set':
        newJumlah = adjustment;
        newJumlahTersedia = adjustment;
        break;
    }

    const { error } = await supabase
      .from('inventaris')
      .update({
        jumlah: newJumlah,
        jumlah_tersedia: newJumlahTersedia,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
}

/**
 * Get available categories
 */
export async function getInventarisCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('inventaris')
      .select('kategori')
      .not('kategori', 'is', null);

    if (error) throw error;

    const categories = Array.from(
      new Set((data || []).map(item => item.kategori).filter(Boolean))
    ) as string[];

    return categories.sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// ============================================================================
// LABORATORIUM MANAGEMENT
// ============================================================================

export interface Laboratorium {
  id: string;
  kode_lab: string;
  nama_lab: string;
  kapasitas: number | null;
  lokasi: string | null;
  fasilitas: string[] | null;
  is_active: boolean | null;
  keterangan: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LabScheduleItem {
  id: string;
  tanggal_praktikum: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string | null;
  kelas_nama: string;
  mata_kuliah_nama: string;
  dosen_nama: string;
}

export interface LabEquipmentItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kondisi: EquipmentCondition | null;
  jumlah: number;
  jumlah_tersedia: number;
}

/**
 * Get all laboratorium with optional filters
 */
export async function getLaboratoriumList(params?: {
  is_active?: boolean;
  search?: string;
}): Promise<Laboratorium[]> {
  try {
    let query = supabase
      .from('laboratorium')
      .select('*')
      .order('kode_lab');

    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    if (params?.search) {
      query = query.or(`nama_lab.ilike.%${params.search}%,kode_lab.ilike.%${params.search}%,lokasi.ilike.%${params.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Laboratorium[];
  } catch (error) {
    console.error('Error fetching laboratorium list:', error);
    throw error;
  }
}

/**
 * Get single laboratorium by ID
 */
export async function getLaboratoriumById(id: string): Promise<Laboratorium> {
  try {
    const { data, error } = await supabase
      .from('laboratorium')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Laboratorium not found');

    return data as Laboratorium;
  } catch (error) {
    console.error('Error fetching laboratorium:', error);
    throw error;
  }
}

/**
 * Get lab schedule by lab ID
 */
export async function getLabScheduleByLabId(
  labId: string,
  limit: number = 10
): Promise<LabScheduleItem[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('jadwal_praktikum')
      .select(`
        id,
        tanggal_praktikum,
        jam_mulai,
        jam_selesai,
        topik,
        kelas:kelas_id (
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk
          ),
          dosen:dosen_id (
            user:user_id (
              full_name
            )
          )
        )
      `)
      .eq('laboratorium_id', labId)
      .gte('tanggal_praktikum', today)
      .order('tanggal_praktikum')
      .order('jam_mulai')
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      tanggal_praktikum: item.tanggal_praktikum,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      topik: item.topik || null,
      kelas_nama: item.kelas?.nama_kelas || '-',
      mata_kuliah_nama: item.kelas?.mata_kuliah?.nama_mk || 'Unknown',
      dosen_nama: item.kelas?.dosen?.user?.full_name || 'Unknown',
    }));
  } catch (error) {
    console.error('Error fetching lab schedule:', error);
    throw error;
  }
}

/**
 * Get lab equipment/inventaris by lab ID
 */
export async function getLabEquipment(labId: string): Promise<LabEquipmentItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventaris')
      .select('id, kode_barang, nama_barang, kondisi, jumlah, jumlah_tersedia')
      .eq('laboratorium_id', labId)
      .order('nama_barang');

    if (error) throw error;

    return (data || []) as LabEquipmentItem[];
  } catch (error) {
    console.error('Error fetching lab equipment:', error);
    throw error;
  }
}

/**
 * Update laboratorium data
 */
export interface UpdateLaboratoriumData {
  kode_lab?: string;
  nama_lab?: string;
  kapasitas?: number;
  lokasi?: string;
  fasilitas?: string[];
  is_active?: boolean;
  keterangan?: string;
}

export async function updateLaboratorium(id: string, data: UpdateLaboratoriumData): Promise<void> {
  try {
    const { error } = await supabase
      .from('laboratorium')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating laboratorium:', error);
    throw error;
  }
}


/**
 * Create new laboratorium
 */
export interface CreateLaboratoriumData {
  kode_lab: string;
  nama_lab: string;
  lokasi?: string;
  kapasitas?: number;
  keterangan?: string;
  is_active?: boolean;
}

export async function createLaboratorium(data: CreateLaboratoriumData): Promise<void> {
  try {
    const { error } = await supabase
      .from('laboratorium')
      .insert(data);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating laboratorium:', error);
    throw error;
  }
}

/**
 * Delete laboratorium (Admin only)
 * WARNING: This will permanently delete the laboratory
 * Checks for related data before deletion
 */
export async function deleteLaboratorium(id: string): Promise<void> {
  try {
    // Check if lab has any equipment
    const { data: equipment, error: equipError } = await supabase
      .from('inventaris')
      .select('id')
      .eq('laboratorium_id', id)
      .limit(1);

    if (equipError) throw equipError;

    if (equipment && equipment.length > 0) {
      throw new Error('Cannot delete laboratory that has equipment assigned to it');
    }

    // Check if lab has any schedules
    const { data: schedules, error: schedError } = await supabase
      .from('jadwal_praktikum')
      .select('id')
      .eq('laboratorium_id', id)
      .limit(1);

    if (schedError) throw schedError;

    if (schedules && schedules.length > 0) {
      throw new Error('Cannot delete laboratory that has schedules assigned to it');
    }

    // If no related data, proceed with deletion
    const { error: deleteError } = await supabase
      .from('laboratorium')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting laboratorium:', error);
    throw error;
  }
}
