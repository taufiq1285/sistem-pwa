/**
 * Mahasiswa API - COMPLETE FIX
 * All .single() issues fixed to prevent 406 errors
 */

import { supabase } from "@/lib/supabase/client";
import { cacheAPI } from "@/lib/offline/api-cache";
import {
  requirePermission,
  requirePermissionAndOwnership,
} from "@/lib/middleware";
import logger from "@/lib/utils/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface MahasiswaStats {
  totalKelasPraktikum: number; // Renamed from totalMataKuliah for clarity
  totalKuis: number;
  rataRataNilai: number | null;
  jadwalHariIni: number;
}

export interface AvailableKelas {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  kuota: number;
  jumlah_mahasiswa: number;
  is_full: boolean;
  is_enrolled: boolean;
  mata_kuliah: {
    id: string;
    kode_mk: string;
    nama_mk: string;
    sks: number;
    semester: number;
  };
  jadwal_count: number;
  next_jadwal?: {
    tanggal_praktikum: string;
    jam_mulai: string;
    jam_selesai: string;
    lab_nama: string;
  };
}

async function resolveMataKuliahIdForKelas(
  kelasId: string,
  fallbackMataKuliahId?: string | null,
): Promise<string | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data: upcomingJadwalMkData } = await (supabase as any)
    .from("jadwal_praktikum")
    .select("mata_kuliah_id")
    .eq("kelas_id", kelasId)
    .eq("is_active", true)
    .eq("status", "approved")
    .not("mata_kuliah_id", "is", null)
    .gte("tanggal_praktikum", today)
    .order("tanggal_praktikum", { ascending: true })
    .limit(1);

  const upcomingMataKuliahId = upcomingJadwalMkData?.[0]?.mata_kuliah_id;
  if (upcomingMataKuliahId) {
    return upcomingMataKuliahId;
  }

  const { data: latestJadwalMkData } = await (supabase as any)
    .from("jadwal_praktikum")
    .select("mata_kuliah_id")
    .eq("kelas_id", kelasId)
    .eq("is_active", true)
    .eq("status", "approved")
    .not("mata_kuliah_id", "is", null)
    .order("tanggal_praktikum", { ascending: false })
    .limit(1);

  const latestMataKuliahId = latestJadwalMkData?.[0]?.mata_kuliah_id;
  if (latestMataKuliahId) {
    return latestMataKuliahId;
  }

  return fallbackMataKuliahId || null;
}

export interface MyKelas {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  mata_kuliah_kode: string;
  mata_kuliah_nama: string;
  sks: number;
  tahun_ajaran: string;
  semester_ajaran: number;
  enrolled_at: string;
}

async function getDashboardActiveKelasIds(
  mahasiswaId: string,
): Promise<string[]> {
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("kelas_mahasiswa")
    .select("kelas_id")
    .eq("mahasiswa_id", mahasiswaId)
    .eq("is_active", true);

  if (enrollmentError) throw enrollmentError;

  const enrolledKelasIds = (enrollmentData || [])
    .map((item: any) => item.kelas_id)
    .filter((id: any): id is string => typeof id === "string" && id.length > 0);

  if (enrolledKelasIds.length === 0) {
    return [];
  }

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  const [activeKelasResult, upcomingJadwalResult, activeQuizResult] =
    await Promise.all([
      supabase
        .from("kelas")
        .select("id")
        .in("id", enrolledKelasIds)
        .eq("is_active", true),
      (supabase as any)
        .from("jadwal_praktikum")
        .select("kelas_id")
        .in("kelas_id", enrolledKelasIds)
        .eq("is_active", true)
        .eq("status", "approved")
        .gte("tanggal_praktikum", today),
      supabase
        .from("kuis")
        .select("kelas_id")
        .in("kelas_id", enrolledKelasIds)
        .eq("status", "published")
        .gte("tanggal_selesai", now),
    ]);

  if (activeKelasResult.error) throw activeKelasResult.error;
  if (upcomingJadwalResult.error) throw upcomingJadwalResult.error;
  if (activeQuizResult.error) throw activeQuizResult.error;

  const activeKelasIds = new Set(
    ((activeKelasResult.data as any[]) || [])
      .map((item: any) => item.id)
      .filter(
        (id: any): id is string => typeof id === "string" && id.length > 0,
      ),
  );

  const dashboardKelasIds = new Set<string>();

  ((upcomingJadwalResult.data as any[]) || []).forEach((item: any) => {
    if (activeKelasIds.has(item.kelas_id)) {
      dashboardKelasIds.add(item.kelas_id);
    }
  });

  ((activeQuizResult.data as any[]) || []).forEach((item: any) => {
    if (activeKelasIds.has(item.kelas_id)) {
      dashboardKelasIds.add(item.kelas_id);
    }
  });

  return Array.from(dashboardKelasIds);
}

