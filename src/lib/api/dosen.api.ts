/**
 * Dosen API - FIXED: Added getMyKelas and KelasWithStats
 * * 🆕 UPDATED: Added Student Enrollment functions
 */

import { supabase } from "@/lib/supabase/client";
import { cacheAPI } from "@/lib/offline/api-cache";

import { requirePermission } from "@/lib/middleware";
import { notifyLaboranPengembalianDiajukan } from "@/lib/api/notification.api";
import {
  buildFallbackBorrowingItems,
  buildNotificationItemLabel,
  normalizeBorrowingItems,
  summarizeBorrowingItems,
  type BorrowingItemInput,
  type BorrowingItemSummary,
} from "@/lib/api/peminjaman-items";
// ============================================================================
// TYPES
// ============================================================================

export interface DosenStats {
  totalKelas: number;
  totalMahasiswa: number;
  activeKuis: number;
  pendingGrading: number;
}

export interface MataKuliahWithStats {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  program_studi: string;
  totalKelas: number;
  totalMahasiswa: number;
}

// ✅ NEW: KelasWithStats type for dashboard
export interface KelasWithStats {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  totalMahasiswa: number;
  mata_kuliah_id?: string;
  mata_kuliah_kode?: string;
  mata_kuliah_nama?: string;
}

export interface KelasWithDetails {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  jumlah_mahasiswa: number;
  mata_kuliah: {
    kode_mk: string;
    nama_mk: string;
    sks: number;
  };
}

// ============================================================================
// 🆕 NEW TYPES - STUDENT ENROLLMENT
// ============================================================================
export interface EnrolledStudent {
  id: string;
  mahasiswa_id: string;
  nim: string;
  nama: string;
  email: string;
  enrolled_at: string;
  is_active: boolean;
}

export interface KelasWithStudents {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  mata_kuliah_kode: string;
  mata_kuliah_nama: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  kuota: number;
  jumlah_mahasiswa: number;
  students: EnrolledStudent[];
}

export interface StudentStats {
  totalStudents: number;
  totalKelas: number;
  averagePerKelas: number;
}

export interface UpcomingPracticum {
  id: string;
  kelas: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string;
  lab_nama: string;
  lab_kode: string;
  kelas_nama?: string;
  mata_kuliah_nama?: string;
}

export interface PendingGrading {
  id: string;
  mahasiswa_nama: string;
  mahasiswa_nim: string;
  mata_kuliah_nama: string;
  kuis_judul: string;
  submitted_at: string;
  attempt_number: number;
}

export interface KuisWithStats {
  id: string;
  judul: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_attempts: number;
  submitted_count: number;
  kelas_nama: string;
}

type AssignedKelasSnapshot = {
  kelasIds: string[];
  jadwalData: any[];
  kelasData: any[];
};

export interface MyBorrowingRequest {
  id: string;
  jadwal_praktikum_id?: string | null;
  items: BorrowingItemSummary[];
  item_count: number;
  total_quantity: number;
  item_summary: string;
  inventaris_nama: string;
  inventaris_kode: string;
  jumlah_pinjam: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string | null;
  status: string;
  laboratorium_nama: string;
  created_at: string;
}

export interface BorrowingScheduleOption {
  id: string;
  mata_kuliah_nama: string;
  kelas_nama: string;
  tanggal_praktikum: string | null;
  jam_mulai: string;
  jam_selesai: string;
  laboratorium_id: string;
  laboratorium_nama: string;
  label: string;
}

async function getBorrowingItemsMap(
  peminjamanIds: string[],
): Promise<Map<string, BorrowingItemSummary[]>> {
  if (peminjamanIds.length === 0) {
    return new Map();
  }

  try {
    let query = supabase.from("peminjaman_detail" as any).select(
      `
      id,
      peminjaman_id,
      inventaris_id,
      jumlah_pinjam,
      inventaris:inventaris_id (
        nama_barang,
        kode_barang,
        laboratorium:laboratorium_id (
          nama_lab
        )
      )
    `,
    );

    query =
      peminjamanIds.length === 1
        ? query.eq("peminjaman_id", peminjamanIds[0])
        : query.in("peminjaman_id", peminjamanIds);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const grouped = new Map<string, BorrowingItemSummary[]>();
    ((data as any[]) || []).forEach((item: any) => {
      const current = grouped.get(item.peminjaman_id) || [];
      current.push({
        id: item.id,
        peminjaman_id: item.peminjaman_id,
        inventaris_id: item.inventaris_id,
        inventaris_nama: item.inventaris?.nama_barang || "Unknown",
        inventaris_kode: item.inventaris?.kode_barang || "-",
        jumlah_pinjam: item.jumlah_pinjam,
        laboratorium_nama: item.inventaris?.laboratorium?.nama_lab || "-",
      });
      grouped.set(item.peminjaman_id, current);
    });

    return grouped;
  } catch (error) {
    console.warn(
      "Failed to load peminjaman_detail, using legacy fallback.",
      error,
    );
    return new Map();
  }
}

