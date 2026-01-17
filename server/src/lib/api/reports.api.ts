/**
 * Reports API
 * API functions for generating reports and statistics
 */

import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { handleSupabaseError } from "@/lib/utils/errors";

// ============================================================================
// TYPES
// ============================================================================

export interface BorrowingStats {
  total_borrowings: number;
  pending: number;
  approved: number;
  rejected: number;
  returned: number;
  overdue: number;
  total_equipment_borrowed: number;
}

export interface EquipmentStats {
  total_items: number;
  low_stock: number;
  out_of_stock: number;
  available: number;
  borrowed: number;
  total_categories: number;
}

export interface LabUsageStats {
  total_labs: number;
  active_schedules: number;
  pending_bookings: number;
  approved_bookings: number;
  total_capacity: number;
}

export interface TopBorrowedItem {
  inventaris_id: string;
  kode_barang: string;
  nama_barang: string;
  kategori: string;
  total_borrowed: number;
  times_borrowed: number;
}

export interface BorrowingTrend {
  date: string;
  count: number;
  approved: number;
  rejected: number;
}

export interface LabUtilization {
  laboratorium_id: string;
  kode_lab: string;
  nama_lab: string;
  total_schedules: number;
  total_hours: number;
  utilization_percentage: number;
}

export interface RecentActivity {
  id: string;
  type: "borrowing" | "return" | "approval" | "rejection";
  description: string;
  user_name: string;
  timestamp: string;
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

/**
 * Get borrowing statistics
 */
export async function getBorrowingStats(): Promise<BorrowingStats> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select("status, jumlah_pinjam");

    if (error) throw error;

    const stats: BorrowingStats = {
      total_borrowings: data?.length || 0,
      pending: data?.filter((p) => p.status === "pending").length || 0,
      approved: data?.filter((p) => p.status === "approved").length || 0,
      rejected: data?.filter((p) => p.status === "rejected").length || 0,
      returned: data?.filter((p) => p.status === "returned").length || 0,
      overdue: data?.filter((p) => p.status === "overdue").length || 0,
      total_equipment_borrowed:
        data?.reduce((sum, p) => sum + (p.jumlah_pinjam || 0), 0) || 0,
    };