export interface JadwalMahasiswa {
  id: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik?: string;
  kelas_nama: string;
  mata_kuliah_nama: string;
  dosen_nama?: string;
  lab_nama: string;
  lab_kode: string;
}

// ============================================================================
// HELPER
// ============================================================================

// Cache for mahasiswa ID
let cachedMahasiswaId: string | null = null;
let cachedMahasiswaIdTimestamp: number = 0;
const MAHASISWA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAHASISWA_ID_STORAGE_KEY = "cached_mahasiswa_id";

/**
 * Clear mahasiswa ID cache (for testing)
 */
export function clearMahasiswaCache(): void {
  cachedMahasiswaId = null;
  cachedMahasiswaIdTimestamp = 0;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(MAHASISWA_ID_STORAGE_KEY);
  }
}

async function getMahasiswaId(): Promise<string | null> {
  try {
    // Return cached value if still valid (in-memory)
    if (
      cachedMahasiswaId &&
      Date.now() - cachedMahasiswaIdTimestamp < MAHASISWA_CACHE_DURATION
    ) {
      return cachedMahasiswaId;
    }

    // Try to get from localStorage (persistent for offline)
    const storedMahasiswaId = localStorage.getItem(MAHASISWA_ID_STORAGE_KEY);
    if (storedMahasiswaId) {
      cachedMahasiswaId = storedMahasiswaId;
      cachedMahasiswaIdTimestamp = Date.now();
      return storedMahasiswaId;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return storedMahasiswaId || cachedMahasiswaId;
    }

    try {
      const { data } = await supabase
        .from("mahasiswa")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.id) {
        // Cache result (in-memory and localStorage)
        cachedMahasiswaId = data.id;
        cachedMahasiswaIdTimestamp = Date.now();
        localStorage.setItem(MAHASISWA_ID_STORAGE_KEY, data.id);
        return data.id;
      }

      return storedMahasiswaId || cachedMahasiswaId;
    } catch (fetchError) {
      // Network error - return cached
      return storedMahasiswaId || cachedMahasiswaId;
    }
  } catch (error: unknown) {
    // Suppress error - return cached/stored if available
    const storedMahasiswaId = localStorage.getItem(MAHASISWA_ID_STORAGE_KEY);
    return storedMahasiswaId || cachedMahasiswaId;
  }
}

// ============================================================================
// STATS
// ============================================================================

export async function getMahasiswaStats(): Promise<MahasiswaStats> {
  return cacheAPI(
    "mahasiswa_stats",
    async () => {
      try {
        const mahasiswaId = await getMahasiswaId();
        if (!mahasiswaId) {
          return {
            totalKelasPraktikum: 0,
            totalKuis: 0,
            rataRataNilai: null,
            jadwalHariIni: 0,
          };
        }

        const kelasIds = await getDashboardActiveKelasIds(mahasiswaId);
        const totalKelasPraktikum = kelasIds.length;

        // 2️⃣ GET TODAY'S SCHEDULE
        const today = new Date().toISOString().split("T")[0];
        const { data: jadwalData } =
          kelasIds.length > 0
            ? await (supabase as any)
                .from("jadwal_praktikum")
                .select("id")
                .eq("tanggal_praktikum", today)
                .in("kelas_id", kelasIds)
                .eq("is_active", true)
                .eq("status", "approved")
            : { data: [] };

        const jadwalHariIni = jadwalData?.length || 0;

        // 3️⃣ GET QUIZZES (published + currently running or upcoming)
        // Kuis dihitung jika:
        // - Status: published
        // - Kelas: enrolled kelas
        // - Status berlangsung: tanggal_mulai <= NOW <= tanggal_selesai
        const now = new Date().toISOString();
        const { data: kuisData } =
          kelasIds.length > 0
            ? await supabase
                .from("kuis")
                .select("id")
                .in("kelas_id", kelasIds)
                .eq("status", "published")
                .lte("tanggal_mulai", now)
                .gte("tanggal_selesai", now)
            : { data: [] };

        const totalKuis = kuisData?.length || 0;

        // 4️⃣ GET AVERAGE SCORE
        const { data: nilaiData } = await supabase
          .from("attempt_kuis")
          .select("total_score")
          .eq("mahasiswa_id", mahasiswaId)
          .not("total_score", "is", null);

        let rataRataNilai = null;
        if (nilaiData && nilaiData.length > 0) {
          const sum = nilaiData.reduce(
            (acc: number, curr: any) => acc + (curr.total_score || 0),
            0,
          );
          rataRataNilai = sum / nilaiData.length;
        }

        return {
          totalKelasPraktikum,
          totalKuis,
          rataRataNilai,
          jadwalHariIni,
        };
      } catch (error: unknown) {
        console.error("Error fetching mahasiswa stats:", error);
        return {
          totalKelasPraktikum: 0,
          totalKuis: 0,
          rataRataNilai: null,
          jadwalHariIni: 0,
        };
      }
    },
    {
      ttl: 5 * 60 * 1000, // Cache for 5 minutes
      staleWhileRevalidate: true,
    },
  );
}