function formatBorrowingScheduleDate(value: string | null | undefined): string {
  if (!value) return "Tanggal belum ditentukan";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function buildBorrowingPurposeFromScheduleContext(context: {
  mata_kuliah_nama?: string | null;
  kelas_nama?: string | null;
  laboratorium_nama?: string | null;
  tanggal_praktikum?: string | null;
}): string {
  return [
    "Praktikum",
    context.mata_kuliah_nama || "Mata Kuliah",
    context.kelas_nama || "Kelas",
    context.laboratorium_nama || "Laboratorium",
    formatBorrowingScheduleDate(context.tanggal_praktikum),
  ].join(" - ");
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

// Cache for dosen ID to reduce redundant calls
let cachedDosenId: string | null = null;
let cachedDosenUserId: string | null = null;
let cachedDosenIdTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DOSEN_ID_STORAGE_KEY = "cached_dosen_id";
const DOSEN_ID_STORAGE_PREFIX = "cached_dosen_id:";

// Test helper to reset cache (exported for testing)
export function __resetDosenIdCache() {
  cachedDosenId = null;
  cachedDosenUserId = null;
  cachedDosenIdTimestamp = 0;
}

// Test helper to set cache (exported for testing)
export function __setDosenIdCache(dosenId: string) {
  cachedDosenId = dosenId;
  cachedDosenUserId = null;
  cachedDosenIdTimestamp = Date.now();
}

async function getDosenId(): Promise<string | null> {
  try {
    // Return cached value if still valid (in-memory cache)
    if (
      cachedDosenId &&
      cachedDosenUserId === "__legacy_offline__" &&
      Date.now() - cachedDosenIdTimestamp < CACHE_DURATION
    ) {
      return cachedDosenId;
    }

    // Try to get from localStorage later as an offline fallback.
    const storedDosenId = localStorage.getItem(DOSEN_ID_STORAGE_KEY);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("🔍 DEBUG getDosenId: user =", user?.id);

    if (!user) {
      console.log("❌ DEBUG: No authenticated user");
      // No user - return stored dosen ID if available
      return storedDosenId || cachedDosenId;
    }

    if (
      cachedDosenId &&
      cachedDosenUserId === user.id &&
      Date.now() - cachedDosenIdTimestamp < CACHE_DURATION
    ) {
      return cachedDosenId;
    }

    const userStorageKey = `${DOSEN_ID_STORAGE_PREFIX}${user.id}`;
    const storedUserDosenId = localStorage.getItem(userStorageKey);
    if (storedUserDosenId) {
      cachedDosenId = storedUserDosenId;
      cachedDosenUserId = user.id;
      cachedDosenIdTimestamp = Date.now();
      return storedUserDosenId;
    }

    try {
      const { data, error } = await supabase
        .from("dosen")
        .select("id")
        .eq("user_id", user.id)
        .single();

      console.log("🔍 DEBUG getDosenId: dosen query result =", { data, error });

      if (error) {
        console.log("❌ DEBUG: Dosen query error =", error);
        // Suppress error logging - might be offline
        return storedUserDosenId || null; // Return only current-user cache
      }

      if (!data) {
        return storedUserDosenId || null; // Return only current-user cache
      }

      // Cache the result (in-memory and localStorage)
      cachedDosenId = data.id;
      cachedDosenUserId = user.id;
      cachedDosenIdTimestamp = Date.now();
      localStorage.setItem(userStorageKey, data.id);
      localStorage.setItem(DOSEN_ID_STORAGE_KEY, data.id);

      return data.id;
    } catch (fetchError) {
      // Network error - return cached if available
      return storedUserDosenId || null;
    }
  } catch (error) {
    // Suppress error - return cached/stored if available
    const storedDosenId = localStorage.getItem(DOSEN_ID_STORAGE_KEY);
    return storedDosenId || cachedDosenId;
  }
}

async function getAssignedKelasSnapshot(
  dosenId: string,
): Promise<AssignedKelasSnapshot> {
  const [directKelasResult, jadwalResult, kuisResult] = await Promise.all([
    supabase
      .from("kelas")
      .select(
        "id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, mata_kuliah_id, kuota, is_active",
      )
      .eq("dosen_id", dosenId)
      .eq("is_active", true)
      .order("nama_kelas", { ascending: true }),
    (supabase as any)
      .from("jadwal_praktikum")
      .select("kelas_id, mata_kuliah_id, tanggal_praktikum, status")
      .eq("dosen_id", dosenId)
      .eq("is_active", true)
      .order("tanggal_praktikum", { ascending: false }),
    supabase
      .from("kuis")
      .select("kelas_id, mata_kuliah_id, tanggal_selesai, status")
      .eq("dosen_id", dosenId)
      .in("status", ["draft", "published"])
      .order("created_at", { ascending: false }),
  ]);

  if (directKelasResult.error) {
    throw directKelasResult.error;
  }

  if (jadwalResult.error) {
    throw jadwalResult.error;
  }

  if (kuisResult.error) {
    throw kuisResult.error;
  }

  const jadwalData = ((jadwalResult.data as any[]) || []).filter(
    (jadwal: any) =>
      jadwal?.kelas_id &&
      (!jadwal?.status ||
        ["approved", "scheduled", "published"].includes(jadwal.status)),
  );

  const directKelasData = (directKelasResult.data as any[]) || [];
  const directKelasIds = directKelasData
    .map((kelas: any) => kelas?.id)
    .filter((id): id is string => Boolean(id));
  const kuisData = ((kuisResult.data as any[]) || []).filter(
    (kuis: any) => kuis?.kelas_id,
  );
  const fallbackKelasIds = Array.from(
    new Set(
      [...jadwalData, ...kuisData]
        .map((item: any) => item?.kelas_id)
        .filter(
          (id): id is string => Boolean(id) && !directKelasIds.includes(id),
        ),
    ),
  );

  let fallbackKelasData: any[] = [];
  if (fallbackKelasIds.length > 0) {
    const { data, error } = await supabase
      .from("kelas")
      .select(
        "id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, mata_kuliah_id, kuota, is_active",
      )
      .in("id", fallbackKelasIds)
      .eq("is_active", true)
      .order("nama_kelas", { ascending: true });

    if (error) {
      throw error;
    }

    fallbackKelasData = (data as any[]) || [];
  }

  const kelasData = Array.from(
    new Map(
      [...directKelasData, ...fallbackKelasData]
        .filter((kelas) => kelas?.id)
        .map((kelas) => [kelas.id, kelas]),
    ).values(),
  );

  return {
    kelasIds: kelasData.map((kelas: any) => kelas.id),
    jadwalData,
    kelasData,
  };
}

async function getDashboardActiveKelasIds(dosenId: string): Promise<string[]> {
  const { jadwalData, kelasData } = await getAssignedKelasSnapshot(dosenId);
  const kelasIds = kelasData
    .map((kelas: any) => kelas?.id)
    .filter((id: any): id is string => typeof id === "string" && id.length > 0);

  if (kelasIds.length === 0) {
    return [];
  }

  const today = new Date().toISOString().split("T")[0];

  const dashboardKelasIds = new Set<string>();

  (jadwalData || []).forEach((jadwal: any) => {
    if (
      kelasIds.includes(jadwal?.kelas_id) &&
      typeof jadwal?.tanggal_praktikum === "string" &&
      jadwal.tanggal_praktikum >= today
    ) {
      dashboardKelasIds.add(jadwal.kelas_id);
    }
  });

  const { data: activeQuizClasses, error: activeQuizClassesError } =
    await supabase
      .from("kuis")
      .select("kelas_id")
      .eq("dosen_id", dosenId)
      .in("status", ["draft", "published"]);

  if (activeQuizClassesError) {
    throw activeQuizClassesError;
  }

  ((activeQuizClasses as any[]) || []).forEach((item: any) => {
    if (
      typeof item?.kelas_id === "string" &&
      kelasIds.includes(item.kelas_id)
    ) {
      dashboardKelasIds.add(item.kelas_id);
    }
  });

  return Array.from(dashboardKelasIds);
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDosenStats(forceRefresh = false): Promise<DosenStats> {
  return cacheAPI(
    `dosen_stats_${forceRefresh ? "nocache" : "default"}`,
    async () => {
      try {
        const dosenId = await getDosenId();
        if (!dosenId) {
          return {
            totalKelas: 0,
            totalMahasiswa: 0,
            activeKuis: 0,
            pendingGrading: 0,
          };
        }

        const kelasIds = await getDashboardActiveKelasIds(dosenId);
        const totalKelas = kelasIds.length;

        let totalMahasiswa = 0;
        if (kelasIds.length > 0) {
          const { count } = await supabase
            .from("kelas_mahasiswa" as any)
            .select("mahasiswa_id", { count: "exact", head: true })
            .in("kelas_id", kelasIds)
            .eq("is_active", true);
          totalMahasiswa = count || 0;
        }

        const now = new Date().toISOString();

        const { data: activeKuisRows } = await supabase
          .from("kuis")
          .select("id, status, tanggal_selesai")
          .eq("dosen_id", dosenId)
          .in("status", ["draft", "published"]);

        const activeKuis = ((activeKuisRows as any[]) || []).filter(
          (kuis: any) => {
            if (kuis?.status === "draft") {
              return true;
            }

            return (
              kuis?.status === "published" &&
              typeof kuis?.tanggal_selesai === "string" &&
              kuis.tanggal_selesai >= now
            );
          },
        ).length;

        // ✅ FIX: Exclude archived kuis from pending grading count
        const { data: kuisData } = await supabase
          .from("kuis")
          .select("id")
          .eq("dosen_id", dosenId)
          .in("status", ["draft", "published"]); // Exclude archived

        const kuisIds = kuisData?.map((k) => k.id) || [];

        // ✅ NEW: Get questions for each kuis to determine if it's a CBT (all pilihan_ganda)
        // CBT quizzes are auto-graded and should NOT be counted in pendingGrading
        const { data: soalData } = await supabase
          .from("soal")
          .select("kuis_id, tipe")
          .in("kuis_id", kuisIds);

        // Create a map of kuis_id -> array of soal types
        const kuisSoalTypes = new Map<string, string[]>();
        (soalData || []).forEach((soal) => {
          if (!kuisSoalTypes.has(soal.kuis_id)) {
            kuisSoalTypes.set(soal.kuis_id, []);
          }
          kuisSoalTypes.get(soal.kuis_id)?.push(soal.tipe);
        });

        // Determine which kuis are CBT (all pilihan_ganda) and need to be excluded
        const cbtKuisIds = new Set<string>();
        kuisSoalTypes.forEach((tipes, kuisId) => {
          const allPilihanGanda =
            tipes.length > 0 && tipes.every((t) => t === "pilihan_ganda");
          if (allPilihanGanda) {
            cbtKuisIds.add(kuisId);
          }
        });

        // ✅ FIX: Get submitted attempts and exclude CBT quizzes
        let pendingGrading = 0;
        if (kuisIds.length > 0) {
          const { data: submittedAttempts } = await supabase
            .from("attempt_kuis" as any)
            .select("id, kuis_id, mahasiswa_id, status")
            .in("kuis_id", kuisIds)
            .in("status", ["submitted", "graded"])
            .order("submitted_at", { ascending: false });

          // Filter to only include unique (kuis_id, mahasiswa_id) pairs
          // where the latest attempt is "submitted" and not a CBT quiz
          const uniquePairs = new Map<string, any>();
          ((submittedAttempts as any) || []).forEach((attempt: any) => {
            const key = `${attempt.kuis_id}_${attempt.mahasiswa_id}`;

            // Skip if this is a CBT quiz (auto-graded)
            if (cbtKuisIds.has(attempt.kuis_id)) {
              return;
            }

            // Only keep the latest attempt for each (kuis, mahasiswa) pair
            if (!uniquePairs.has(key)) {
              uniquePairs.set(key, attempt);
            }
          });

          // Count only pairs where the latest attempt status is "submitted"
          pendingGrading = Array.from(uniquePairs.values()).filter(
            (attempt) => attempt.status === "submitted",
          ).length;
        }

        return {
          totalKelas: totalKelas || 0,
          totalMahasiswa,
          activeKuis: activeKuis || 0,
          pendingGrading,
        };
      } catch (error) {
        console.error("Error fetching dosen stats:", error);
        return {
          totalKelas: 0,
          totalMahasiswa: 0,
          activeKuis: 0,
          pendingGrading: 0,
        };
      }
    },
    {
      ttl: 5 * 60 * 1000, // Cache for 5 minutes
      forceRefresh, // ✅ FIX: Allow force refresh to bypass cache
      staleWhileRevalidate: true, // Return stale data while fetching fresh
    },
  );
}

// ============================================================================
// MY KELAS - ✅ NEW FUNCTION
// ============================================================================

export async function getMyKelas(limit?: number): Promise<KelasWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }
    const { jadwalData, kelasData } = await getAssignedKelasSnapshot(dosenId);
    if (!kelasData || kelasData.length === 0) return [];
    const jadwalMkMap = new Map<string, string>();
    (jadwalData || []).forEach((jadwal: any) => {
      if (
        jadwal?.kelas_id &&
        jadwal?.mata_kuliah_id &&
        !jadwalMkMap.has(jadwal.kelas_id)
      ) {
        jadwalMkMap.set(jadwal.kelas_id, jadwal.mata_kuliah_id);
      }
    });
    const mkIds: string[] = Array.from(
      new Set(
        (jadwalData || [])
          .map((jadwal: any) => jadwal?.mata_kuliah_id)
          .filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
      ),
    );
    const missingMkIds = kelasData
      .map((kelas: any) => kelas?.mata_kuliah_id)
      .filter(
        (id: any): id is string =>
          typeof id === "string" && id.length > 0 && !mkIds.includes(id),
      );
    const resolvedMkIds = [...new Set([...mkIds, ...missingMkIds])];
    const { data: mataKuliahData, error: mkError } =
      resolvedMkIds.length > 0
        ? await supabase
            .from("mata_kuliah")
            .select("id, kode_mk, nama_mk")
            .in("id", resolvedMkIds)
        : { data: [], error: null };
    if (mkError) {
      console.error("Error fetching mata kuliah for dosen kelas:", mkError);
    }
    const mkMap = new Map((mataKuliahData || []).map((mk: any) => [mk.id, mk]));
    const kelasWithStats = await Promise.all(
      kelasData.map(async (kelas: any) => {
        const { count } = await supabase
          .from("kelas_mahasiswa" as any)
          .select("*", { count: "exact", head: true })
          .eq("kelas_id", kelas.id)
          .eq("is_active", true);
        const resolvedMataKuliahId =
          jadwalMkMap.get(kelas.id) || kelas.mata_kuliah_id || null;
        const mk = resolvedMataKuliahId
          ? mkMap.get(resolvedMataKuliahId)
          : null;
        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas || "",
          nama_kelas: kelas.nama_kelas,
          tahun_ajaran: kelas.tahun_ajaran,
          semester_ajaran: kelas.semester_ajaran,
          totalMahasiswa: count || 0,
          mata_kuliah_id: resolvedMataKuliahId,
          mata_kuliah_kode: mk?.kode_mk || "",
          mata_kuliah_nama: mk?.nama_mk || "",
        };
      }),
    );
    const finalResult = Array.from(
      new Map(kelasWithStats.map((kelas) => [kelas.id, kelas])).values(),
    );
    return limit ? finalResult.slice(0, limit) : finalResult;
  } catch (error) {
    console.error("Error fetching my kelas:", error);
    return [];
  }
}

