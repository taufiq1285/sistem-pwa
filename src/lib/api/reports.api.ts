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

export interface ReportPeriodFilter {
  startDate?: string;
  endDate?: string;
}

type BorrowingLikeRow = {
  id?: string | null;
  status?: string | null;
  jumlah_pinjam?: number | null;
  created_at?: string | null;
  tanggal_pinjam?: string | null;
  approved_at?: string | null;
  tanggal_kembali_aktual?: string | null;
  inventaris_id?: string | null;
  dosen_id?: string | null;
  inventaris?: Record<string, unknown> | null;
};

type DetailLikeRow = {
  peminjaman_id?: string | null;
  inventaris_id?: string | null;
  jumlah_pinjam?: number | null;
  inventaris?: Record<string, unknown> | null;
};

type JadwalLikeRow = {
  status?: string | null;
  tanggal_praktikum?: string | null;
  created_at?: string | null;
  laboratorium_id?: string | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  laboratorium?: Record<string, unknown> | null;
};

const ACTIVE_LAB_STATUSES = ["approved", "scheduled", "published"];
const REPORTABLE_JADWAL_STATUSES = [
  "pending",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "cancelled",
] as const;

function normalizeDateOnly(value?: string | null): string | null {
  if (!value) return null;
  return String(value).split("T")[0] || null;
}

function isWithinPeriod(
  value: string | null | undefined,
  filter?: ReportPeriodFilter,
): boolean {
  if (!filter?.startDate && !filter?.endDate) return true;

  const normalized = normalizeDateOnly(value);
  if (!normalized) return false;

  if (filter.startDate && normalized < filter.startDate) return false;
  if (filter.endDate && normalized > filter.endDate) return false;
  return true;
}

function getBorrowingReportDate(row: BorrowingLikeRow): string | null {
  if (row.status === "returned") {
    return (
      row.tanggal_kembali_aktual ||
      row.approved_at ||
      row.tanggal_pinjam ||
      row.created_at ||
      null
    );
  }

  if (row.status === "approved" || row.status === "return_requested") {
    return row.approved_at || row.tanggal_pinjam || row.created_at || null;
  }

  return row.tanggal_pinjam || row.created_at || null;
}

function getJadwalReportDate(row: JadwalLikeRow): string | null {
  return row.tanggal_praktikum || row.created_at || null;
}

function getStatusGroup(
  status?: string | null,
): "pending" | "approved" | "other" {
  if (status === "pending") return "pending";
  if (status && ACTIVE_LAB_STATUSES.includes(status)) return "approved";
  return "other";
}