// ============================================================================
// AVAILABLE KELAS
// ============================================================================

export async function getAvailableKelas(): Promise<AvailableKelas[]> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) return [];

    const { data: kelasData, error } = await supabase
      .from("kelas")
      .select(
        "id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, kuota, mata_kuliah_id",
      )
      .eq("is_active", true)
      .order("nama_kelas", { ascending: true });

    if (error) throw error;
    if (!kelasData) return [];

    const { data: enrolledData } = await supabase
      .from("kelas_mahasiswa")
      .select("kelas_id")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("is_active", true);

    const enrolledKelasIds = new Set(
      enrolledData?.map((e: any) => e.kelas_id) || [],
    );

    const result = await Promise.all(
      kelasData.map(async (kelas: any) => {
        const mataKuliahId = await resolveMataKuliahIdForKelas(
          kelas.id,
          kelas.mata_kuliah_id,
        );

        let mkData = null;
        if (mataKuliahId) {
          const { data } = await supabase
            .from("mata_kuliah")
            .select("id, kode_mk, nama_mk, sks, semester")
            .eq("id", mataKuliahId)
            .single();
          mkData = data;
        }

        // Get count of active enrollments
        const { count: jumlahMahasiswa } = await supabase
          .from("kelas_mahasiswa")
          .select("*", { count: "exact", head: true })
          .eq("kelas_id", kelas.id)
          .eq("is_active", true);

        const { count: jadwalCount } = await (supabase as any)
          .from("jadwal_praktikum")
          .select("*", { count: "exact", head: true })
          .eq("kelas_id", kelas.id)
          .eq("is_active", true)
          .eq("status", "approved");

        // FIXED: No .single() to avoid 406 error when no data
        const today = new Date().toISOString().split("T")[0];
        const { data: nextJadwalArray } = await (supabase as any)
          .from("jadwal_praktikum")
          .select("tanggal_praktikum, jam_mulai, jam_selesai, laboratorium_id")
          .eq("kelas_id", kelas.id)
          .gte("tanggal_praktikum", today)
          .eq("is_active", true)
          .eq("status", "approved")
          .order("tanggal_praktikum", { ascending: true })
          .limit(1);

        const nextJadwalData =
          nextJadwalArray && nextJadwalArray.length > 0
            ? nextJadwalArray[0]
            : null;

        let nextJadwal;
        if (nextJadwalData) {
          const { data: labData } = await supabase
            .from("laboratorium")
            .select("nama_lab")
            .eq("id", nextJadwalData.laboratorium_id)
            .single();

          nextJadwal = {
            tanggal_praktikum: nextJadwalData.tanggal_praktikum,
            jam_mulai: nextJadwalData.jam_mulai,
            jam_selesai: nextJadwalData.jam_selesai,
            lab_nama: labData?.nama_lab || "-",
          };
        }

        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas,
          nama_kelas: kelas.nama_kelas,
          tahun_ajaran: kelas.tahun_ajaran,
          semester_ajaran: kelas.semester_ajaran,
          kuota: kelas.kuota,
          jumlah_mahasiswa: jumlahMahasiswa || 0,
          is_full: (jumlahMahasiswa || 0) >= kelas.kuota,
          is_enrolled: enrolledKelasIds.has(kelas.id),
          mata_kuliah: mkData || {
            id: "",
            kode_mk: "",
            nama_mk: "",
            sks: 0,
            semester: 0,
          },
          jadwal_count: jadwalCount || 0,
          next_jadwal: nextJadwal,
        };
      }),
    );

    return result;
  } catch (error: unknown) {
    console.error("Error fetching available kelas:", error);
    return [];
  }
}