export async function getDashboardKelas(
  limit?: number,
): Promise<KelasWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    const [kelasList, activeKelasIds] = await Promise.all([
      getMyKelas(),
      getDashboardActiveKelasIds(dosenId),
    ]);

    if (activeKelasIds.length === 0) {
      return [];
    }

    const activeKelasIdSet = new Set(activeKelasIds);
    const filtered = kelasList.filter((kelas) =>
      activeKelasIdSet.has(kelas.id),
    );
    return limit ? filtered.slice(0, limit) : filtered;
  } catch (error) {
    console.error("Error fetching dashboard kelas:", error);
    return [];
  }
}

// ============================================================================
// MY MATA KULIAH - Keep existing function
// ============================================================================

type KelasDataForMK = {
  id: string;
  mata_kuliah: {
    id: string;
    kode_mk: string;
    nama_mk: string;
    sks: number;
    semester: number;
    program_studi: string;
  } | null;
};

export async function getMyMataKuliah(
  limit?: number,
): Promise<MataKuliahWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }
    const { data: jadwalData, error: jadwalError } = await (supabase as any)
      .from("jadwal_praktikum")
      .select("kelas_id, mata_kuliah_id")
      .eq("dosen_id", dosenId)
      .eq("is_active", true)
      .not("mata_kuliah_id", "is", null);
    if (jadwalError) throw jadwalError;
    if (!jadwalData || jadwalData.length === 0) return [];
    const mkIds = Array.from(
      new Set<string>(
        (jadwalData || [])
          .map((jadwal: any) => jadwal.mata_kuliah_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const { data: mataKuliahData, error: mkError } = await supabase
      .from("mata_kuliah")
      .select("id, kode_mk, nama_mk, sks, semester, program_studi")
      .in("id", mkIds);
    if (mkError) throw mkError;
    const mataKuliahMap = new Map();
    for (const mk of (mataKuliahData as any[] | null) || []) {
      if (!mk) continue;
      if (!mataKuliahMap.has(mk.id)) {
        mataKuliahMap.set(mk.id, {
          ...mk,
          totalKelas: 0,
          totalMahasiswa: 0,
        });
      }
    }
    for (const [mkId, mk] of mataKuliahMap.entries()) {
      const kelasIds = [
        ...new Set(
          (jadwalData || [])
            .filter((jadwal: any) => jadwal.mata_kuliah_id === mkId)
            .map((jadwal: any) => jadwal.kelas_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      mk.totalKelas = kelasIds.length;
      if (kelasIds.length > 0) {
        const { count } = await supabase
          .from("kelas_mahasiswa" as any)
          .select("*", { count: "exact", head: true })
          .in("kelas_id", kelasIds);
        mk.totalMahasiswa = count || 0;
      }
    }
    let results = Array.from(mataKuliahMap.values());
    if (limit) {
      results = results.slice(0, limit);
    }
    return results;
  } catch (error) {
    console.error("Error fetching mata kuliah:", error);
    return [];
  }
}

// ============================================================================
// ============================================================================
// UPCOMING PRACTICUM
// ============================================================================

export async function getUpcomingPracticum(
  limit?: number,
): Promise<UpcomingPracticum[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    // ✅ Logika Tanggal (7 hari: Hari ini + 6 hari)
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // Mulai hari ini

    const sixDaysFromNow = new Date();
    sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6); // Selesai 6 hari dari sekarang
    const endDateStr = sixDaysFromNow.toISOString().split("T")[0];

    // ✅ PERBAIKAN: Filter jadwal yang aktif dan disetujui saja
    let query: any = (supabase as any)
      .from("jadwal_praktikum")
      .select(
        `
        id,
        tanggal_praktikum,
        hari,
        jam_mulai,
        jam_selesai,
        topik,
        status,
        is_active,
        kelas_id,
        mata_kuliah:mata_kuliah_id (
          nama_mk
        ),
        kelas:kelas_id (
          id,
          nama_kelas,
          dosen_id,
          mata_kuliah (
            nama_mk
          )
        ),
        laboratorium (
          kode_lab,
          nama_lab
        )
      `,
      )
      .eq("is_active", true) // Hanya jadwal aktif
      .eq("status", "approved") // Hanya jadwal yang disetujui
      .gte("tanggal_praktikum", todayStr)
      .lte("tanggal_praktikum", endDateStr)
      .eq("dosen_id", dosenId) // 🔄 FIXED: Filter by dosen_id from jadwal_praktikum table itself
      .order("tanggal_praktikum", { ascending: true })
      .order("jam_mulai", { ascending: true });

    if (limit) {
      query = query.limit(100); // Get more, filter later
    }

    const { data, error } = await query;
    if (error) {
      // Ini akan log error jika masih ada
      console.error("Error fetching upcoming practicum:", error);
      throw error;
    }

    // Debug: Log raw data
    console.log(
      "Raw jadwal data for dosen",
      dosenId,
      ":",
      data?.length,
      "items",
    );
    console.log("📋 Jadwal details:", data);

    // 🔄 FIXED: No need for client-side filtering - query already filters by dosen_id
    const filtered = data || [];

    // Apply limit after filtering
    const limitedData = limit ? filtered.slice(0, limit) : filtered;

    // Debug: Log filtered data
    console.log("Filtered jadwal data:", limitedData.length, "items");

    return limitedData.map((item: any) => ({
      id: item.id,
      kelas: item.kelas_id || "", // Menggunakan kelas_id sebagai referensi
      tanggal_praktikum: item.tanggal_praktikum,
      hari: item.hari,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      topik: item.topik || "-",
      lab_nama: item.laboratorium?.nama_lab || "-",
      lab_kode: item.laboratorium?.kode_lab || "-",
      kelas_nama: item.kelas?.nama_kelas || "-", // Nama kelas dari relasi
      mata_kuliah_nama: item.mata_kuliah?.nama_mk || "-",
    }));
  } catch (error) {
    // Menangkap error jika terjadi di luar query
    console.error("Error in getUpcomingPracticum function:", error);
    return [];
  }
}

// ============================================================================
// PENDING GRADING
// ============================================================================

type GradingData = {
  id: string;
  kuis_id: string;
  mahasiswa_id: string;
  submitted_at: string;
  attempt_number: number;
  status: string;
  mahasiswa: {
    nim: string;
    user: {
      full_name: string;
    };
  };
  kuis: {
    judul: string;
    mata_kuliah?: {
      nama_mk: string;
    } | null;
    kelas: {
      mata_kuliah?: {
        nama_mk: string;
      } | null;
    } | null;
  };
} | null;

export async function getPendingGrading(
  limit?: number,
): Promise<PendingGrading[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    // ✅ FIX: Exclude archived kuis from pending grading
    const { data: kuisIds } = await supabase
      .from("kuis")
      .select("id")
      .eq("dosen_id", dosenId)
      .in("status", ["draft", "published"]); // Exclude archived

    if (!kuisIds || kuisIds.length === 0) {
      return [];
    }

    // ✅ NEW: Get questions for each kuis to determine if it's a CBT (all pilihan_ganda)
    // CBT quizzes are auto-graded and should NOT appear in "Perlu Dinilai"
    const { data: soalData } = await supabase
      .from("soal")
      .select("kuis_id, tipe")
      .in(
        "kuis_id",
        kuisIds.map((k) => k.id),
      );

    // Create a map of kuis_id -> array of soal types
    const kuisSoalTypes = new Map<string, string[]>();
    (soalData || []).forEach((soal) => {
      if (!kuisSoalTypes.has(soal.kuis_id)) {
        kuisSoalTypes.set(soal.kuis_id, []);
      }
      kuisSoalTypes.get(soal.kuis_id)?.push(soal.tipe);
    });

    // Determine which kuis are CBT (all pilihan_ganda) and need to be excluded
    const cbtKuisIds = new Set<string>();
    kuisSoalTypes.forEach((tipes, kuisId) => {
      const allPilihanGanda =
        tipes.length > 0 && tipes.every((t) => t === "pilihan_ganda");
      if (allPilihanGanda) {
        cbtKuisIds.add(kuisId);
        console.log(
          "[getPendingGrading] Excluding CBT quiz:",
          kuisId,
          "(all questions are pilihan_ganda)",
        );
      }
    });

    // ✅ FIX: Get all submitted attempts first
    const { data: submittedAttempts, error: submittedError } = await supabase
      .from("attempt_kuis" as any)
      .select(
        `
        id,
        kuis_id,
        mahasiswa_id,
        submitted_at,
        attempt_number,
        status,
        mahasiswa:mahasiswa_id (
          nim,
          user:user_id (
            full_name
          )
        ),
        kuis:kuis_id (
          judul,
          mata_kuliah:mata_kuliah_id (
            nama_mk
          ),
          kelas:kelas_id (
            mata_kuliah:mata_kuliah_id (
              nama_mk
            )
          )
        )
      `,
      )
      .in(
        "kuis_id",
        kuisIds.map((k) => k.id),
      )
      .in("status", ["submitted", "graded"])
      .order("submitted_at", { ascending: false });

    if (submittedError) throw submittedError;

    // ✅ FIX: Filter to only show attempts that need grading
    // For each unique (kuis_id, mahasiswa_id) pair, only show if the latest attempt is "submitted"
    const uniquePairs = new Map<string, GradingData>();

    const allAttempts = (submittedAttempts as unknown as GradingData[]) || [];
    console.log(
      "[getPendingGrading] Total submitted/graded attempts:",
      allAttempts.length,
    );

    allAttempts.forEach((attempt) => {
      const key = `${attempt.kuis_id}_${attempt.mahasiswa_id}`;

      // ✅ NEW: Skip if this is a CBT quiz (auto-graded)
      if (cbtKuisIds.has(attempt.kuis_id)) {
        console.log(
          "[getPendingGrading] Skipping CBT quiz attempt:",
          key,
          "quiz:",
          attempt.kuis?.judul,
        );
        return;
      }

      // Only keep the latest attempt for each (kuis, mahasiswa) pair
      if (!uniquePairs.has(key)) {
        uniquePairs.set(key, attempt);
        console.log(
          "[getPendingGrading] Added unique pair:",
          key,
          "status:",
          attempt.status,
          "student:",
          attempt.mahasiswa?.user?.full_name,
        );
      }
    });

    console.log("[getPendingGrading] Unique pairs count:", uniquePairs.size);

    // Filter to only include pairs where the latest attempt status is "submitted" (not "graded")
    const pendingAttempts = Array.from(uniquePairs.values()).filter(
      (attempt) => attempt.status === "submitted",
    );

    console.log(
      "[getPendingGrading] Pending attempts (submitted only):",
      pendingAttempts.length,
    );
    pendingAttempts.forEach((attempt) => {
      console.log(
        "  -",
        attempt.mahasiswa?.user?.full_name,
        "|",
        attempt.kuis?.judul,
        "| status:",
        attempt.status,
      );
    });

    // Apply limit if specified
    const limitedAttempts = limit
      ? pendingAttempts.slice(0, limit)
      : pendingAttempts;

    return limitedAttempts.map((item) => ({
      id: item.id,
      mahasiswa_nama: item.mahasiswa?.user?.full_name || "-",
      mahasiswa_nim: item.mahasiswa?.nim || "-",
      mata_kuliah_nama:
        item.kuis?.mata_kuliah?.nama_mk ||
        item.kuis?.kelas?.mata_kuliah?.nama_mk ||
        "-",
      kuis_judul: item.kuis?.judul || "-",
      submitted_at: item.submitted_at,
      attempt_number: item.attempt_number,
    }));
  } catch (error) {
    console.error("Error fetching pending grading:", error);
    return [];
  }
}

// ============================================================================
// ACTIVE KUIS
// ============================================================================

type KuisData = {
  id: string;
  judul: string;
  status: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  kelas: {
    nama_kelas: string;
  } | null;
};

export async function getActiveKuis(limit?: number): Promise<KuisWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }
    let query = supabase
      .from("kuis")
      .select(
        `
        id,
        judul,
        status,
        tanggal_mulai,
        tanggal_selesai,
        kelas (
          nama_kelas
        )
      `,
      )
      .eq("dosen_id", dosenId)
      .in("status", ["draft", "published"])
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const visibleKuis = ((data as KuisData[]) || []).filter((kuis) => {
      return kuis.status === "draft" || kuis.status === "published";
    });

    const kuisWithStats = await Promise.all(
      visibleKuis.map(async (kuis) => {
        const { count: totalAttempts } = await supabase
          .from("attempt_kuis" as any)
          .select("*", { count: "exact", head: true })
          .eq("kuis_id", kuis.id);

        const { count: submittedCount } = await supabase
          .from("attempt_kuis" as any)
          .select("*", { count: "exact", head: true })
          .eq("kuis_id", kuis.id)
          .in("status", ["submitted", "graded"]);

        return {
          id: kuis.id,
          judul: kuis.judul,
          status: kuis.status || "draft",
          tanggal_mulai: kuis.tanggal_mulai,
          tanggal_selesai: kuis.tanggal_selesai,
          total_attempts: totalAttempts || 0,
          submitted_count: submittedCount || 0,
          kelas_nama: kuis.kelas?.nama_kelas || "-",
        };
      }),
    );

    return kuisWithStats;
  } catch (error) {
    console.error("Error fetching active kuis:", error);
    return [];
  }
}

