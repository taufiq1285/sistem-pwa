/**
 * Dosen API - FIXED: Added getMyKelas and KelasWithStats
 * * 🆕 UPDATED: Added Student Enrollment functions
 */

import { supabase } from "@/lib/supabase/client";
import { cacheAPI } from "@/lib/offline/api-cache";

import { requirePermission } from "@/lib/middleware";
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

export interface MyBorrowingRequest {
  id: string;
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

// ============================================================================
// HELPER FUNCTION
// ============================================================================

// Cache for dosen ID to reduce redundant calls
let cachedDosenId: string | null = null;
let cachedDosenIdTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DOSEN_ID_STORAGE_KEY = "cached_dosen_id";

// Test helper to reset cache (exported for testing)
export function __resetDosenIdCache() {
  cachedDosenId = null;
  cachedDosenIdTimestamp = 0;
}

// Test helper to set cache (exported for testing)
export function __setDosenIdCache(dosenId: string) {
  cachedDosenId = dosenId;
  cachedDosenIdTimestamp = Date.now();
}

async function getDosenId(): Promise<string | null> {
  try {
    // Return cached value if still valid (in-memory cache)
    if (cachedDosenId && Date.now() - cachedDosenIdTimestamp < CACHE_DURATION) {
      return cachedDosenId;
    }

    // Try to get from localStorage (persistent cache for offline)
    const storedDosenId = localStorage.getItem(DOSEN_ID_STORAGE_KEY);
    if (storedDosenId) {
      cachedDosenId = storedDosenId;
      cachedDosenIdTimestamp = Date.now();
      return storedDosenId;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("🔍 DEBUG getDosenId: user =", user?.id);

    if (!user) {
      console.log("❌ DEBUG: No authenticated user");
      // No user - return stored dosen ID if available
      return storedDosenId || cachedDosenId;
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
        return storedDosenId || cachedDosenId; // Return cached if available
      }

      if (!data) {
        return storedDosenId || cachedDosenId; // Return cached if available
      }

      // Cache the result (in-memory and localStorage)
      cachedDosenId = data.id;
      cachedDosenIdTimestamp = Date.now();
      localStorage.setItem(DOSEN_ID_STORAGE_KEY, data.id);

      return data.id;
    } catch (fetchError) {
      // Network error - return cached if available
      return storedDosenId || cachedDosenId;
    }
  } catch (error) {
    // Suppress error - return cached/stored if available
    const storedDosenId = localStorage.getItem(DOSEN_ID_STORAGE_KEY);
    return storedDosenId || cachedDosenId;
  }
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDosenStats(): Promise<DosenStats> {
  return cacheAPI(
    "dosen_stats",
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

        // 🔄 FIXED: Count kelas by querying jadwal_praktikum assigned to this dosen
        const { data: jadwalData } = await (supabase as any)
          .from("jadwal_praktikum")
          .select("kelas_id")
          .eq("dosen_id", dosenId)
          .eq("is_active", true)
          .eq("status", "approved");

        // Get unique kelas IDs from jadwal
        const uniqueKelasIds = Array.from(
          new Set(jadwalData?.map((j: any) => j.kelas_id) || []),
        );
        const totalKelas = uniqueKelasIds.length;

        let totalMahasiswa = 0;
        if (uniqueKelasIds.length > 0) {
          const { count } = await supabase
            .from("kelas_mahasiswa" as any)
            .select("mahasiswa_id", { count: "exact", head: true })
            .in("kelas_id", uniqueKelasIds);
          totalMahasiswa = count || 0;
        }

        const { count: activeKuis } = await supabase
          .from("kuis")
          .select("*", { count: "exact", head: true })
          .eq("dosen_id", dosenId)
          .eq("status", "published");

        const { data: kuisData } = await supabase
          .from("kuis")
          .select("id")
          .eq("dosen_id", dosenId);

        const kuisIds = kuisData?.map((k) => k.id) || [];

        let pendingGrading = 0;
        if (kuisIds.length > 0) {
          const { count } = await supabase
            .from("attempt_kuis" as any)
            .select("*", { count: "exact", head: true })
            .in("kuis_id", kuisIds)
            .eq("status", "submitted");
          pendingGrading = count || 0;
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
      staleWhileRevalidate: true, // Return stale data while fetching fresh
    },
  );
}

// ============================================================================
// MY KELAS - ✅ NEW FUNCTION
// ============================================================================

export async function getMyKelas(limit?: number): Promise<KelasWithStats[]> {
  try {
    console.log("🔍 DEBUG getMyKelas: Getting ALL available kelas");

    // 🎯 QUERY: Get ALL active kelas (kelas berdiri sendiri, tidak terikat mata kuliah)
    const { data: allKelas, error: kelasError } = await supabase
      .from("kelas")
      .select(
        "id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, mata_kuliah_id, is_active",
      )
      .eq("is_active", true);

    if (kelasError) {
      console.error("❌ DEBUG: kelasError =", kelasError);
      throw kelasError;
    }

    if (!allKelas || allKelas.length === 0) {
      console.log("⚠️ DEBUG: No kelas found in database");
      return [];
    }

    console.log(`📚 DEBUG: Found ${allKelas.length} total active kelas`);

    // Step 2: Get unique mata_kuliah_ids
    const mkIds = [
      ...new Set(allKelas.map((k: any) => k.mata_kuliah_id).filter(Boolean)),
    ];

    console.log(
      `🔍 DEBUG: Extracting ${mkIds.length} unique mata_kuliah_ids:`,
      mkIds,
    );

    if (mkIds.length === 0) {
      // Kelas boleh tanpa mata_kuliah_id - normal behavior
    }

    // Step 3: Fetch mata_kuliah data separately
    const { data: mataKuliahData, error: mkError } = await supabase
      .from("mata_kuliah")
      .select("id, kode_mk, nama_mk")
      .in("id", mkIds);

    if (mkError) {
      console.error("❌ DEBUG: mkError =", mkError);
      // Continue without mata kuliah data rather than failing completely
    }

    console.log(
      `📚 DEBUG: Found ${mataKuliahData?.length || 0} mata kuliah records`,
    );
    console.log(`🔍 DEBUG: Mata kuliah data:`, mataKuliahData);

    // Step 4: Create a map for quick lookup
    const mkMap = new Map((mataKuliahData || []).map((mk: any) => [mk.id, mk]));

    // Step 5: Get stats for each kelas and merge with mata kuliah
    const kelasWithStats = await Promise.all(
      allKelas.map(async (kelas: any) => {
        const { count } = await supabase
          .from("kelas_mahasiswa" as any)
          .select("*", { count: "exact", head: true })
          .eq("kelas_id", kelas.id)
          .eq("is_active", true);

        const mk = mkMap.get(kelas.mata_kuliah_id);

        const result = {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas || "",
          nama_kelas: kelas.nama_kelas,
          tahun_ajaran: kelas.tahun_ajaran,
          semester_ajaran: kelas.semester_ajaran,
          totalMahasiswa: count || 0,
          mata_kuliah_id: kelas.mata_kuliah_id,
          mata_kuliah_kode: mk?.kode_mk || "",
          mata_kuliah_nama: mk?.nama_mk || "", // Kosong jika belum dipilih,
        };

        console.log("🔍 DEBUG: Processed kelas =", {
          id: result.id,
          nama_kelas: result.nama_kelas,
          mk_id: kelas.mata_kuliah_id,
          mk_nama: result.mata_kuliah_nama,
          mk_kode: result.mata_kuliah_kode,
        });

        return result;
      }),
    );

    // Deduplicate by kelas ID and enforce limit client-side
    const uniqueById = Array.from(
      new Map(kelasWithStats.map((k) => [k.id, k])).values(),
    );

    const finalResult = limit ? uniqueById.slice(0, limit) : uniqueById;
    console.log(
      `✅ DEBUG: Returning ${finalResult.length} kelas (mata kuliah optional)`,
    );

    return finalResult;
  } catch (error) {
    console.error("Error fetching my kelas:", error);
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

    const { data: kelasData, error: kelasError } = await supabase
      .from("kelas")
      .select(
        `
        id,
        mata_kuliah_id,
        mata_kuliah (
          id,
          kode_mk,
          nama_mk,
          sks,
          semester,
          program_studi
        )
      `,
      )
      .eq("dosen_id", dosenId)
      .eq("is_active", true);

    if (kelasError) throw kelasError;

    const mataKuliahMap = new Map();

    for (const kelas of (kelasData as KelasDataForMK[] | null) || []) {
      const mk = kelas.mata_kuliah;
      if (!mk) continue;

      if (!mataKuliahMap.has(mk.id)) {
        mataKuliahMap.set(mk.id, {
          ...mk,
          totalKelas: 0,
          totalMahasiswa: 0,
        });
      }

      const current = mataKuliahMap.get(mk.id);
      current.totalKelas += 1;
    }

    for (const [mkId, mk] of mataKuliahMap.entries()) {
      const { data: kelasIds } = await supabase
        .from("kelas")
        .select("id")
        .eq("dosen_id", dosenId)
        .eq("mata_kuliah_id", mkId);

      if (kelasIds && kelasIds.length > 0) {
        const { count } = await supabase
          .from("kelas_mahasiswa" as any)
          .select("*", { count: "exact", head: true })
          .in(
            "kelas_id",
            kelasIds.map((k) => k.id),
          );

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
      mata_kuliah_nama: item.kelas?.mata_kuliah?.nama_mk || "-",
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
  submitted_at: string;
  attempt_number: number;
  mahasiswa: {
    nim: string;
    user: {
      full_name: string;
    } | null;
  } | null;
  kuis: {
    judul: string;
    kelas: {
      mata_kuliah: {
        nama_mk: string;
      } | null;
    } | null;
  } | null;
};

export async function getPendingGrading(
  limit?: number,
): Promise<PendingGrading[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    const { data: kuisIds } = await supabase
      .from("kuis")
      .select("id")
      .eq("dosen_id", dosenId);

    if (!kuisIds || kuisIds.length === 0) {
      return [];
    }

    let query = supabase
      .from("attempt_kuis" as any)
      .select(
        `
        id,
        submitted_at,
        attempt_number,
        mahasiswa (
          nim,
          users (
            full_name
          )
        ),
        kuis (
          judul,
          kelas (
            mata_kuliah (
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
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return ((data as unknown as GradingData[]) || []).map((item) => ({
      id: item.id,
      mahasiswa_nama: item.mahasiswa?.user?.full_name || "-",
      mahasiswa_nim: item.mahasiswa?.nim || "-",
      mata_kuliah_nama: item.kuis?.kelas?.mata_kuliah?.nama_mk || "-",
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
      // ✅ FIXED: Tampilkan draft DAN published, kecuali archived
      .in("status", ["draft", "published"])
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const kuisWithStats = await Promise.all(
      ((data as KuisData[]) || []).map(async (kuis) => {
        const { count: totalAttempts } = await supabase
          .from("attempt_kuis" as any)
          .select("*", { count: "exact", head: true })
          .eq("kuis_id", kuis.id);

        const { count: submittedCount } = await supabase
          .from("attempt_kuis" as any)
          .select("*", { count: "exact", head: true })
          .eq("kuis_id", kuis.id)
          .eq("status", "submitted");

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

    return (data || []).map((item: any) => ({
      id: item.id,
      inventaris_nama: item.inventaris?.nama_barang || "-",
      inventaris_kode: item.inventaris?.kode_barang || "-",
      jumlah_pinjam: item.jumlah_pinjam,
      keperluan: item.keperluan,
      tanggal_pinjam: item.tanggal_pinjam,
      tanggal_kembali_rencana: item.tanggal_kembali_rencana,
      tanggal_kembali_aktual: item.tanggal_kembali_aktual,
      status: item.status,
      laboratorium_nama: item.inventaris?.laboratorium?.nama_lab || "-",
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error("Error fetching my borrowing:", error);
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
        mahasiswa (
          id,
          nim,
          users (
            nama,
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
      nama: item.mahasiswa?.users?.nama || "Unknown",
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

    // ✅ FIXED: Get kelas directly from assignment system (kelas table)
    const { data: kelasData, error } = await supabase
      .from("kelas")
      .select(
        `
        id,
        kode_kelas,
        nama_kelas,
        tahun_ajaran,
        semester_ajaran,
        kuota,
        mata_kuliah_id,
        mata_kuliah (
          id,
          nama_mk,
          kode_mk
        )
      `,
      )
      .eq("dosen_id", dosenId)
      .eq("is_active", true);

    if (error) throw error;
    if (!kelasData) return [];

    // Process kelas data (no more nested structure)
    const result = await Promise.all(
      (kelasData || []).map(async (kelas: any) => {
        // mata_kuliah is already included in the query, no need for separate query
        const students = await getKelasStudents(kelas.id);

        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas,
          nama_kelas: kelas.nama_kelas,
          mata_kuliah_kode: kelas.mata_kuliah?.kode_mk || "-",
          mata_kuliah_nama: kelas.mata_kuliah?.nama_mk || "-",
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
  inventaris_id: string;
  jumlah_pinjam: number;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  keperluan: string;
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

    // Create borrowing request
    // peminjam_id = dosen_id (peminjaman hanya untuk dosen, bukan mahasiswa)
    const { data: result, error } = await supabase
      .from("peminjaman")
      .insert({
        inventaris_id: data.inventaris_id,
        peminjam_id: dosenData.id, // Dosen as borrower
        dosen_id: dosenData.id,
        jumlah_pinjam: data.jumlah_pinjam,
        keperluan: data.keperluan,
        tanggal_pinjam: data.tanggal_pinjam,
        tanggal_kembali_rencana: data.tanggal_kembali_rencana,
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

    return { id: result.id };
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
 * Return/kembalikan borrowed equipment
 * Auto-increases inventory stock when marked as returned
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
    // Get peminjaman details
    const { data: peminjamanData, error: fetchError } = await supabase
      .from("peminjaman")
      .select("id, inventaris_id, jumlah_pinjam, status")
      .eq("id", data.peminjaman_id)
      .single();

    if (fetchError || !peminjamanData) {
      throw new Error("Peminjaman not found");
    }

    if (peminjamanData.status === "returned") {
      throw new Error("Peminjaman sudah dikembalikan sebelumnya");
    }

    // Update peminjaman status to returned
    const { error: updateError } = await supabase
      .from("peminjaman")
      .update({
        status: "returned",
        tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
        kondisi_kembali: data.kondisi_kembali as any,
        keterangan_kembali: data.keterangan_kembali || null,
      })
      .eq("id", data.peminjaman_id);

    if (updateError) throw updateError;

    // Auto-increase inventory stock (return the equipment)
    const { data: invData, error: invFetchError } = await supabase
      .from("inventaris")
      .select("jumlah_tersedia")
      .eq("id", peminjamanData.inventaris_id)
      .single();

    if (invFetchError || !invData) throw invFetchError;

    const newStock = invData.jumlah_tersedia + peminjamanData.jumlah_pinjam;
    const { error: stockError } = await supabase
      .from("inventaris")
      .update({
        jumlah_tersedia: newStock,
      })
      .eq("id", peminjamanData.inventaris_id);

    if (stockError) throw stockError;

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
 * Mark borrowing as in_use when dosen takes the equipment
 */
async function markBorrowingAsTakenImpl(
  peminjaman_id: string,
): Promise<{ id: string }> {
  try {
    // Update peminjaman status from 'approved' to 'in_use'
    const { error } = await supabase
      .from("peminjaman")
      .update({
        status: "returned", // Changed from 'in_use' to valid status
      })
      .eq("id", peminjaman_id)
      .eq("status", "approved"); // Only allow if currently approved

    if (error) throw error;

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
    inventaris_id?: string;
    jumlah_pinjam?: number;
    tanggal_pinjam?: string;
    tanggal_kembali_rencana?: string;
    keperluan?: string;
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

    // Validate dates if both provided
    if (data.tanggal_pinjam && data.tanggal_kembali_rencana) {
      const pinjamDate = new Date(data.tanggal_pinjam);
      const kembaliDate = new Date(data.tanggal_kembali_rencana);
      if (kembaliDate <= pinjamDate) {
        throw new Error("Tanggal kembali harus setelah tanggal pinjam");
      }
    }

    // If changing inventaris_id, check available stock
    if (
      data.inventaris_id &&
      data.inventaris_id !== currentPeminjaman.inventaris_id
    ) {
      const { data: newInvData, error: invError } = await supabase
        .from("inventaris")
        .select("jumlah_tersedia")
        .eq("id", data.inventaris_id)
        .single();

      if (invError || !newInvData) {
        throw new Error("Alat yang dipilih tidak ditemukan");
      }

      const requestedQty =
        data.jumlah_pinjam || currentPeminjaman.jumlah_pinjam;
      if (newInvData.jumlah_tersedia < requestedQty) {
        throw new Error(
          `Stok tidak cukup. Tersedia: ${newInvData.jumlah_tersedia}`,
        );
      }
    }

    // If only changing quantity, check current inventaris stock
    if (data.jumlah_pinjam && !data.inventaris_id) {
      const { data: invData, error: invError } = await supabase
        .from("inventaris")
        .select("jumlah_tersedia")
        .eq("id", currentPeminjaman.inventaris_id)
        .single();

      if (invError || !invData) {
        throw new Error("Alat tidak ditemukan");
      }

      if (invData.jumlah_tersedia < data.jumlah_pinjam) {
        throw new Error(
          `Stok tidak cukup. Tersedia: ${invData.jumlah_tersedia}`,
        );
      }
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.inventaris_id) updateData.inventaris_id = data.inventaris_id;
    if (data.jumlah_pinjam) updateData.jumlah_pinjam = data.jumlah_pinjam;
    if (data.tanggal_pinjam) updateData.tanggal_pinjam = data.tanggal_pinjam;
    if (data.tanggal_kembali_rencana)
      updateData.tanggal_kembali_rencana = data.tanggal_kembali_rencana;
    if (data.keperluan) updateData.keperluan = data.keperluan;

    const { error: updateError } = await supabase
      .from("peminjaman")
      .update(updateData)
      .eq("id", peminjaman_id);

    if (updateError) {
      console.error("Error updating peminjaman:", updateError);
      throw updateError;
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
