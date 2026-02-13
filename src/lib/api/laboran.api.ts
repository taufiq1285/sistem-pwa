/**
 * Laboran API
 * API functions for Laboran dashboard and management
 */

import { supabase } from "@/lib/supabase/client";
import { cacheAPI } from "@/lib/offline/api-cache";
import { requirePermission } from "@/lib/middleware";
import type { EquipmentCondition } from "@/types/inventaris.types";

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
  dosen_user_id?: string; // For sending notifications to dosen
  dosen_id?: string; // For tracking which dosen made the request
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
  status: "approved" | "rejected";
  rejection_reason?: string;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Get dashboard statistics for laboran
 */
export async function getLaboranStats(): Promise<LaboranStats> {
  return cacheAPI(
    "laboran_stats",
    async () => {
      try {
        // Get total laboratorium
        const { count: totalLab } = await supabase
          .from("laboratorium")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Get total inventaris
        const { count: totalInventaris } = await supabase
          .from("inventaris")
          .select("*", { count: "exact", head: true });

        // Get pending approvals count
        const { count: pendingApprovals } = await supabase
          .from("peminjaman")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Get low stock alerts count (jumlah_tersedia < 5)
        const { count: lowStockAlerts } = await supabase
          .from("inventaris")
          .select("*", { count: "exact", head: true })
          .lt("jumlah_tersedia", 5);

        return {
          totalLab: totalLab || 0,
          totalInventaris: totalInventaris || 0,
          pendingApprovals: pendingApprovals || 0,
          lowStockAlerts: lowStockAlerts || 0,
        };
      } catch (error) {
        console.error("Error fetching laboran stats:", error);
        throw error;
      }
    },
    {
      ttl: 5 * 60 * 1000, // Cache for 5 minutes
      staleWhileRevalidate: true,
    },
  );
}

// ============================================================================
// PENDING APPROVALS
// ============================================================================

/**
 * Get pending peminjaman approvals
 */