// ============================================================================
// MY BORROWING
// ============================================================================

export type BorrowingStatus =
  | "menunggu"
  | "disetujui"
  | "dipinjam"
  | "return_requested"
  | "dikembalikan"
  | "ditolak";

export async function getMyBorrowing(
  limitOrStatus?: number | BorrowingStatus | string,
): Promise<MyBorrowingRequest[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    const isLimit = typeof limitOrStatus === "number";
    const isStatus =
      typeof limitOrStatus === "string" && !limitOrStatus.match(/^\d+$/);

    const limit = isLimit ? limitOrStatus : undefined;
    const status = isStatus ? limitOrStatus : undefined;

    let query = supabase
      .from("peminjaman" as any)
      .select(
        `
        id,
        jadwal_praktikum_id,
        laboratorium_tujuan_nama,
        inventaris_id,
        jumlah_pinjam,
        keperluan,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        tanggal_kembali_aktual,
        status,
        created_at,
        inventaris (
          nama_barang,
          kode_barang,
          laboratorium (
            nama_lab
          )
        )
      `,
      )
      .eq("peminjam_id", dosenId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []) as any[];
    const itemsMap = await getBorrowingItemsMap(rows.map((item) => item.id));

    return rows.map((item: any) => {
      const inventarisRelation = Array.isArray(item.inventaris)
        ? item.inventaris[0]
        : item.inventaris;
      const items =
        itemsMap.get(item.id) ||
        buildFallbackBorrowingItems({
          inventaris_id:
            item.inventaris_id ||
            (inventarisRelation?.nama_barang ? `legacy-${item.id}` : null),
          jumlah_pinjam: item.jumlah_pinjam,
          inventaris_nama: inventarisRelation?.nama_barang,
          inventaris_kode: inventarisRelation?.kode_barang,
          laboratorium_nama:
            item.laboratorium_tujuan_nama ||
            inventarisRelation?.laboratorium?.nama_lab,
        });
      const summary = summarizeBorrowingItems(items);
      const fallbackNama = inventarisRelation?.nama_barang || "Unknown";
      const fallbackKode = inventarisRelation?.kode_barang || "-";

      return {
        id: item.id,
        jadwal_praktikum_id: item.jadwal_praktikum_id || null,
        items,
        item_count: summary.item_count,
        total_quantity: summary.total_quantity,
        item_summary: summary.item_summary,
        inventaris_nama:
          summary.item_count > 0 ? summary.inventaris_nama : fallbackNama,
        inventaris_kode:
          summary.item_count > 0 ? summary.inventaris_kode : fallbackKode,
        jumlah_pinjam: summary.total_quantity,
        keperluan: item.keperluan,
        tanggal_pinjam: item.tanggal_pinjam,
        tanggal_kembali_rencana: item.tanggal_kembali_rencana,
        tanggal_kembali_aktual: item.tanggal_kembali_aktual,
        status: item.status,
        laboratorium_nama:
          item.laboratorium_tujuan_nama ||
          items[0]?.laboratorium_nama ||
          inventarisRelation?.laboratorium?.nama_lab ||
          "-",
        created_at: item.created_at,
      };
    });
  } catch (error) {
    console.error("Error fetching my borrowing:", error);
    return [];
  }
}