// ============================================================================
// ENROLLMENT
// ============================================================================

async function enrollToKelasImpl(
  kelasId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) {
      return { success: false, message: "Mahasiswa tidak ditemukan" };
    }

    // FIXED: No .single() to avoid 406 error when not enrolled yet
    const { data: existingArray } = await supabase
      .from("kelas_mahasiswa")
      .select("id")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("kelas_id", kelasId)
      .eq("is_active", true)
      .limit(1);

    if (existingArray && existingArray.length > 0) {
      return { success: false, message: "Anda sudah terdaftar di kelas ini" };
    }

    const { data: kelasData } = await supabase
      .from("kelas")
      .select("kuota")
      .eq("id", kelasId)
      .single();

    if (!kelasData) {
      return { success: false, message: "Kelas tidak ditemukan" };
    }

    // Get count of active enrollments for this kelas
    const { count: enrolledCount } = await supabase
      .from("kelas_mahasiswa")
      .select("*", { count: "exact", head: true })
      .eq("kelas_id", kelasId)
      .eq("is_active", true);

    if ((enrolledCount || 0) >= (kelasData.kuota || 0)) {
      return { success: false, message: "Kelas sudah penuh" };
    }

    const { error } = await supabase.from("kelas_mahasiswa").insert({
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      enrolled_at: new Date().toISOString(),
      is_active: true,
    });

    if (error) throw error;

    return { success: true, message: "Berhasil mendaftar ke kelas" };
  } catch (error: unknown) {
    console.error("Error enrolling to kelas:", error);
    return {
      success: false,
      message: (error as Error).message || "Gagal mendaftar ke kelas",
    };
  }
}

async function unenrollFromKelasImpl(
  kelasId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) {
      return { success: false, message: "Mahasiswa tidak ditemukan" };
    }

    const { error } = await supabase
      .from("kelas_mahasiswa")
      .update({ is_active: false })
      .eq("mahasiswa_id", mahasiswaId)
      .eq("kelas_id", kelasId);

    if (error) throw error;

    return { success: true, message: "Berhasil keluar dari kelas" };
  } catch (error: unknown) {
    console.error("Error unenrolling from kelas:", error);
    return {
      success: false,
      message: (error as Error).message || "Gagal keluar dari kelas",
    };
  }
}

// Export enrollment functions
export const enrollToKelas = enrollToKelasImpl;
export const unenrollFromKelas = unenrollFromKelasImpl;

// ============================================================================
// MY CLASSES
// ============================================================================

export async function getMyKelas(): Promise<MyKelas[]> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) return [];

    const { data, error } = await supabase
      .from("kelas_mahasiswa")
      .select("kelas_id, enrolled_at")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("is_active", true)
      .order("enrolled_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const result = await Promise.all(
      data.map(async (item: any) => {
        const { data: kelasData } = await supabase
          .from("kelas")
          .select(
            "id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, mata_kuliah_id",
          )
          .eq("id", item.kelas_id)
          .single();

        if (!kelasData) return null;

        const mataKuliahId = await resolveMataKuliahIdForKelas(
          item.kelas_id,
          kelasData.mata_kuliah_id,
        );

        let mkData = null;
        if (mataKuliahId) {
          const { data } = await supabase
            .from("mata_kuliah")
            .select("kode_mk, nama_mk, sks")
            .eq("id", mataKuliahId)
            .single();
          mkData = data;
        }

        return {
          id: kelasData.id,
          kode_kelas: kelasData.kode_kelas,
          nama_kelas: kelasData.nama_kelas,
          mata_kuliah_kode: mkData?.kode_mk || "-",
          mata_kuliah_nama: mkData?.nama_mk || "-",
          sks: mkData?.sks || 0,
          tahun_ajaran: kelasData.tahun_ajaran,
          semester_ajaran: kelasData.semester_ajaran,
          enrolled_at: item.enrolled_at,
        };
      }),
    );

    return result.filter((item): item is MyKelas => item !== null);
  } catch (error: unknown) {
    console.error("Error fetching my kelas:", error);
    return [];
  }
}