    return stats;
  } catch (error) {
    logger.error("Failed to fetch borrowing stats", { error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get equipment statistics
 */
export async function getEquipmentStats(): Promise<EquipmentStats> {
  try {
    const { data, error } = await supabase
      .from("inventaris")
      .select("jumlah, jumlah_tersedia, kategori");

    if (error) throw error;

    const stats: EquipmentStats = {
      total_items: data?.length || 0,
      low_stock:
        data?.filter((i) => i.jumlah_tersedia < 5 && i.jumlah_tersedia > 0)
          .length || 0,
      out_of_stock: data?.filter((i) => i.jumlah_tersedia === 0).length || 0,
      available: data?.filter((i) => i.jumlah_tersedia > 0).length || 0,
      borrowed:
        data?.reduce((sum, i) => sum + (i.jumlah - i.jumlah_tersedia), 0) || 0,
      total_categories: new Set(data?.map((i) => i.kategori).filter(Boolean))
        .size,
    };

    return stats;
  } catch (error) {
    logger.error("Failed to fetch equipment stats", { error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get lab usage statistics
 */
export async function getLabUsageStats(): Promise<LabUsageStats> {
  try {
    const [labsResult, schedulesResult, bookingsResult] = await Promise.all([
      supabase.from("laboratorium").select("kapasitas").eq("is_active", true),
      supabase.from("jadwal_praktikum").select("id").eq("is_active", true),
      supabase.from("jadwal_praktikum").select("id").eq("is_active", false),
    ]);

    const stats: LabUsageStats = {
      total_labs: labsResult.data?.length || 0,
      active_schedules: schedulesResult.data?.length || 0,
      pending_bookings: bookingsResult.data?.length || 0,
      approved_bookings: schedulesResult.data?.length || 0,
      total_capacity:
        labsResult.data?.reduce((sum, lab) => sum + (lab.kapasitas || 0), 0) ||
        0,
    };

    return stats;
  } catch (error) {
    logger.error("Failed to fetch lab usage stats", { error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get top borrowed items
 */
export async function getTopBorrowedItems(
  limit: number = 10,
): Promise<TopBorrowedItem[]> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        `
        inventaris_id,
        jumlah_pinjam,
        inventaris:inventaris!peminjaman_inventaris_id_fkey(
          kode_barang,
          nama_barang,
          kategori
        )
      `,
      )
      .in("status", ["approved", "returned"]);

    if (error) throw error;

    // Aggregate by inventaris_id
    const aggregated = (data || []).reduce(
      (acc: Record<string, TopBorrowedItem>, item: Record<string, unknown>) => {
        const invId = item.inventaris_id as string;
        const inv = item.inventaris as Record<string, unknown>;

        if (!acc[invId]) {
          acc[invId] = {
            inventaris_id: invId,
            kode_barang: (inv?.kode_barang as string) || "-",
            nama_barang: (inv?.nama_barang as string) || "Unknown",
            kategori: (inv?.kategori as string) || "Uncategorized",
            total_borrowed: 0,
            times_borrowed: 0,
          };
        }

        acc[invId].total_borrowed += (item.jumlah_pinjam as number) || 0;
        acc[invId].times_borrowed += 1;

        return acc;
      },
      {},
    );

    // Sort by times_borrowed and limit
    return Object.values(aggregated)
      .sort((a, b) => b.times_borrowed - a.times_borrowed)
      .slice(0, limit);
  } catch (error) {
    logger.error("Failed to fetch top borrowed items", { limit, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get borrowing trends (last 30 days)
 */
export async function getBorrowingTrends(
  days: number = 30,
): Promise<BorrowingTrend[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("peminjaman")
      .select("tanggal_pinjam, status, created_at")
      .gte("created_at", startDate.toISOString());

    if (error) throw error;

    // Group by date
    const grouped = (data || []).reduce(
      (acc: Record<string, BorrowingTrend>, item) => {
        const date = new Date(item.created_at || item.tanggal_pinjam)
          .toISOString()
          .split("T")[0];

        if (!acc[date]) {
          acc[date] = {
            date,
            count: 0,
            approved: 0,
            rejected: 0,
          };
        }

        acc[date].count += 1;
        if (item.status === "approved" || item.status === "returned")
          acc[date].approved += 1;
        if (item.status === "rejected") acc[date].rejected += 1;

        return acc;
      },
      {},
    );

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    logger.error("Failed to fetch borrowing trends", { days, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get lab utilization
 */
export async function getLabUtilization(): Promise<LabUtilization[]> {
  try {
    const { data, error } = await supabase
      .from("jadwal_praktikum")
      .select(
        `
        laboratorium_id,
        jam_mulai,
        jam_selesai,
        laboratorium:laboratorium!jadwal_praktikum_laboratorium_id_fkey(
          kode_lab,
          nama_lab
        )
      `,
      )
      .eq("is_active", true);

    if (error) throw error;

    // Aggregate by laboratorium_id
    const aggregated = (data || []).reduce(
      (acc: Record<string, LabUtilization>, item: Record<string, unknown>) => {
        const labId = item.laboratorium_id as string;
        const lab = item.laboratorium as Record<string, unknown>;

        if (!acc[labId]) {
          acc[labId] = {
            laboratorium_id: labId,
            kode_lab: (lab?.kode_lab as string) || "-",
            nama_lab: (lab?.nama_lab as string) || "Unknown",
            total_schedules: 0,
            total_hours: 0,
            utilization_percentage: 0,
          };
        }

        acc[labId].total_schedules += 1;

        // Calculate hours
        const start = item.jam_mulai as string;
        const end = item.jam_selesai as string;
        if (start && end) {
          const startHour = parseInt(start.split(":")[0]);
          const endHour = parseInt(end.split(":")[0]);
          acc[labId].total_hours += endHour - startHour;
        }

        return acc;
      },
      {},
    );

    // Calculate utilization percentage (assuming 8 hours/day, 5 days/week = 40 hours)
    const result = Object.values(aggregated).map((lab) => ({
      ...lab,
      utilization_percentage: Math.min(100, (lab.total_hours / 40) * 100),
    }));

    return result.sort((a, b) => b.total_schedules - a.total_schedules);
  } catch (error) {
    logger.error("Failed to fetch lab utilization", { error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get recent activities
 */
export async function getRecentActivities(
  limit: number = 20,
): Promise<RecentActivity[]> {
  try {
    // FIX: peminjam_id references dosen table (NOT mahasiswa)
    // Business rule: Only dosen can borrow equipment
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        `
        id,
        status,
        created_at,
        tanggal_kembali_aktual,
        approved_at,
        dosen_id,
        inventaris:inventaris!peminjaman_inventaris_id_fkey(
          nama_barang
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get user names for peminjam (dosen only)
    const activities = await Promise.all(
      ((data as any) || []).map(async (item: Record<string, unknown>) => {
        const inventaris = item.inventaris as Record<string, unknown>;
        const equipmentName = (inventaris?.nama_barang as string) || "Unknown";

        // Get dosen name (peminjam is always dosen)
        let userName = "Unknown";

        if (item.dosen_id) {
          const { data: dosenData } = await supabase
            .from("dosen")
            .select("user:users!dosen_user_id_fkey(full_name)")
            .eq("id", item.dosen_id as string)
            .single();

          if (dosenData) {
            const user = dosenData.user as Record<string, unknown>;
            userName = (user?.full_name as string) || "Unknown";
          }
        }

        let type: "borrowing" | "return" | "approval" | "rejection" =
          "borrowing";
        let description = `${userName} requested to borrow ${equipmentName}`;
        let timestamp = item.created_at as string;

        if (item.status === "returned" && item.tanggal_kembali_aktual) {
          type = "return";
          description = `${userName} returned ${equipmentName}`;
          timestamp = item.tanggal_kembali_aktual as string;
        } else if (item.status === "approved" && item.approved_at) {
          type = "approval";
          description = `Borrowing of ${equipmentName} by ${userName} was approved`;
          timestamp = item.approved_at as string;
        } else if (item.status === "rejected" && item.approved_at) {
          type = "rejection";
          description = `Borrowing of ${equipmentName} by ${userName} was rejected`;
          timestamp = item.approved_at as string;
        }

        return {
          id: item.id as string,
          type,
          description,
          user_name: userName,
          timestamp,
        };
      }),
    );

    return activities;
  } catch (error) {
    logger.error("Failed to fetch recent activities", { limit, error });
    throw handleSupabaseError(error);
  }
}