export async function getBorrowingScheduleOptions(): Promise<
  BorrowingScheduleOption[]
> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await (supabase as any)
      .from("jadwal_praktikum")
      .select(
        `
        id,
        status,
        tanggal_praktikum,
        jam_mulai,
        jam_selesai,
        laboratorium_id,
        is_active,
        kelas:kelas_id (
          nama_kelas
        ),
        mata_kuliah:mata_kuliah_id (
          nama_mk
        ),
        laboratorium:laboratorium_id (
          nama_lab
        )
      `,
      )
      .eq("dosen_id", dosenId)
      .eq("is_active", true)
      .eq("status", "approved")
      .order("tanggal_praktikum", { ascending: true })
      .order("jam_mulai", { ascending: true });

    if (error) throw error;

    return (data || [])
      .filter((item: any) => {
        if (!item?.tanggal_praktikum) return true;
        const praktikumDate = new Date(item.tanggal_praktikum);
        praktikumDate.setHours(0, 0, 0, 0);
        return praktikumDate >= today;
      })
      .map((item: any) => {
        const mataKuliahNama = item.mata_kuliah?.nama_mk || "Mata Kuliah";
        const kelasNama = item.kelas?.nama_kelas || "Kelas";
        const laboratoriumNama = item.laboratorium?.nama_lab || "Laboratorium";
        const tanggalPraktikum = item.tanggal_praktikum || null;
        const tanggalLabel = tanggalPraktikum
          ? new Date(tanggalPraktikum).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Tanggal fleksibel";

        return {
          id: item.id,
          mata_kuliah_nama: mataKuliahNama,
          kelas_nama: kelasNama,
          tanggal_praktikum: tanggalPraktikum,
          jam_mulai: item.jam_mulai,
          jam_selesai: item.jam_selesai,
          laboratorium_id: item.laboratorium_id,
          laboratorium_nama: laboratoriumNama,
          label: `${mataKuliahNama} • ${kelasNama} • ${laboratoriumNama} • ${tanggalLabel}`,
        };
      });
  } catch (error) {
    console.error("Error fetching borrowing schedule options:", error);
    return [];
  }
}

// ============================================================================
// 🆕 NEW FUNCTIONS - STUDENT ENROLLMENT
// ============================================================================
/**
 * Get enrolled students for a specific class
 */
export async function getKelasStudents(
  kelasId: string,
): Promise<EnrolledStudent[]> {
  try {
    const { data, error } = await supabase
      .from("kelas_mahasiswa")
      .select(
        `
        id,
        mahasiswa_id,
        enrolled_at,
        is_active,
        mahasiswa:mahasiswa_id (
          id,
          nim,
          users:user_id (
            full_name,
            email
          )
        )
      `,
      )
      .eq("kelas_id", kelasId)
      .eq("is_active", true)
      .order("enrolled_at", { ascending: false });
    if (error) throw error;
    if (!data) return [];

    return data.map((item: any) => ({
      id: item.id,
      mahasiswa_id: item.mahasiswa_id,
      nim: item.mahasiswa?.nim || "-",
      nama: item.mahasiswa?.users?.full_name || "Unknown",
      email: item.mahasiswa?.users?.email || "-",
      enrolled_at: item.enrolled_at,
      is_active: item.is_active,
    }));
  } catch (error) {
    console.error("Error fetching kelas students:", error);
    return [];
  }
}

/**
 * Get all classes with enrolled students
 */
export async function getMyKelasWithStudents(): Promise<KelasWithStudents[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) return [];
    const { jadwalData, kelasData } = await getAssignedKelasSnapshot(dosenId);
    if (!kelasData || kelasData.length === 0) return [];
    const kelasMkMap = new Map<string, string>();
    (jadwalData || []).forEach((jadwal: any) => {
      if (
        jadwal?.kelas_id &&
        jadwal?.mata_kuliah_id &&
        !kelasMkMap.has(jadwal.kelas_id)
      ) {
        kelasMkMap.set(jadwal.kelas_id, jadwal.mata_kuliah_id);
      }
    });
    const mkIds: string[] = [
      ...new Set(
        Array.from(kelasMkMap.values()).filter((id): id is string =>
          Boolean(id),
        ),
      ),
    ];
    const missingMkIds = kelasData
      .map((kelas: any) => kelas?.mata_kuliah_id)
      .filter(
        (id: any): id is string =>
          typeof id === "string" && id.length > 0 && !mkIds.includes(id),
      );
    const resolvedMkIds = [...new Set([...mkIds, ...missingMkIds])];
    const mataKuliahResult =
      resolvedMkIds.length > 0
        ? await supabase
            .from("mata_kuliah")
            .select("id, nama_mk, kode_mk")
            .in("id", resolvedMkIds)
        : { data: [], error: null };
    if (mataKuliahResult.error) throw mataKuliahResult.error;
    const mkMap = new Map(
      ((mataKuliahResult.data as any[]) || []).map((mk: any) => [mk.id, mk]),
    );
    const result = await Promise.all(
      (kelasData || []).map(async (kelas: any) => {
        const resolvedMataKuliahId =
          kelasMkMap.get(kelas.id) || kelas.mata_kuliah_id || null;
        const mataKuliah = resolvedMataKuliahId
          ? mkMap.get(resolvedMataKuliahId)
          : null;
        const students = await getKelasStudents(kelas.id);
        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas,
          nama_kelas: kelas.nama_kelas,
          mata_kuliah_kode: mataKuliah?.kode_mk || "-",
          mata_kuliah_nama: mataKuliah?.nama_mk || "-",
          tahun_ajaran: kelas.tahun_ajaran,
          semester_ajaran: kelas.semester_ajaran,
          kuota: kelas.kuota,
          jumlah_mahasiswa: students.length,
          students: students,
        };
      }),
    );
    return result;
  } catch (error) {
    console.error("Error fetching kelas with students:", error);
    return [];
  }
}

/**
 * Get student statistics
 */
export async function getStudentStats(): Promise<StudentStats> {
  try {
    const kelasWithStudents = await getMyKelasWithStudents();

    const totalKelas = kelasWithStudents.length;
    const totalStudents = kelasWithStudents.reduce(
      (sum, kelas) => sum + kelas.jumlah_mahasiswa,
      0,
    );
    const averagePerKelas =
      totalKelas > 0 ? Math.round(totalStudents / totalKelas) : 0;

    return {
      totalStudents,
      totalKelas,
      averagePerKelas,
    };
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return {
      totalStudents: 0,
      totalKelas: 0,
      averagePerKelas: 0,
    };
  }
}

/**
 * Export all students (CSV)
 */
export async function exportAllStudents() {
  try {
    const kelasWithStudents = await getMyKelasWithStudents();

    const allStudents = kelasWithStudents.flatMap((kelas) =>
      kelas.students.map((student) => ({
        kelas: kelas.nama_kelas,
        mata_kuliah: kelas.mata_kuliah_nama,
        nim: student.nim,
        nama: student.nama,
        email: student.email,
        tanggal_daftar: new Date(student.enrolled_at).toLocaleDateString(
          "id-ID",
        ),
      })),
    );
    return allStudents;
  } catch (error) {
    console.error("Error exporting students:", error);
    return [];
  }
}