async function getBorrowingDetailItems(
  peminjamanIds: string[],
): Promise<DetailLikeRow[]> {
  if (peminjamanIds.length === 0) return [];

  const detailResult = await supabase
    .from("peminjaman_detail" as never)
    .select(
      `
      peminjaman_id,
      inventaris_id,
      jumlah_pinjam,
      inventaris:inventaris_id(
        kode_barang,
        nama_barang,
        kategori
      )
    `,
    )
    .in("peminjaman_id", peminjamanIds);

  if (detailResult?.error) {
    logger.error("Failed to fetch borrowing detail items", {
      peminjamanIds,
      error: detailResult.error,
    });
    return [];
  }

  return (detailResult?.data as DetailLikeRow[] | null) || [];
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

/**
 * Get borrowing statistics
 */
export async function getBorrowingStats(
  filter?: ReportPeriodFilter,
): Promise<BorrowingStats> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        "id, status, jumlah_pinjam, created_at, tanggal_pinjam, approved_at, tanggal_kembali_aktual",
      );

    if (error) throw error;

    const borrowingRows = ((data as BorrowingLikeRow[] | null) || []).filter(
      (row) => isWithinPeriod(getBorrowingReportDate(row), filter),
    );
    const borrowingIds = borrowingRows
      .map((row) => row.id)
      .filter((id): id is string => Boolean(id));
    const detailRows = await getBorrowingDetailItems(borrowingIds);

    const detailTotals = detailRows.reduce((acc, item) => {
      const peminjamanId = item.peminjaman_id;
      if (!peminjamanId) return acc;
      acc.set(
        peminjamanId,
        (acc.get(peminjamanId) || 0) + (item.jumlah_pinjam || 0),
      );
      return acc;
    }, new Map<string, number>());

    const stats: BorrowingStats = {
      total_borrowings: borrowingRows.length,
      pending: borrowingRows.filter((p) => p.status === "pending").length || 0,
      approved:
        borrowingRows.filter((p) => p.status === "approved").length || 0,
      rejected:
        borrowingRows.filter((p) => p.status === "rejected").length || 0,
      returned:
        borrowingRows.filter((p) => p.status === "returned").length || 0,
      overdue: borrowingRows.filter((p) => p.status === "overdue").length || 0,
      total_equipment_borrowed: borrowingRows.reduce((sum, row) => {
        if (row.id && detailTotals.has(row.id)) {
          return sum + (detailTotals.get(row.id) || 0);
        }
        return sum + (row.jumlah_pinjam || 0);
      }, 0),
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
export async function getLabUsageStats(
  filter?: ReportPeriodFilter,
): Promise<LabUsageStats> {
  try {
    const [labsResult, jadwalResult] = await Promise.all([
      supabase.from("laboratorium").select("kapasitas").eq("is_active", true),
      supabase
        .from("jadwal_praktikum" as never)
        .select("status, tanggal_praktikum, created_at")
        .in("status", [...REPORTABLE_JADWAL_STATUSES] as never),
    ]);

    if (labsResult.error) throw labsResult.error;
    if (jadwalResult.error) throw jadwalResult.error;

    const jadwalRows = (
      (jadwalResult.data as JadwalLikeRow[] | null) || []
    ).filter((row) => isWithinPeriod(getJadwalReportDate(row), filter));

    const stats: LabUsageStats = {
      total_labs: labsResult.data?.length || 0,
      active_schedules:
        jadwalRows.filter((row) => getStatusGroup(row.status) === "approved")
          .length || 0,
      pending_bookings:
        jadwalRows.filter((row) => getStatusGroup(row.status) === "pending")
          .length || 0,
      approved_bookings:
        jadwalRows.filter((row) => getStatusGroup(row.status) === "approved")
          .length || 0,
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
  filter?: ReportPeriodFilter,
): Promise<TopBorrowedItem[]> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select(
        `
        id,
        status,
        created_at,
        approved_at,
        tanggal_pinjam,
        inventaris_id,
        jumlah_pinjam,
        inventaris:inventaris!peminjaman_inventaris_id_fkey(
          kode_barang,
          nama_barang,
          kategori
        )
      `,
      )
      .in("status", ["approved", "return_requested", "returned"]);

    if (error) throw error;

    const borrowingRows = ((data as BorrowingLikeRow[] | null) || []).filter(
      (row) => isWithinPeriod(getBorrowingReportDate(row), filter),
    );
    const borrowingIds = borrowingRows
      .map((row) => row.id)
      .filter((id): id is string => Boolean(id));
    const detailRows = await getBorrowingDetailItems(borrowingIds);

    const detailRowsByBorrowingId = detailRows.reduce((acc, item) => {
      const peminjamanId = item.peminjaman_id;
      if (!peminjamanId) return acc;
      const current = acc.get(peminjamanId) || [];
      current.push(item);
      acc.set(peminjamanId, current);
      return acc;
    }, new Map<string, DetailLikeRow[]>());

    const aggregated = borrowingRows.reduce(
      (acc: Record<string, TopBorrowedItem>, item) => {
        const detailItems =
          (item.id && detailRowsByBorrowingId.get(item.id)) || [];

        if (detailItems.length > 0) {
          for (const detail of detailItems) {
            const invId = detail.inventaris_id as string;
            if (!invId) continue;
            const inv = detail.inventaris as Record<string, unknown>;

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

            acc[invId].total_borrowed += detail.jumlah_pinjam || 0;
            acc[invId].times_borrowed += 1;
          }

          return acc;
        }

        const invId = item.inventaris_id as string;
        const inv = item.inventaris as Record<string, unknown>;

        if (!invId) return acc;

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

        acc[invId].total_borrowed += item.jumlah_pinjam || 0;
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
export async function getLabUtilization(
  filter?: ReportPeriodFilter,
): Promise<LabUtilization[]> {
  try {
    const { data, error } = await supabase
      .from("jadwal_praktikum" as never)
      .select(
        `
        laboratorium_id,
        jam_mulai,
        jam_selesai,
        tanggal_praktikum,
        status,
        laboratorium:laboratorium!jadwal_praktikum_laboratorium_id_fkey(
          kode_lab,
          nama_lab
        )
      `,
      )
      .in("status", [...ACTIVE_LAB_STATUSES] as never);

    if (error) throw error;

    const filteredRows = ((data as JadwalLikeRow[] | null) || []).filter(
      (item) => isWithinPeriod(getJadwalReportDate(item), filter),
    );

    const aggregated = filteredRows.reduce(
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
  filter?: ReportPeriodFilter,
): Promise<RecentActivity[]> {
  try {
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
        inventaris_id,
        jumlah_pinjam,
        inventaris:inventaris!peminjaman_inventaris_id_fkey(
          nama_barang
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(filter?.startDate || filter?.endDate ? limit * 5 : limit);

    if (error) throw error;

    const borrowingRows = ((data as BorrowingLikeRow[] | null) || []).filter(
      (item) =>
        ["pending", "approved", "rejected", "returned"].includes(
          item.status || "",
        ) && isWithinPeriod(getBorrowingReportDate(item), filter),
    );
    const borrowingIds = borrowingRows
      .map((row) => row.id)
      .filter((id): id is string => Boolean(id));
    const detailRows = await getBorrowingDetailItems(borrowingIds);

    const detailRowsByBorrowingId = detailRows.reduce((acc, item) => {
      const peminjamanId = item.peminjaman_id;
      if (!peminjamanId) return acc;
      const current = acc.get(peminjamanId) || [];
      current.push(item);
      acc.set(peminjamanId, current);
      return acc;
    }, new Map<string, DetailLikeRow[]>());

    const activities = await Promise.all(
      borrowingRows.map(async (item: BorrowingLikeRow) => {
        const inventaris = item.inventaris as Record<string, unknown>;
        const detailItems =
          (item.id && detailRowsByBorrowingId.get(item.id)) || [];
        const detailCount = detailItems.length;
        const itemLabel =
          detailCount > 1
            ? `${detailCount} alat`
            : detailCount === 1
              ? ((detailItems[0].inventaris as Record<string, unknown> | null)
                  ?.nama_barang as string) || "alat"
              : (inventaris?.nama_barang as string) || "alat";

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
        let description = `${userName} mengajukan peminjaman ${itemLabel}`;
        let timestamp = item.created_at as string;

        if (item.status === "returned" && item.tanggal_kembali_aktual) {
          type = "return";
          description = `${userName} mengembalikan ${itemLabel}`;
          timestamp = item.tanggal_kembali_aktual as string;
        } else if (item.status === "approved" && item.approved_at) {
          type = "approval";
          description = `Peminjaman ${itemLabel} oleh ${userName} disetujui`;
          timestamp = item.approved_at as string;
        } else if (item.status === "rejected" && item.approved_at) {
          type = "rejection";
          description = `Peminjaman ${itemLabel} oleh ${userName} ditolak`;
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

    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  } catch (error) {
    logger.error("Failed to fetch recent activities", { limit, error });
    throw handleSupabaseError(error);
  }
}