export async function getDashboardKelas(): Promise<MyKelas[]> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) return [];

    const [kelasList, dashboardKelasIds] = await Promise.all([
      getMyKelas(),
      getDashboardActiveKelasIds(mahasiswaId),
    ]);

    if (dashboardKelasIds.length === 0) {
      return [];
    }

    const activeKelasIdSet = new Set(dashboardKelasIds);
    return kelasList.filter((kelas) => activeKelasIdSet.has(kelas.id));
  } catch (error: unknown) {
    console.error("Error fetching dashboard kelas:", error);
    return [];
  }
}

// ============================================================================
// JADWAL
// ============================================================================

export async function getMyJadwal(limit?: number): Promise<JadwalMahasiswa[]> {
  try {
    logger.debug("🚨 getMyJadwal CALLED");
    const mahasiswaId = await getMahasiswaId();
    logger.debug("🔍 Mahasiswa ID:", mahasiswaId);

    if (!mahasiswaId) return [];

    const { data: enrolledData, error: enrollError } = await supabase
      .from("kelas_mahasiswa")
      .select("kelas_id, is_active")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("is_active", true);

    logger.debug("🔍 Enrolled data:", enrolledData);
    logger.debug("🔍 Enroll error:", enrollError);

    if (!enrolledData || enrolledData.length === 0) {
      logger.debug("⚠️ No enrolled kelas found");
      return [];
    }

    const kelasIds = enrolledData.map((e: any) => e.kelas_id);
    logger.debug("🔍 Kelas IDs:", kelasIds);

    // Prioritaskan jadwal yang akan datang agar dashboard menampilkan
    // praktikum terbaru, bukan sesi lampau.
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 hari ke depan

    // Format date as YYYY-MM-DD for DATE column type
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDate(today);
    const futureDateStr = formatDate(futureDate);

    logger.debug("🔍 Date range:", {
      today: todayStr,
      future: futureDateStr,
    });
    logger.debug("🔍 Kelas IDs filter:", kelasIds);

    const { data: jadwalData, error: jadwalError } = await (supabase as any)
      .from("jadwal_praktikum")
      .select(
        "id, tanggal_praktikum, hari, jam_mulai, jam_selesai, topik, kelas_id, laboratorium_id, mata_kuliah_id, dosen_id",
      )
      .in("kelas_id", kelasIds)
      .gte("tanggal_praktikum", todayStr)
      .lte("tanggal_praktikum", futureDateStr)
      .eq("is_active", true)
      .eq("status", "approved")
      .order("tanggal_praktikum", { ascending: true })
      .order("jam_mulai", { ascending: true })
      .limit(limit || 50);

    logger.debug("🔍 Jadwal query result:", { jadwalData, jadwalError });

    if (!jadwalData || jadwalData.length === 0) {
      logger.debug("No jadwal found");
      return [];
    }

    logger.debug("Found", jadwalData.length, "jadwal");

    const result = await Promise.all(
      jadwalData.map(async (item: any) => {
        const { data: kelasData } = await supabase
          .from("kelas")
          .select("nama_kelas, mata_kuliah_id")
          .eq("id", item.kelas_id)
          .single();

        let mkData = null;
        const mataKuliahId =
          item.mata_kuliah_id ||
          (await resolveMataKuliahIdForKelas(
            item.kelas_id,
            kelasData?.mata_kuliah_id,
          ));
        if (mataKuliahId) {
          const result = await supabase
            .from("mata_kuliah")
            .select("nama_mk")
            .eq("id", mataKuliahId)
            .single();
          mkData = result.data;
        }

        let dosenData = null;
        if (item.dosen_id) {
          const result = await supabase
            .from("dosen")
            .select("user:user_id(full_name)")
            .eq("id", item.dosen_id)
            .maybeSingle();
          dosenData = result.data;
        }

        const { data: labData } = await supabase
          .from("laboratorium")
          .select("nama_lab, kode_lab")
          .eq("id", item.laboratorium_id)
          .single();

        return {
          id: item.id,
          tanggal_praktikum: item.tanggal_praktikum,
          hari: item.hari,
          jam_mulai: item.jam_mulai,
          jam_selesai: item.jam_selesai,
          topik: item.topik,
          kelas_nama: kelasData?.nama_kelas || "-",
          mata_kuliah_nama: mkData?.nama_mk || "-",
          dosen_nama: dosenData?.user?.full_name || "-",
          lab_nama: labData?.nama_lab || "-",
          lab_kode: labData?.kode_lab || "-",
        };
      }),
    );

    return result;
  } catch (error: unknown) {
    console.error("Error fetching my jadwal:", error);
    return [];
  }
}