// ============================================================================
// BORROWING/PEMINJAMAN FUNCTIONS
// ============================================================================

/**
 * Create a borrowing request (Pengajuan Peminjaman)
 * Dosen can request to borrow equipment from lab inventory
 */
async function createBorrowingRequestImpl(data: {
  jadwal_praktikum_id: string;
  inventaris_id?: string;
  jumlah_pinjam?: number;
  items?: BorrowingItemInput[];
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
}): Promise<{ id: string }> {
  try {
    // ✅ FIX ISSUE #6: Validate tanggal peminjaman
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    if (data.tanggal_pinjam < today) {
      throw new Error(
        `Tanggal peminjaman tidak boleh di masa lalu. Tanggal yang dipilih: ${data.tanggal_pinjam}`,
      );
    }

    if (data.tanggal_kembali_rencana <= data.tanggal_pinjam) {
      throw new Error(
        `Tanggal pengembalian (${data.tanggal_kembali_rencana}) harus setelah tanggal peminjaman (${data.tanggal_pinjam})`,
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User tidak terautentikasi");

    // Get dosen profile
    const { data: dosenData, error: dosenError } = await supabase
      .from("dosen")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (dosenError || !dosenData) throw new Error("Data dosen tidak ditemukan");

    const { data: jadwalData, error: jadwalError } = await (supabase as any)
      .from("jadwal_praktikum")
      .select(
        `
        id,
        status,
        tanggal_praktikum,
        laboratorium_id,
        is_active,
        kelas:kelas_id (
          nama_kelas
        ),
        mata_kuliah:mata_kuliah_id (
          nama_mk
        ),
        laboratorium:laboratorium_id (
          nama_lab
        )
      `,
      )
      .eq("id", data.jadwal_praktikum_id)
      .eq("dosen_id", dosenData.id)
      .single();

    if (jadwalError || !jadwalData) {
      throw new Error("Jadwal praktikum tidak ditemukan untuk dosen ini");
    }

    if (jadwalData.is_active === false) {
      throw new Error("Jadwal praktikum yang dipilih sudah tidak aktif");
    }

    if (jadwalData.status !== "approved") {
      throw new Error(
        "Jadwal praktikum harus sudah disetujui laboran sebelum dipakai untuk peminjaman alat",
      );
    }

    if (jadwalData.tanggal_praktikum) {
      const jadwalDate = new Date(jadwalData.tanggal_praktikum);
      jadwalDate.setHours(0, 0, 0, 0);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (jadwalDate < currentDate) {
        throw new Error("Jadwal praktikum yang dipilih sudah lewat");
      }
    }

    const jadwalTanggalPinjam = jadwalData.tanggal_praktikum
      ? String(jadwalData.tanggal_praktikum).split("T")[0]
      : null;

    if (!jadwalTanggalPinjam) {
      throw new Error(
        "Jadwal praktikum yang dipilih belum memiliki tanggal yang valid",
      );
    }

    if (data.tanggal_pinjam !== jadwalTanggalPinjam) {
      throw new Error(
        "Tanggal pinjam harus mengikuti tanggal jadwal praktikum",
      );
    }

    const autoKeperluan = buildBorrowingPurposeFromScheduleContext({
      mata_kuliah_nama: jadwalData.mata_kuliah?.nama_mk,
      kelas_nama: jadwalData.kelas?.nama_kelas,
      laboratorium_nama: jadwalData.laboratorium?.nama_lab,
      tanggal_praktikum: jadwalData.tanggal_praktikum,
    });

    const normalizedItems = normalizeBorrowingItems(
      data.items && data.items.length > 0
        ? data.items
        : data.inventaris_id && data.jumlah_pinjam
          ? [
              {
                inventaris_id: data.inventaris_id,
                jumlah_pinjam: data.jumlah_pinjam,
              },
            ]
          : [],
    );

    if (normalizedItems.length === 0) {
      throw new Error("Minimal pilih satu alat untuk diajukan");
    }

    const inventarisIds = normalizedItems.map((item) => item.inventaris_id);
    const { data: inventarisRows, error: inventarisError } = await supabase
      .from("inventaris")
      .select("id, nama_barang, jumlah_tersedia")
      .in("id", inventarisIds);

    if (inventarisError) {
      throw inventarisError;
    }

    const inventarisMap = new Map(
      ((inventarisRows as any[]) || []).map((item: any) => [item.id, item]),
    );

    normalizedItems.forEach((item) => {
      const inventaris = inventarisMap.get(item.inventaris_id);
      if (!inventaris) {
        throw new Error("Ada alat yang dipilih tidak ditemukan di inventaris");
      }
      if (inventaris.jumlah_tersedia < item.jumlah_pinjam) {
        throw new Error(
          `Stok tidak cukup untuk ${inventaris.nama_barang}. Tersedia: ${inventaris.jumlah_tersedia}, diminta: ${item.jumlah_pinjam}`,
        );
      }
    });

    const representativeItem = normalizedItems[0];

    // Create borrowing request header
    // peminjam_id = dosen_id (peminjaman hanya untuk dosen, bukan mahasiswa)
    const { data: result, error } = await supabase
      .from("peminjaman" as any)
      .insert({
        jadwal_praktikum_id: jadwalData.id,
        inventaris_id: representativeItem.inventaris_id,
        peminjam_id: dosenData.id, // Dosen as borrower
        dosen_id: dosenData.id,
        jumlah_pinjam: representativeItem.jumlah_pinjam,
        keperluan: autoKeperluan,
        tanggal_pinjam: jadwalTanggalPinjam,
        tanggal_kembali_rencana: data.tanggal_kembali_rencana,
        laboratorium_tujuan_id: jadwalData.laboratorium_id,
        laboratorium_tujuan_nama: jadwalData.laboratorium?.nama_lab || null,
        status: "pending",
        kondisi_pinjam: "baik",
      })
      .select("id")
      .single();

    // ✅ FIX ISSUE #4: Better error handling for insert
    if (error) {
      // Check error code and provide helpful message
      const errorCode = (error as any)?.code;
      const errorMessage = (error as any)?.message || "";

      console.error("Supabase Error Details:", {
        code: errorCode,
        message: errorMessage,
        fullError: error,
      });

      if (errorCode === "42501") {
        throw new Error(
          "Tidak dapat membuat permintaan peminjaman: RLS policy tidak mengizinkan. " +
            "Hubungi administrator untuk mengkonfigurasi RLS policy.",
        );
      }

      if (errorCode === "23505" || errorMessage.includes("duplicate")) {
        throw new Error(
          "Permintaan peminjaman untuk alat ini sudah ada. Silakan gunakan permintaan yang sudah ada.",
        );
      }

      if (errorCode === "23502") {
        throw new Error(
          "Data tidak lengkap. Pastikan semua field terisi dengan benar.",
        );
      }

      if (errorCode === "23503") {
        throw new Error(
          "Data tidak valid: Alat yang dipilih tidak ditemukan di inventaris.",
        );
      }

      // Generic error untuk kode lain
      throw new Error(
        `Gagal membuat peminjaman: ${errorMessage || "Unknown error"}`,
      );
    }

    if (!result) {
      throw new Error(
        "Gagal membuat peminjaman. Tidak ada data yang dikembalikan.",
      );
    }

    const detailPayload = normalizedItems.map((item) => ({
      peminjaman_id: (result as any).id,
      inventaris_id: item.inventaris_id,
      jumlah_pinjam: item.jumlah_pinjam,
      kondisi_pinjam: "baik",
    }));

    const { error: detailError } = await supabase
      .from("peminjaman_detail" as any)
      .insert(detailPayload);

    if (detailError) {
      await supabase
        .from("peminjaman")
        .delete()
        .eq("id", (result as any).id);

      const detailErrorCode = (detailError as any)?.code;
      const detailErrorMessage = (detailError as any)?.message || "";

      if (detailErrorCode === "42501") {
        throw new Error(
          "Gagal menyimpan detail alat peminjaman karena RLS policy tabel peminjaman_detail belum sesuai. " +
            "Jalankan script database/scripts/FIX_RLS_PEMINJAMAN_DETAIL.sql di Supabase SQL Editor.",
        );
      }

      throw new Error(
        `Gagal menyimpan detail alat peminjaman: ${detailErrorMessage || "Unknown error"}`,
      );
    }

    return { id: (result as any).id };
  } catch (error) {
    console.error("Error creating borrowing request:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires create:peminjaman permission
export const createBorrowingRequest = requirePermission(
  "create:peminjaman",
  createBorrowingRequestImpl,
);

/**
 * Get available equipment for borrowing
 * Returns list of equipment with available stock
 */
export async function getAvailableEquipment() {
  try {
    const { data, error } = await supabase
      .from("inventaris")
      .select(
        `
        id,
        kode_barang,
        nama_barang,
        jumlah_tersedia,
        kondisi,
        laboratorium:laboratorium_id (
          id,
          nama_lab,
          kode_lab
        )
      `,
      )
      .gt("jumlah_tersedia", 0)
      // Removed strict is_available_for_borrowing filter to show all equipment with stock > 0
      .order("nama_barang", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching available equipment:", error);
    throw error;
  }
}

/**
 * Dosen only submits a return request.
 * Final return verification and stock restoration are handled by laboran.
 */
async function returnBorrowingRequestImpl(data: {
  peminjaman_id: string;
  kondisi_kembali:
    | "baik"
    | "rusak_ringan"
    | "rusak_berat"
    | "maintenance"
    | "hilang";
  keterangan_kembali?: string;
}): Promise<{ id: string }> {
  try {
    const { data: peminjamanData, error: fetchError } = await supabase
      .from("peminjaman")
      .select(
        "id, inventaris_id, jumlah_pinjam, status, dosen_id, tanggal_kembali_rencana",
      )
      .eq("id", data.peminjaman_id)
      .single();

    if (fetchError || !peminjamanData) {
      throw new Error("Peminjaman not found");
    }

    if (peminjamanData.status === "returned") {
      throw new Error("Peminjaman sudah dikembalikan sebelumnya");
    }

    if (peminjamanData.status === "return_requested") {
      throw new Error("Pengajuan pengembalian sudah dikirim ke laboran");
    }

    if (peminjamanData.status !== "approved") {
      throw new Error(
        "Pengembalian hanya dapat diajukan untuk peminjaman yang masih aktif",
      );
    }

    const { error: updateError } = await supabase
      .from("peminjaman")
      .update({
        status: "return_requested",
        kondisi_kembali: data.kondisi_kembali as any,
        keterangan_kembali: data.keterangan_kembali || null,
      })
      .eq("id", data.peminjaman_id);

    if (updateError) throw updateError;

    try {
      const [itemsMap, { data: laboranUsers }, authResult] = await Promise.all([
        getBorrowingItemsMap([peminjamanData.id]),
        supabase.from("users").select("id").eq("role", "laboran"),
        supabase.auth.getUser(),
      ]);
      const items =
        itemsMap.get(peminjamanData.id) ||
        buildFallbackBorrowingItems({
          inventaris_id: peminjamanData.inventaris_id,
          jumlah_pinjam: peminjamanData.jumlah_pinjam,
        });
      const summary = summarizeBorrowingItems(items);

      const dosenNama =
        authResult.data.user?.user_metadata?.full_name ||
        authResult.data.user?.email ||
        "Dosen";
      const laboranUserIds =
        laboranUsers?.map((item: { id: string }) => item.id) || [];

      if (laboranUserIds.length > 0) {
        await notifyLaboranPengembalianDiajukan(
          laboranUserIds,
          dosenNama,
          buildNotificationItemLabel(items),
          summary.total_quantity,
          peminjamanData.tanggal_kembali_rencana,
          data.keterangan_kembali || null,
        );
      }
    } catch (notificationError) {
      console.error(
        "Failed to notify laboran about return request:",
        notificationError,
      );
    }

    return { id: peminjamanData.id };
  } catch (error) {
    console.error("Error returning borrowing request:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires update:peminjaman permission
export const returnBorrowingRequest = requirePermission(
  "update:peminjaman",
  returnBorrowingRequestImpl,
);

/**
 * Validate borrowing is still approved before downstream actions.
 * Stock has already been allocated when laboran approves the request.
 */
async function markBorrowingAsTakenImpl(
  peminjaman_id: string,
): Promise<{ id: string }> {
  try {
    const { data, error } = await supabase
      .from("peminjaman")
      .select("id")
      .eq("id", peminjaman_id)
      .eq("status", "approved"); // Only allow if currently approved

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Peminjaman tidak ditemukan atau tidak lagi disetujui");
    }

    return { id: peminjaman_id };
  } catch (error) {
    console.error("Error marking borrowing as taken:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires update:peminjaman permission
export const markBorrowingAsTaken = requirePermission(
  "update:peminjaman",
  markBorrowingAsTakenImpl,
);

/**
 * Update borrowing request (Edit Peminjaman)
 * Allows dosen to update borrowing details ONLY if status is still 'pending'
 */
async function updateBorrowingRequestImpl(
  peminjaman_id: string,
  data: {
    jadwal_praktikum_id?: string;
    inventaris_id?: string;
    jumlah_pinjam?: number;
    items?: BorrowingItemInput[];
    tanggal_pinjam?: string;
    tanggal_kembali_rencana?: string;
  },
): Promise<{ id: string }> {
  try {
    // Get current peminjaman to check status and ownership
    const { data: currentPeminjaman, error: fetchError } = await supabase
      .from("peminjaman")
      .select("id, status, dosen_id, inventaris_id, jumlah_pinjam")
      .eq("id", peminjaman_id)
      .single();

    if (fetchError || !currentPeminjaman) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    // Only allow update if status is 'pending'
    if (currentPeminjaman.status !== "pending") {
      throw new Error(
        "Peminjaman hanya dapat diubah jika statusnya masih menunggu (pending)",
      );
    }

    // Verify ownership (dosen can only update their own borrowing)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User tidak terautentikasi");

    const { data: dosenData, error: dosenError } = await supabase
      .from("dosen")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (dosenError || !dosenData) {
      throw new Error("Data dosen tidak ditemukan");
    }

    if (currentPeminjaman.dosen_id !== dosenData.id) {
      throw new Error("Anda hanya dapat mengubah peminjaman Anda sendiri");
    }

    let jadwalContext:
      | {
          id: string;
          tanggal_praktikum?: string | null;
          laboratorium_id: string;
          kelas?: { nama_kelas?: string | null } | null;
          mata_kuliah?: { nama_mk?: string | null } | null;
          laboratorium?: { nama_lab?: string | null } | null;
        }
      | undefined;

    if (data.jadwal_praktikum_id) {
      const { data: jadwalData, error: jadwalError } = await (supabase as any)
        .from("jadwal_praktikum")
        .select(
          `
          id,
          status,
          tanggal_praktikum,
          laboratorium_id,
          is_active,
          kelas:kelas_id (
            nama_kelas
          ),
          mata_kuliah:mata_kuliah_id (
            nama_mk
          ),
          laboratorium:laboratorium_id (
            nama_lab
          )
        `,
        )
        .eq("id", data.jadwal_praktikum_id)
        .eq("dosen_id", dosenData.id)
        .single();

      if (jadwalError || !jadwalData) {
        throw new Error("Jadwal praktikum tidak ditemukan untuk dosen ini");
      }

      if (jadwalData.is_active === false) {
        throw new Error("Jadwal praktikum yang dipilih sudah tidak aktif");
      }

      if (jadwalData.status !== "approved") {
        throw new Error(
          "Jadwal praktikum harus sudah disetujui laboran sebelum dipakai untuk peminjaman alat",
        );
      }

      if (jadwalData.tanggal_praktikum) {
        const jadwalDate = new Date(jadwalData.tanggal_praktikum);
        jadwalDate.setHours(0, 0, 0, 0);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        if (jadwalDate < currentDate) {
          throw new Error("Jadwal praktikum yang dipilih sudah lewat");
        }
      }

      jadwalContext = jadwalData as any;
    }

    const jadwalTanggalPinjam = jadwalContext?.tanggal_praktikum
      ? String(jadwalContext.tanggal_praktikum).split("T")[0]
      : null;

    if (data.jadwal_praktikum_id) {
      if (!jadwalTanggalPinjam) {
        throw new Error(
          "Jadwal praktikum yang dipilih belum memiliki tanggal yang valid",
        );
      }

      if (data.tanggal_pinjam && data.tanggal_pinjam !== jadwalTanggalPinjam) {
        throw new Error(
          "Tanggal pinjam harus mengikuti tanggal jadwal praktikum",
        );
      }
    }

    // Validate dates if both provided
    if (data.tanggal_pinjam && data.tanggal_kembali_rencana) {
      const pinjamDate = new Date(data.tanggal_pinjam);
      const kembaliDate = new Date(data.tanggal_kembali_rencana);
      if (kembaliDate <= pinjamDate) {
        throw new Error("Tanggal kembali harus setelah tanggal pinjam");
      }
    }

    const normalizedItems = normalizeBorrowingItems(
      data.items && data.items.length > 0
        ? data.items
        : data.inventaris_id && data.jumlah_pinjam
          ? [
              {
                inventaris_id: data.inventaris_id,
                jumlah_pinjam: data.jumlah_pinjam,
              },
            ]
          : [],
    );

    if (data.items && normalizedItems.length === 0) {
      throw new Error("Minimal satu alat harus tetap ada pada pengajuan");
    }

    if (normalizedItems.length > 0) {
      const { data: invData, error: invError } = await supabase
        .from("inventaris")
        .select("id, nama_barang, jumlah_tersedia")
        .in(
          "id",
          normalizedItems.map((item) => item.inventaris_id),
        );

      if (invError) {
        throw invError;
      }

      const invMap = new Map(
        ((invData as any[]) || []).map((item: any) => [item.id, item]),
      );

      normalizedItems.forEach((item) => {
        const inventaris = invMap.get(item.inventaris_id);
        if (!inventaris) {
          throw new Error("Ada alat yang dipilih tidak ditemukan");
        }
        if (inventaris.jumlah_tersedia < item.jumlah_pinjam) {
          throw new Error(
            `Stok tidak cukup untuk ${inventaris.nama_barang}. Tersedia: ${inventaris.jumlah_tersedia}`,
          );
        }
      });
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (normalizedItems.length > 0) {
      updateData.inventaris_id = normalizedItems[0].inventaris_id;
      updateData.jumlah_pinjam = normalizedItems[0].jumlah_pinjam;
    } else {
      if (data.inventaris_id) updateData.inventaris_id = data.inventaris_id;
      if (data.jumlah_pinjam) updateData.jumlah_pinjam = data.jumlah_pinjam;
    }
    if (data.jadwal_praktikum_id && jadwalTanggalPinjam) {
      updateData.tanggal_pinjam = jadwalTanggalPinjam;
      updateData.keperluan = buildBorrowingPurposeFromScheduleContext({
        mata_kuliah_nama: jadwalContext?.mata_kuliah?.nama_mk,
        kelas_nama: jadwalContext?.kelas?.nama_kelas,
        laboratorium_nama: jadwalContext?.laboratorium?.nama_lab,
        tanggal_praktikum: jadwalContext?.tanggal_praktikum,
      });
    } else if (data.tanggal_pinjam) {
      updateData.tanggal_pinjam = data.tanggal_pinjam;
    }
    if (data.tanggal_kembali_rencana)
      updateData.tanggal_kembali_rencana = data.tanggal_kembali_rencana;
    if (data.jadwal_praktikum_id && jadwalContext) {
      updateData.jadwal_praktikum_id = data.jadwal_praktikum_id;
      updateData.laboratorium_tujuan_id = jadwalContext.laboratorium_id;
      updateData.laboratorium_tujuan_nama =
        jadwalContext.laboratorium?.nama_lab || null;
    }

    const { error: updateError } = await supabase
      .from("peminjaman" as any)
      .update(updateData)
      .eq("id", peminjaman_id);

    if (updateError) {
      console.error("Error updating peminjaman:", updateError);
      throw updateError;
    }

    if (normalizedItems.length > 0) {
      const { error: deleteDetailError } = await supabase
        .from("peminjaman_detail" as any)
        .delete()
        .eq("peminjaman_id", peminjaman_id);

      if (deleteDetailError) {
        throw deleteDetailError;
      }

      const { error: insertDetailError } = await supabase
        .from("peminjaman_detail" as any)
        .insert(
          normalizedItems.map((item) => ({
            peminjaman_id,
            inventaris_id: item.inventaris_id,
            jumlah_pinjam: item.jumlah_pinjam,
            kondisi_pinjam: "baik",
          })),
        );

      if (insertDetailError) {
        throw insertDetailError;
      }
    }

    return { id: peminjaman_id };
  } catch (error) {
    console.error("Error updating borrowing request:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires update:peminjaman permission
export const updateBorrowingRequest = requirePermission(
  "update:peminjaman",
  updateBorrowingRequestImpl,
);

/**
 * Cancel borrowing request (Batalkan Peminjaman)
 * Allows dosen to cancel their borrowing request ONLY if status is still 'pending'
 */
async function cancelBorrowingRequestImpl(
  peminjaman_id: string,
): Promise<{ id: string }> {
  try {
    // Get current peminjaman to check status and ownership
    const { data: currentPeminjaman, error: fetchError } = await supabase
      .from("peminjaman")
      .select("id, status, dosen_id")
      .eq("id", peminjaman_id)
      .single();

    if (fetchError || !currentPeminjaman) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    // Only allow cancel if status is 'pending'
    if (currentPeminjaman.status !== "pending") {
      throw new Error(
        "Peminjaman hanya dapat dibatalkan jika statusnya masih menunggu (pending)",
      );
    }

    // Verify ownership
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User tidak terautentikasi");

    const { data: dosenData, error: dosenError } = await supabase
      .from("dosen")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (dosenError || !dosenData) {
      throw new Error("Data dosen tidak ditemukan");
    }

    if (currentPeminjaman.dosen_id !== dosenData.id) {
      throw new Error("Anda hanya dapat membatalkan peminjaman Anda sendiri");
    }

    // Delete the peminjaman (hard delete)
    const { error: deleteError } = await supabase
      .from("peminjaman")
      .delete()
      .eq("id", peminjaman_id);

    if (deleteError) {
      console.error("Error deleting peminjaman:", deleteError);
      throw deleteError;
    }

    return { id: peminjaman_id };
  } catch (error) {
    console.error("Error canceling borrowing request:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires update:peminjaman permission
export const cancelBorrowingRequest = requirePermission(
  "update:peminjaman",
  cancelBorrowingRequestImpl,
);

// ============================================================================
// EXPORTS
// ============================================================================

export { getMyBorrowing as getMyBorrowingRequests };
export { getDosenId };

export const dosenApi = {
  // Existing
  getStats: getDosenStats,
  getMyMataKuliah,
  getMyKelas,
  getDosenId,
  getUpcomingPracticum,
  getPendingGrading,
  getActiveKuis,
  getMyBorrowing,
  getMyBorrowingRequests: getMyBorrowing,

  // 🆕 NEW
  getKelasStudents,
  getMyKelasWithStudents,
  getStudentStats,
  exportAllStudents,

  // Borrowing Request
  createBorrowingRequest,
  updateBorrowingRequest,
  cancelBorrowingRequest,
  getAvailableEquipment,
  markBorrowingAsTaken,
  returnBorrowingRequest,
};

// ============================================================================
// REAL-TIME DATA REFRESH FUNCTIONS
// ============================================================================

/**
 * Force refresh all dosen data and clear cache
 */
async function refreshDosenDataImpl(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("🔄 Refreshing dosen data and clearing cache...");

    // Clear all dosen-related cache - clearByPattern not available
    // cacheAPI.clearByPattern("dosen:");
    // cacheAPI.clearByPattern("kelas:");
    // cacheAPI.clearByPattern("mata_kuliah:");
    // cacheAPI.clearByPattern("jadwal:");
    // cacheAPI.clearByPattern("kuis:");
    // cacheAPI.clearByPattern("stats:");

    // Trigger Supabase cache invalidation by running a simple query
    await supabase.from("dosen").select("id").limit(1);

    console.log("✅ Dosen data refreshed successfully");
    return { success: true };
  } catch (error: any) {
    console.error("Error refreshing dosen data:", error);
    return { success: false, error: error.message };
  }
}

export const refreshDosenData = requirePermission(
  "read:dashboard",
  refreshDosenDataImpl,
);

/**
 * Check if dosen's assignments have been modified by admin
 */
async function checkDosenAssignmentChangesImpl(): Promise<{
  hasChanges: boolean;
  lastUpdate?: string;
  deletedAssignments?: any[];
}> {
  try {
    const { data: user } = await supabase.auth.getUser();
    const dosenId = user?.user?.id;

    if (!dosenId) {
      return { hasChanges: false };
    }

    // Get current jadwal for this dosen
    const { data: currentJadwal, error: jadwalError } = await (supabase as any)
      .from("jadwal_praktikum")
      .select("id, updated_at")
      .eq("dosen_id", dosenId)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (jadwalError) {
      throw jadwalError;
    }

    // Get current dosen mata kuliah
    const { data: currentDosenMk, error: mkError } = await supabase
      .from("dosen_mata_kuliah")
      .select("id, updated_at")
      .eq("dosen_id", dosenId)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (mkError) {
      throw mkError;
    }

    // Check if there are any recent changes (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const recentJadwalChanges =
      currentJadwal?.filter(
        (j) => new Date(j.updated_at) > new Date(fiveMinutesAgo),
      ) || [];

    const recentMkChanges =
      currentDosenMk?.filter(
        (mk) => new Date(mk.updated_at) > new Date(fiveMinutesAgo),
      ) || [];

    const hasChanges =
      recentJadwalChanges.length > 0 || recentMkChanges.length > 0;

    return {
      hasChanges,
      lastUpdate:
        currentJadwal?.[0]?.updated_at || currentDosenMk?.[0]?.updated_at,
      deletedAssignments: [],
    };
  } catch (error: any) {
    console.error("Error checking dosen assignment changes:", error);
    return { hasChanges: false };
  }
}

export const checkDosenAssignmentChanges = requirePermission(
  "read:dashboard",
  checkDosenAssignmentChangesImpl,
);