export async function getPendingApprovals(
  limit: number = 10,
): Promise<PendingApproval[]> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        `
        id,
        jumlah_pinjam,
        keperluan,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        created_at,
        peminjam_id,
        dosen_id,
        inventaris_id
      `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Separate mahasiswa and dosen IDs
    const peminjamIds = [
      ...new Set(
        data
          ?.map((item) => item.peminjam_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const dosenIds = [
      ...new Set(
        data
          ?.map((item) => item.dosen_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const inventarisIds = [
      ...new Set(data?.map((item) => item.inventaris_id).filter(Boolean)),
    ];

    const [mahasiswaData, dosenData, inventarisData] = await Promise.all([
      peminjamIds.length > 0
        ? supabase
            .from("mahasiswa")
            .select("id, nim, user_id")
            .in("id", peminjamIds)
        : Promise.resolve({ data: [] }),
      dosenIds.length > 0
        ? supabase.from("dosen").select("id, nip, user_id").in("id", dosenIds)
        : Promise.resolve({ data: [] }),
      inventarisIds.length > 0
        ? supabase
            .from("inventaris")
            .select(
              "id, kode_barang, nama_barang, laboratorium_id, laboratorium!inventaris_laboratorium_id_fkey(nama_lab)",
            )
            .in("id", inventarisIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch user names separately to avoid nested join issues
    const allUserIds = [
      ...new Set([
        ...(mahasiswaData.data?.map((m: any) => m.user_id).filter(Boolean) ||
          []),
        ...(dosenData.data?.map((d: any) => d.user_id).filter(Boolean) || []),
      ]),
    ];
    const usersData =
      allUserIds.length > 0
        ? await supabase
            .from("users")
            .select("id, full_name")
            .in("id", allUserIds)
        : { data: [] };

    const mahasiswaMap = new Map(
      (mahasiswaData.data?.map((m: any) => [m.id, m]) || []) as [string, any][],
    );
    const dosenMap = new Map(
      (dosenData.data?.map((d: any) => [d.id, d]) || []) as [string, any][],
    );
    const inventarisMap = new Map(
      (inventarisData.data?.map((i: any) => [i.id, i]) || []) as [
        string,
        any,
      ][],
    );
    const usersMap = new Map(
      (usersData.data?.map((u: any) => [u.id, u]) || []) as [string, any][],
    );

    return (data || []).map((item: any) => {
      const inventaris = inventarisMap.get(item.inventaris_id);

      // Check if peminjam is mahasiswa or dosen
      let peminjamNama = "Unknown";
      let peminjamNim = "-";

      // For notification - get dosen user_id if this is a dosen request
      let dosenUserId: string | undefined;
      let dosenId: string | undefined;

      if (item.dosen_id) {
        // Peminjam is DOSEN
        const dosen = dosenMap.get(item.dosen_id);
        const user = dosen?.user_id ? usersMap.get(dosen.user_id) : null;
        peminjamNama = user?.full_name || dosen?.nip || "Unknown";
        peminjamNim = dosen?.nip || "-";
        dosenUserId = dosen?.user_id; // For sending notifications
        dosenId = item.dosen_id;
      } else if (item.peminjam_id) {
        // Peminjam is MAHASISWA
        const mahasiswa = mahasiswaMap.get(item.peminjam_id);
        const user = mahasiswa?.user_id
          ? usersMap.get(mahasiswa.user_id)
          : null;
        peminjamNama = user?.full_name || mahasiswa?.nim || "Unknown";
        peminjamNim = mahasiswa?.nim || "-";
      }

      return {
        id: item.id,
        peminjam_nama: peminjamNama,
        peminjam_nim: peminjamNim,
        inventaris_nama: inventaris?.nama_barang || "Unknown",
        inventaris_kode: inventaris?.kode_barang || "-",
        laboratorium_nama: inventaris?.laboratorium?.nama_lab || "-",
        jumlah_pinjam: item.jumlah_pinjam,
        keperluan: item.keperluan,
        tanggal_pinjam: item.tanggal_pinjam,
        tanggal_kembali_rencana: item.tanggal_kembali_rencana,
        created_at: item.created_at,
        dosen_user_id: dosenUserId,
        dosen_id: dosenId,
      };
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    throw error;
  }
}

// ============================================================================
// INVENTORY ALERTS
// ============================================================================

/**
 * Get inventory items with low stock
 */
export async function getInventoryAlerts(
  limit: number = 10,
): Promise<InventoryAlert[]> {
  try {
    const { data, error } = await supabase
      .from("inventaris")
      .select(
        `
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
      `,
      )
      .lt("jumlah_tersedia", 5)
      .order("jumlah_tersedia", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      kategori: item.kategori || "Umum",
      jumlah: item.jumlah,
      jumlah_tersedia: item.jumlah_tersedia,
      kondisi: item.kondisi,
      laboratorium_nama: item.laboratorium?.nama_lab || "-",
      laboratorium_kode: item.laboratorium?.kode_lab || "-",
    }));
  } catch (error) {
    console.error("Error fetching inventory alerts:", error);
    throw error;
  }
}

// ============================================================================
// LAB SCHEDULE
// ============================================================================

/**
 * Get lab schedule for today
 */
export async function getLabScheduleToday(
  limit: number = 10,
): Promise<LabScheduleToday[]> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("jadwal_praktikum")
      .select(
        `
        id,
        hari,
        jam_mulai,
        jam_selesai,
        tanggal_praktikum,
        topik,
        kelas_id,
        laboratorium_id
      `,
      )
      .eq("tanggal_praktikum", today)
      .eq("is_active", true)
      .order("jam_mulai", { ascending: true })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch related data separately
    const kelasIds = [
      ...new Set(
        data
          .map((item) => item.kelas_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const labIds = [
      ...new Set(
        data
          .map((item) => item.laboratorium_id)
          .filter((id): id is string => id !== null),
      ),
    ];

    const [kelasData, labData] = await Promise.all([
      kelasIds.length > 0
        ? supabase
            .from("kelas")
            .select("id, nama_kelas, mata_kuliah_id, dosen_id")
            .in("id", kelasIds)
        : Promise.resolve({ data: [] }),
      labIds.length > 0
        ? supabase.from("laboratorium").select("id, nama_lab").in("id", labIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch mata kuliah and dosen if we have kelas data
    const mataKuliahIds = [
      ...new Set(
        kelasData.data?.map((k: any) => k.mata_kuliah_id).filter(Boolean) || [],
      ),
    ];
    const dosenIds = [
      ...new Set(
        kelasData.data?.map((k: any) => k.dosen_id).filter(Boolean) || [],
      ),
    ];

    const [mataKuliahData, dosenData] = await Promise.all([
      mataKuliahIds.length > 0
        ? supabase
            .from("mata_kuliah")
            .select("id, nama_mk")
            .in("id", mataKuliahIds)
        : Promise.resolve({ data: [] }),
      dosenIds.length > 0
        ? supabase
            .from("dosen")
            .select("id, user_id, users!dosen_user_id_fkey(full_name)")
            .in("id", dosenIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Create maps for quick lookup
    const kelasMap = new Map(
      (kelasData.data?.map((k: any) => [k.id, k]) || []) as [string, any][],
    );
    const labMap = new Map(
      (labData.data?.map((l: any) => [l.id, l]) || []) as [string, any][],
    );
    const mataKuliahMap = new Map(
      (mataKuliahData.data?.map((mk: any) => [mk.id, mk]) || []) as [
        string,
        any,
      ][],
    );
    const dosenMap = new Map(
      (dosenData.data?.map((d: any) => [d.id, d]) || []) as [string, any][],
    );

    return data.map((item: any) => {
      const kelas = kelasMap.get(item.kelas_id);
      const lab = labMap.get(item.laboratorium_id);
      const mataKuliah = kelas ? mataKuliahMap.get(kelas.mata_kuliah_id) : null;
      const dosen = kelas ? dosenMap.get(kelas.dosen_id) : null;

      return {
        id: item.id,
        mata_kuliah_nama: mataKuliah?.nama_mk || "Unknown",
        kelas_nama: kelas?.nama_kelas || "-",
        dosen_nama: dosen?.users?.full_name || "Unknown",
        laboratorium_nama: lab?.nama_lab || "-",
        hari: item.hari,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        tanggal_praktikum: item.tanggal_praktikum,
        topik: item.topik || "-",
      };
    });
  } catch (error) {
    console.error("Error fetching lab schedule today:", error);
    throw error;
  }
}

// ============================================================================
// APPROVAL ACTIONS
// ============================================================================

/**
 * Approve peminjaman request
 */
async function approvePeminjamanImpl(peminjamanId: string): Promise<void> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Step 1: Get peminjaman details (inventaris_id, jumlah_pinjam)
    const { data: peminjamanData, error: fetchError } = await supabase
      .from("peminjaman")
      .select("inventaris_id, jumlah_pinjam")
      .eq("id", peminjamanId)
      .eq("status", "pending")
      .single();

    if (fetchError || !peminjamanData) {
      throw new Error("Peminjaman not found or not in pending status");
    }

    // Step 2: Check inventory stock BEFORE approving (CRITICAL FIX)
    const { data: invData, error: invFetchError } = await supabase
      .from("inventaris")
      .select("jumlah_tersedia, nama_barang")
      .eq("id", peminjamanData.inventaris_id)
      .single();

    if (invFetchError || !invData) {
      throw new Error("Inventaris not found");
    }

    // ✅ VALIDATE: Check if stock is sufficient
    if (invData.jumlah_tersedia < peminjamanData.jumlah_pinjam) {
      throw new Error(
        `Stok tidak cukup! ${invData.nama_barang} tersedia: ${invData.jumlah_tersedia}, diminta: ${peminjamanData.jumlah_pinjam}`,
      );
    }

    // Step 3: Update peminjaman status to approved (only if stock is sufficient)
    const { error: updateError } = await supabase
      .from("peminjaman")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", peminjamanId)
      .eq("status", "pending");

    if (updateError) throw updateError;

    // Step 4: Decrease inventory stock (now safe, already validated)
    const newStock = invData.jumlah_tersedia - peminjamanData.jumlah_pinjam;
    const { error: stockError } = await supabase
      .from("inventaris")
      .update({ jumlah_tersedia: newStock })
      .eq("id", peminjamanData.inventaris_id);

    if (stockError) throw stockError;
  } catch (error) {
    console.error("Error approving peminjaman:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:peminjaman permission
export const approvePeminjaman = requirePermission(
  "manage:peminjaman",
  approvePeminjamanImpl,
);

/**
 * Reject peminjaman request
 */
async function rejectPeminjamanImpl(
  peminjamanId: string,
  rejectionReason: string,
): Promise<void> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("peminjaman")
      .update({
        status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq("id", peminjamanId)
      .eq("status", "pending"); // Only update if still pending

    if (error) throw error;
  } catch (error) {
    console.error("Error rejecting peminjaman:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:peminjaman permission
export const rejectPeminjaman = requirePermission(
  "manage:peminjaman",
  rejectPeminjamanImpl,
);

/**
 * Process approval action (approve or reject)
 */
async function processApprovalImpl(action: ApprovalAction): Promise<void> {
  if (action.status === "approved") {
    await approvePeminjaman(action.peminjaman_id);
  } else if (action.status === "rejected") {
    if (!action.rejection_reason) {
      throw new Error("Rejection reason is required");
    }
    await rejectPeminjaman(action.peminjaman_id, action.rejection_reason);
  } else {
    throw new Error("Invalid approval action");
  }
}

// 🔒 PROTECTED: Requires manage:peminjaman permission
export const processApproval = requirePermission(
  "manage:peminjaman",
  processApprovalImpl,
);
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
    let query = supabase.from("inventaris").select(
      `
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
      `,
      { count: "exact" },
    );

    // Apply filters
    if (params?.laboratorium_id) {
      query = query.eq("laboratorium_id", params.laboratorium_id);
    }

    if (params?.kategori) {
      query = query.eq("kategori", params.kategori);
    }

    if (params?.search) {
      query = query.or(
        `nama_barang.ilike.%${params.search}%,kode_barang.ilike.%${params.search}%`,
      );
    }

    // Apply pagination
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 10) - 1,
      );
    }

    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data || []) as InventarisListItem[],
      count: count || 0,
    };
  } catch (error) {
    console.error("Error fetching inventaris list:", error);
    throw error;
  }
}

/**
 * Get single inventaris by ID
 */
export async function getInventarisById(
  id: string,
): Promise<InventarisListItem> {
  try {
    const { data, error } = await supabase
      .from("inventaris")
      .select(
        `
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
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Inventaris not found");

    return data as InventarisListItem;
  } catch (error) {
    console.error("Error fetching inventaris:", error);
    throw error;
  }
}

/**
 * Create new inventaris
 */
async function createInventarisImpl(
  data: CreateInventarisData,
): Promise<string> {
  try {
    const { data: result, error } = await supabase
      .from("inventaris")
      .insert({
        kode_barang: data.kode_barang,
        nama_barang: data.nama_barang,
        kategori: data.kategori || null,
        merk: data.merk || null,
        spesifikasi: data.spesifikasi || null,
        jumlah: data.jumlah,
        jumlah_tersedia: data.jumlah_tersedia,
        kondisi: data.kondisi || "baik",
        harga_satuan: data.harga_satuan || null,
        tahun_pengadaan: data.tahun_pengadaan || null,
        laboratorium_id: data.laboratorium_id || null,
        keterangan: data.keterangan || null,
      } as any)
      .select("id")
      .single();

    if (error) throw error;
    if (!result) throw new Error("Failed to create inventaris");

    return result.id;
  } catch (error) {
    console.error("Error creating inventaris:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:inventaris permission
export const createInventaris = requirePermission(
  "manage:inventaris",
  createInventarisImpl,
);

/**
 * Update inventaris
 */
async function updateInventarisImpl(
  id: string,
  data: UpdateInventarisData,
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.kode_barang !== undefined)
      updateData.kode_barang = data.kode_barang;
    if (data.nama_barang !== undefined)
      updateData.nama_barang = data.nama_barang;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.merk !== undefined) updateData.merk = data.merk;
    if (data.spesifikasi !== undefined)
      updateData.spesifikasi = data.spesifikasi;
    if (data.jumlah !== undefined) updateData.jumlah = data.jumlah;
    if (data.jumlah_tersedia !== undefined)
      updateData.jumlah_tersedia = data.jumlah_tersedia;
    if (data.kondisi !== undefined) updateData.kondisi = data.kondisi;
    if (data.harga_satuan !== undefined)
      updateData.harga_satuan = data.harga_satuan;
    if (data.tahun_pengadaan !== undefined)
      updateData.tahun_pengadaan = data.tahun_pengadaan;
    if (data.laboratorium_id !== undefined)
      updateData.laboratorium_id = data.laboratorium_id;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    const { error } = await supabase
      .from("inventaris")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating inventaris:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:inventaris permission
export const updateInventaris = requirePermission(
  "manage:inventaris",
  updateInventarisImpl,
);

/**
 * Delete inventaris
 */
async function deleteInventarisImpl(id: string): Promise<void> {
  try {
    // Check if inventaris has active borrowings
    const { data: borrowings, error: borrowError } = await supabase
      .from("peminjaman")
      .select("id")
      .eq("inventaris_id", id)
      .in("status", ["pending", "approved"])
      .limit(1);

    if (borrowError) throw borrowError;

    if (borrowings && borrowings.length > 0) {
      throw new Error("Cannot delete inventaris with active borrowings");
    }

    const { error } = await supabase.from("inventaris").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting inventaris:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:inventaris permission
export const deleteInventaris = requirePermission(
  "manage:inventaris",
  deleteInventarisImpl,
);

/**
 * Update stock quantity
 */
async function updateStockImpl(
  id: string,
  adjustment: number,
  type: "add" | "subtract" | "set",
): Promise<void> {
  try {
    // Get current stock
    const { data: current, error: fetchError } = await supabase
      .from("inventaris")
      .select("jumlah, jumlah_tersedia")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!current) throw new Error("Inventaris not found");

    let newJumlah = current.jumlah;
    let newJumlahTersedia = current.jumlah_tersedia;

    switch (type) {
      case "add":
        newJumlah += adjustment;
        newJumlahTersedia += adjustment;
        break;
      case "subtract":
        newJumlah = Math.max(0, current.jumlah - adjustment);
        newJumlahTersedia = Math.max(0, current.jumlah_tersedia - adjustment);
        break;
      case "set":
        newJumlah = adjustment;
        newJumlahTersedia = adjustment;
        break;
    }

    const { error } = await supabase
      .from("inventaris")
      .update({
        jumlah: newJumlah,
        jumlah_tersedia: newJumlahTersedia,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating stock:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:inventaris permission
export const updateStock = requirePermission(
  "manage:inventaris",
  updateStockImpl,
);

/**
 * Get available categories
 */
export async function getInventarisCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("inventaris")
      .select("kategori")
      .not("kategori", "is", null);

    if (error) throw error;

    const categories = Array.from(
      new Set((data || []).map((item) => item.kategori).filter(Boolean)),
    ) as string[];

    return categories.sort();
  } catch (error) {
    console.error("Error fetching categories:", error);
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
    let query = supabase.from("laboratorium").select("*").order("kode_lab");

    if (params?.is_active !== undefined) {
      query = query.eq("is_active", params.is_active);
    }

    if (params?.search) {
      query = query.or(
        `nama_lab.ilike.%${params.search}%,kode_lab.ilike.%${params.search}%,lokasi.ilike.%${params.search}%`,
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Laboratorium[];
  } catch (error) {
    console.error("Error fetching laboratorium list:", error);
    throw error;
  }
}

/**
 * Get single laboratorium by ID
 */
export async function getLaboratoriumById(id: string): Promise<Laboratorium> {
  try {
    const { data, error } = await supabase
      .from("laboratorium")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Laboratorium not found");

    return data as Laboratorium;
  } catch (error) {
    console.error("Error fetching laboratorium:", error);
    throw error;
  }
}

/**
 * Get lab schedule by lab ID
 */
export async function getLabScheduleByLabId(
  labId: string,
  limit: number = 10,
): Promise<LabScheduleItem[]> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("jadwal_praktikum")
      .select(
        `
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
      `,
      )
      .eq("laboratorium_id", labId)
      .gte("tanggal_praktikum", today)
      .order("tanggal_praktikum")
      .order("jam_mulai")
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      tanggal_praktikum: item.tanggal_praktikum,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      topik: item.topik || null,
      kelas_nama: item.kelas?.nama_kelas || "-",
      mata_kuliah_nama: item.kelas?.mata_kuliah?.nama_mk || "Unknown",
      dosen_nama: item.kelas?.dosen?.user?.full_name || "Unknown",
    }));
  } catch (error) {
    console.error("Error fetching lab schedule:", error);
    throw error;
  }
}

/**
 * Get lab equipment/inventaris by lab ID
 */
export async function getLabEquipment(
  labId: string,
): Promise<LabEquipmentItem[]> {
  try {
    const { data, error } = await supabase
      .from("inventaris")
      .select("id, kode_barang, nama_barang, kondisi, jumlah, jumlah_tersedia")
      .eq("laboratorium_id", labId)
      .order("nama_barang");

    if (error) throw error;

    return (data || []) as LabEquipmentItem[];
  } catch (error) {
    console.error("Error fetching lab equipment:", error);
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

async function updateLaboratoriumImpl(
  id: string,
  data: UpdateLaboratoriumData,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("laboratorium")
      .update(data)
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating laboratorium:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:laboratorium permission
export const updateLaboratorium = requirePermission(
  "manage:laboratorium",
  updateLaboratoriumImpl,
);

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

async function createLaboratoriumImpl(
  data: CreateLaboratoriumData,
): Promise<void> {
  try {
    const { error } = await supabase.from("laboratorium").insert(data);

    if (error) throw error;
  } catch (error) {
    console.error("Error creating laboratorium:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:laboratorium permission
export const createLaboratorium = requirePermission(
  "manage:laboratorium",
  createLaboratoriumImpl,
);

/**
 * Delete laboratorium (Admin only)
 * WARNING: This will permanently delete the laboratory
 * Checks for related data before deletion
 */
async function deleteLaboratoriumImpl(id: string): Promise<void> {
  try {
    // Check if lab has any equipment
    const { data: equipment, error: equipError } = await supabase
      .from("inventaris")
      .select("id")
      .eq("laboratorium_id", id)
      .limit(1);

    if (equipError) throw equipError;

    if (equipment && equipment.length > 0) {
      throw new Error(
        "Cannot delete laboratory that has equipment assigned to it",
      );
    }

    // Check if lab has any schedules
    const { data: schedules, error: schedError } = await supabase
      .from("jadwal_praktikum")
      .select("id")
      .eq("laboratorium_id", id)
      .limit(1);

    if (schedError) throw schedError;

    if (schedules && schedules.length > 0) {
      throw new Error(
        "Cannot delete laboratory that has schedules assigned to it",
      );
    }

    // If no related data, proceed with deletion
    const { error: deleteError } = await supabase
      .from("laboratorium")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error("Error deleting laboratorium:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:laboratorium permission
export const deleteLaboratorium = requirePermission(
  "manage:laboratorium",
  deleteLaboratoriumImpl,
);

// ============================================================================
// APPROVAL HISTORY
// ============================================================================

export interface ApprovalHistory {
  id: string;
  peminjam_nama: string;
  peminjam_nim: string;
  inventaris_nama: string;
  inventaris_kode: string;
  laboratorium_nama: string;
  jumlah_pinjam: number;
  status: "approved" | "rejected";
  approved_by_nama: string;
  approved_by_role: string;
  approved_at: string;
  rejection_reason?: string;
}

/**
 * Get approval history (approved/rejected peminjaman)
 */
export async function getApprovalHistory(
  limit: number = 20,
): Promise<ApprovalHistory[]> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        `
        id,
        jumlah_pinjam,
        status,
        approved_at,
        rejection_reason,
        peminjam_id,
        dosen_id,
        inventaris_id,
        approved_by
      `,
      )
      .in("status", ["approved", "rejected"])
      .not("approved_by", "is", null)
      .order("approved_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch related data separately
    const peminjamIds = [
      ...new Set(
        data
          ?.map((item) => item.peminjam_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const dosenIds = [
      ...new Set(
        data
          ?.map((item) => item.dosen_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const inventarisIds = [
      ...new Set(data?.map((item) => item.inventaris_id).filter(Boolean)),
    ];
    const approverIds = [
      ...new Set(
        data
          ?.map((item) => item.approved_by)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [mahasiswaData, dosenData, inventarisData, approverData] =
      await Promise.all([
        peminjamIds.length > 0
          ? supabase
              .from("mahasiswa")
              .select("id, nim, user_id")
              .in("id", peminjamIds)
          : Promise.resolve({ data: [] }),
        dosenIds.length > 0
          ? supabase.from("dosen").select("id, nip, user_id").in("id", dosenIds)
          : Promise.resolve({ data: [] }),
        inventarisIds.length > 0
          ? supabase
              .from("inventaris")
              .select(
                "id, kode_barang, nama_barang, laboratorium_id, laboratorium!inventaris_laboratorium_id_fkey(nama_lab)",
              )
              .in("id", inventarisIds)
          : Promise.resolve({ data: [] }),
        approverIds.length > 0
          ? supabase
              .from("users")
              .select("id, full_name, role")
              .in("id", approverIds)
          : Promise.resolve({ data: [] }),
      ]);

    // Fetch all user names
    const allUserIds = [
      ...new Set([
        ...(mahasiswaData.data?.map((m: any) => m.user_id).filter(Boolean) ||
          []),
        ...(dosenData.data?.map((d: any) => d.user_id).filter(Boolean) || []),
        ...(approverData.data?.map((a: any) => a.id).filter(Boolean) || []),
      ]),
    ];
    const usersData =
      allUserIds.length > 0
        ? await supabase
            .from("users")
            .select("id, full_name")
            .in("id", allUserIds)
        : { data: [] };

    const mahasiswaMap = new Map(
      (mahasiswaData.data?.map((m: any) => [m.id, m]) || []) as [string, any][],
    );
    const dosenMap = new Map(
      (dosenData.data?.map((d: any) => [d.id, d]) || []) as [string, any][],
    );
    const inventarisMap = new Map(
      (inventarisData.data?.map((i: any) => [i.id, i]) || []) as [
        string,
        any,
      ][],
    );
    const approverMap = new Map(
      (approverData.data?.map((a: any) => [a.id, a]) || []) as [string, any][],
    );
    const usersMap = new Map(
      (usersData.data?.map((u: any) => [u.id, u]) || []) as [string, any][],
    );

    return (data || []).map((item: any) => {
      const inventaris = inventarisMap.get(item.inventaris_id);
      const approver = approverMap.get(item.approved_by);

      // Check if peminjam is mahasiswa or dosen
      let peminjamNama = "Unknown";
      let peminjamNim = "-";

      if (item.dosen_id) {
        // Peminjam is DOSEN
        const dosen = dosenMap.get(item.dosen_id);
        const user = dosen?.user_id ? usersMap.get(dosen.user_id) : null;
        peminjamNama = user?.full_name || dosen?.nip || "Unknown";
        peminjamNim = dosen?.nip || "-";
      } else if (item.peminjam_id) {
        // Peminjam is MAHASISWA
        const mahasiswa = mahasiswaMap.get(item.peminjam_id);
        const user = mahasiswa?.user_id
          ? usersMap.get(mahasiswa.user_id)
          : null;
        peminjamNama = user?.full_name || mahasiswa?.nim || "Unknown";
        peminjamNim = mahasiswa?.nim || "-";
      }

      return {
        id: item.id,
        peminjam_nama: peminjamNama,
        peminjam_nim: peminjamNim,
        inventaris_nama: inventaris?.nama_barang || "Unknown",
        inventaris_kode: inventaris?.kode_barang || "-",
        laboratorium_nama: inventaris?.laboratorium?.nama_lab || "-",
        jumlah_pinjam: item.jumlah_pinjam,
        status: item.status,
        approved_by_nama: (approver as any)?.full_name || "Unknown",
        approved_by_role: (approver as any)?.role || "unknown",
        approved_at: item.approved_at,
        rejection_reason: item.rejection_reason,
      };
    });
  } catch (error) {
    console.error("Error fetching approval history:", error);
    throw error;
  }
}

// ============================================================================
// ACTIVE BORROWINGS & RETURN MANAGEMENT
// ============================================================================

export interface ActiveBorrowing {
  id: string;
  peminjam_nama: string;
  peminjam_nim: string;
  inventaris_id: string;
  inventaris_nama: string;
  inventaris_kode: string;
  laboratorium_nama: string;
  jumlah_pinjam: number;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  keperluan: string;
  kondisi_pinjam: string;
  approved_at: string;
  is_overdue: boolean;
  days_overdue: number;
}

export interface ReturnedBorrowing {
  id: string;
  peminjam_nama: string;
  peminjam_nim: string;
  inventaris_nama: string;
  inventaris_kode: string;
  laboratorium_nama: string;
  jumlah_pinjam: number;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string;
  kondisi_pinjam: string;
  kondisi_kembali: string;
  keterangan_kembali: string | null;
  denda: number;
  was_overdue: boolean;
}

/**
 * Get active borrowings (approved but not yet returned)
 */
export async function getActiveBorrowings(
  limit: number = 100,
): Promise<ActiveBorrowing[]> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        `
        id,
        inventaris_id,
        peminjam_id,
        dosen_id,
        jumlah_pinjam,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        keperluan,
        kondisi_pinjam,
        approved_at,
        created_at
      `,
      )
      .eq("status", "approved")
      .order("tanggal_kembali_rencana", { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Fetch related data separately
    const peminjamIds = [
      ...new Set(
        data
          ?.map((item) => item.peminjam_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const dosenIds = [
      ...new Set(
        data
          ?.map((item) => item.dosen_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const inventarisIds = [
      ...new Set(
        data
          ?.map((item) => item.inventaris_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [mahasiswaData, dosenData, inventarisData] = await Promise.all([
      peminjamIds.length > 0
        ? supabase
            .from("mahasiswa")
            .select("id, nim, user_id")
            .in("id", peminjamIds)
        : Promise.resolve({ data: [] }),
      dosenIds.length > 0
        ? supabase.from("dosen").select("id, nip, user_id").in("id", dosenIds)
        : Promise.resolve({ data: [] }),
      inventarisIds.length > 0
        ? supabase
            .from("inventaris")
            .select(
              "id, kode_barang, nama_barang, laboratorium_id, laboratorium!inventaris_laboratorium_id_fkey(nama_lab)",
            )
            .in("id", inventarisIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch all user names
    const allUserIds = [
      ...new Set([
        ...(mahasiswaData.data?.map((m: any) => m.user_id).filter(Boolean) ||
          []),
        ...(dosenData.data?.map((d: any) => d.user_id).filter(Boolean) || []),
      ]),
    ];
    const usersData =
      allUserIds.length > 0
        ? await supabase
            .from("users")
            .select("id, full_name")
            .in("id", allUserIds)
        : { data: [] };

    const mahasiswaMap = new Map(
      (mahasiswaData.data?.map((m: any) => [m.id, m]) || []) as [string, any][],
    );
    const dosenMap = new Map(
      (dosenData.data?.map((d: any) => [d.id, d]) || []) as [string, any][],
    );
    const inventarisMap = new Map(
      (inventarisData.data?.map((i: any) => [i.id, i]) || []) as [
        string,
        any,
      ][],
    );
    const usersMap = new Map(
      (usersData.data?.map((u: any) => [u.id, u]) || []) as [string, any][],
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (data || []).map((item: any) => {
      const inventaris = inventarisMap.get(item.inventaris_id);

      // Check if peminjam is mahasiswa or dosen
      let peminjamNama = "Unknown";
      let peminjamNim = "-";

      if (item.dosen_id) {
        // Peminjam is DOSEN
        const dosen = dosenMap.get(item.dosen_id);
        const user = dosen?.user_id ? usersMap.get(dosen.user_id) : null;
        peminjamNama = user?.full_name || dosen?.nip || "Unknown";
        peminjamNim = dosen?.nip || "-";
      } else if (item.peminjam_id) {
        // Peminjam is MAHASISWA
        const mahasiswa = mahasiswaMap.get(item.peminjam_id);
        const user = mahasiswa?.user_id
          ? usersMap.get(mahasiswa.user_id)
          : null;
        peminjamNama = user?.full_name || mahasiswa?.nim || "Unknown";
        peminjamNim = mahasiswa?.nim || "-";
      }

      const returnDate = new Date(item.tanggal_kembali_rencana);
      returnDate.setHours(0, 0, 0, 0);
      const isOverdue = returnDate < today;
      const daysOverdue = isOverdue
        ? Math.floor(
            (today.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 0;

      return {
        id: item.id,
        peminjam_nama: peminjamNama,
        peminjam_nim: peminjamNim,
        inventaris_id: item.inventaris_id,
        inventaris_nama: inventaris?.nama_barang || "Unknown",
        inventaris_kode: inventaris?.kode_barang || "-",
        laboratorium_nama: inventaris?.laboratorium?.nama_lab || "-",
        jumlah_pinjam: item.jumlah_pinjam,
        tanggal_pinjam: item.tanggal_pinjam,
        tanggal_kembali_rencana: item.tanggal_kembali_rencana,
        keperluan: item.keperluan,
        kondisi_pinjam: item.kondisi_pinjam || "baik",
        approved_at: item.approved_at,
        is_overdue: isOverdue,
        days_overdue: daysOverdue,
      };
    });
  } catch (error) {
    console.error("Error fetching active borrowings:", error);
    throw error;
  }
}

/**
 * Get returned borrowings history
 */
export async function getReturnedBorrowings(
  limit: number = 50,
): Promise<ReturnedBorrowing[]> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        `
        id,
        inventaris_id,
        peminjam_id,
        dosen_id,
        jumlah_pinjam,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        tanggal_kembali_aktual,
        kondisi_pinjam,
        kondisi_kembali,
        keterangan_kembali,
        denda,
        created_at
      `,
      )
      .eq("status", "returned")
      .order("tanggal_kembali_aktual", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch related data separately
    const peminjamIds = [
      ...new Set(
        data
          ?.map((item) => item.peminjam_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const dosenIds = [
      ...new Set(
        data
          ?.map((item) => item.dosen_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const inventarisIds = [
      ...new Set(
        data
          ?.map((item) => item.inventaris_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [mahasiswaData, dosenData, inventarisData] = await Promise.all([
      peminjamIds.length > 0
        ? supabase
            .from("mahasiswa")
            .select("id, nim, user_id")
            .in("id", peminjamIds)
        : Promise.resolve({ data: [] }),
      dosenIds.length > 0
        ? supabase.from("dosen").select("id, nip, user_id").in("id", dosenIds)
        : Promise.resolve({ data: [] }),
      inventarisIds.length > 0
        ? supabase
            .from("inventaris")
            .select(
              "id, kode_barang, nama_barang, laboratorium_id, laboratorium!inventaris_laboratorium_id_fkey(nama_lab)",
            )
            .in("id", inventarisIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch all user names
    const allUserIds = [
      ...new Set([
        ...(mahasiswaData.data?.map((m: any) => m.user_id).filter(Boolean) ||
          []),
        ...(dosenData.data?.map((d: any) => d.user_id).filter(Boolean) || []),
      ]),
    ];
    const usersData =
      allUserIds.length > 0
        ? await supabase
            .from("users")
            .select("id, full_name")
            .in("id", allUserIds)
        : { data: [] };

    const mahasiswaMap = new Map(
      (mahasiswaData.data?.map((m: any) => [m.id, m]) || []) as [string, any][],
    );
    const dosenMap = new Map(
      (dosenData.data?.map((d: any) => [d.id, d]) || []) as [string, any][],
    );
    const inventarisMap = new Map(
      (inventarisData.data?.map((i: any) => [i.id, i]) || []) as [
        string,
        any,
      ][],
    );
    const usersMap = new Map(
      (usersData.data?.map((u: any) => [u.id, u]) || []) as [string, any][],
    );

    return (data || []).map((item: any) => {
      const inventaris = inventarisMap.get(item.inventaris_id);

      // Check if peminjam is mahasiswa or dosen
      let peminjamNama = "Unknown";
      let peminjamNim = "-";

      if (item.dosen_id) {
        // Peminjam is DOSEN
        const dosen = dosenMap.get(item.dosen_id);
        const user = dosen?.user_id ? usersMap.get(dosen.user_id) : null;
        peminjamNama = user?.full_name || dosen?.nip || "Unknown";
        peminjamNim = dosen?.nip || "-";
      } else if (item.peminjam_id) {
        // Peminjam is MAHASISWA
        const mahasiswa = mahasiswaMap.get(item.peminjam_id);
        const user = mahasiswa?.user_id
          ? usersMap.get(mahasiswa.user_id)
          : null;
        peminjamNama = user?.full_name || mahasiswa?.nim || "Unknown";
        peminjamNim = mahasiswa?.nim || "-";
      }

      const returnDate = new Date(item.tanggal_kembali_rencana);
      returnDate.setHours(0, 0, 0, 0);
      const actualReturnDate = new Date(item.tanggal_kembali_aktual);
      actualReturnDate.setHours(0, 0, 0, 0);
      const wasOverdue = actualReturnDate > returnDate;

      return {
        id: item.id,
        peminjam_nama: peminjamNama,
        peminjam_nim: peminjamNim,
        inventaris_nama: inventaris?.nama_barang || "Unknown",
        inventaris_kode: inventaris?.kode_barang || "-",
        laboratorium_nama: inventaris?.laboratorium?.nama_lab || "-",
        jumlah_pinjam: item.jumlah_pinjam,
        tanggal_pinjam: item.tanggal_pinjam,
        tanggal_kembali_rencana: item.tanggal_kembali_rencana,
        tanggal_kembali_aktual: item.tanggal_kembali_aktual,
        kondisi_pinjam: item.kondisi_pinjam || "baik",
        kondisi_kembali: item.kondisi_kembali || "baik",
        keterangan_kembali: item.keterangan_kembali,
        denda: item.denda || 0,
        was_overdue: wasOverdue,
      };
    });
  } catch (error) {
    console.error("Error fetching returned borrowings:", error);
    throw error;
  }
}

/**
 * Mark borrowing as returned and restore inventory stock
 */
async function markBorrowingReturnedImpl(
  peminjamanId: string,
  kondisiKembali: "baik" | "rusak_ringan" | "rusak_berat" | "maintenance",
  keterangan?: string,
  denda?: number,
): Promise<void> {
  try {
    // Step 1: Get peminjaman details
    const { data: peminjamanData, error: fetchError } = await supabase
      .from("peminjaman")
      .select("inventaris_id, jumlah_pinjam")
      .eq("id", peminjamanId)
      .eq("status", "approved")
      .single();

    if (fetchError || !peminjamanData) {
      throw new Error("Peminjaman not found or not in approved status");
    }

    // Step 2: Get current inventory stock
    const { data: invData, error: invFetchError } = await supabase
      .from("inventaris")
      .select("jumlah_tersedia, nama_barang")
      .eq("id", peminjamanData.inventaris_id)
      .single();

    if (invFetchError || !invData) {
      throw new Error("Inventaris not found");
    }

    // Step 3: Update peminjaman status to returned
    const { error: updateError } = await supabase
      .from("peminjaman")
      .update({
        status: "returned",
        tanggal_kembali_aktual: new Date().toISOString(),
        kondisi_kembali: kondisiKembali,
        keterangan_kembali: keterangan || null,
        denda: denda || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", peminjamanId)
      .eq("status", "approved");

    if (updateError) throw updateError;

    // Step 4: RESTORE inventory stock (FIX BUG!)
    const newStock = invData.jumlah_tersedia + peminjamanData.jumlah_pinjam;
    const { error: stockError } = await supabase
      .from("inventaris")
      .update({ jumlah_tersedia: newStock })
      .eq("id", peminjamanData.inventaris_id);

    if (stockError) throw stockError;
  } catch (error) {
    console.error("Error marking borrowing as returned:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:peminjaman permission
export const markBorrowingReturned = requirePermission(
  "manage:peminjaman",
  markBorrowingReturnedImpl,
);
