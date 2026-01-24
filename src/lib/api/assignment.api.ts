/**
 * Assignment API - Tracking Dosen Assignments
 *
 * Purpose: Query assignment data from jadwal_praktikum
 * Features:
 * - Admin monitoring: siapa mengajar apa
 * - Assignment tracking dari jadwal praktikum
 * - Statistics dan summary
 *
 * NOTE: Assignment terjadi via jadwal praktikum (dosen pilih mata kuliah + kelas)
 */

import { supabase } from "@/lib/supabase/client";
import { requirePermission } from "@/lib/middleware";
import type {
  DosenAssignmentTracking,
  DosenAssignmentSummary,
  AssignmentStats,
  AssignmentFilters,
  DosenInfo,
  MataKuliahInfo,
  KelasInfo,
} from "@/types/assignment.types";

// ============================================================================
// MAIN QUERY FUNCTIONS
// ============================================================================

/**
 * Get all dosen assignments (from jadwal praktikum)
 * Returns detailed tracking data with filters
 */
async function getAllAssignmentsImpl(
  filters?: AssignmentFilters,
): Promise<DosenAssignmentTracking[]> {
  let query = supabase
    .from("jadwal_praktikum")
    .select(
      `
      id,
      hari,
      jam_mulai,
      jam_selesai,
      tanggal_praktikum,
      minggu_ke,
      topik,
      status,
      is_active,
      created_at,
      updated_at,
      dosen_id,
      mata_kuliah_id,
      laboratorium:laboratorium_id (
        id,
        nama_lab,
        kode_lab
      ),
      kelas:kelas_id (
        id,
        nama_kelas,
        kode_kelas,
        tahun_ajaran,
        semester_ajaran,
        dosen:dosen_id (
          id,
          nip,
          users:user_id (
            id,
            full_name,
            email
          )
        ),
        mata_kuliah:mata_kuliah_id (
          id,
          nama_mk,
          kode_mk,
          sks
        )
      ),
      mata_kuliah:mata_kuliah_id (
        id,
        nama_mk,
        kode_mk,
        sks
      ),
      dosen:dosen_id (
        id,
        nip,
        users:user_id (
          id,
          full_name,
          email
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters?.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (filters?.hari) {
    query = query.eq("hari", filters.hari as any);
  }

  if (filters?.laboratorium_id) {
    query = query.eq("laboratorium_id", filters.laboratorium_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching assignments:", error);
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }

  console.log("🔍 Raw assignment data from DB:", {
    count: data?.length || 0,
    data: data,
    firstRecord: data?.[0],
  });

  if (!data) return [];

  // Transform and filter data
  let assignments: DosenAssignmentTracking[] = data
    .filter((jadwal: any) => {
      console.log("🔍 Processing jadwal:", {
        id: jadwal.id,
        hasKelas: !!jadwal.kelas,
        hasDosen: !!jadwal.dosen,
        hasKelasDosen: !!jadwal.kelas?.dosen,
        dosen_id: jadwal.dosen_id,
        kelas_dosen_id: jadwal.kelas?.dosen?.id,
        kelasData: jadwal.kelas,
        kelas_mata_kuliah: jadwal.kelas?.mata_kuliah,
        kelas_mata_kuliah_id: jadwal.kelas?.mata_kuliah_id,
      });

      // Only include jadwal with complete kelas data
      if (!jadwal.kelas) {
        console.log("❌ Skipping - no kelas");
        return false;
      }

      // Mata kuliah is optional - allow records without mata_kuliah
      if (!jadwal.kelas.mata_kuliah) {
        console.log("⚠️ No mata_kuliah - using placeholder values");
        // Don't skip - continue with placeholder values
      }

      // Get dosen info - allow cases where both jadwal.dosen and kelas.dosen are null
      // (for admin-created schedules where dosen is assigned later)
      const dosenInfo = jadwal.dosen || jadwal.kelas?.dosen;

      // If no dosen info, create a placeholder for admin-managed schedules
      if (!dosenInfo) {
        console.log("⚠️ No dosen info - creating admin placeholder");
        // Don't skip - continue with null dosen info for admin-managed schedules
      }

      // Apply additional filters
      if (filters?.dosen_id) {
        // Check both jadwal.dosen_id and kelas.dosen_id
        if (
          jadwal.dosen_id !== filters.dosen_id &&
          jadwal.kelas?.dosen?.id !== filters.dosen_id
        ) {
          console.log("❌ Skipping - dosen filter mismatch");
          return false;
        }
      }

      if (
        filters?.mata_kuliah_id &&
        jadwal.kelas.mata_kuliah.id !== filters.mata_kuliah_id
      ) {
        console.log("❌ Skipping - mata_kuliah filter mismatch");
        return false;
      }

      if (filters?.kelas_id && jadwal.kelas.id !== filters.kelas_id) {
        console.log("❌ Skipping - kelas filter mismatch");
        return false;
      }

      if (
        filters?.tahun_ajaran &&
        jadwal.kelas.tahun_ajaran !== filters.tahun_ajaran
      ) {
        console.log("❌ Skipping - tahun_ajaran filter mismatch");
        return false;
      }

      if (
        filters?.semester_ajaran !== undefined &&
        jadwal.kelas.semester_ajaran !== filters.semester_ajaran
      ) {
        console.log("❌ Skipping - semester_ajaran filter mismatch");
        return false;
      }

      console.log("✅ Including jadwal:", jadwal.id);
      return true;
    })
    .map((jadwal: any) => ({
      // Jadwal info
      jadwal_id: jadwal.id,
      jadwal_hari: jadwal.hari,
      jadwal_jam_mulai: jadwal.jam_mulai,
      jadwal_jam_selesai: jadwal.jam_selesai,
      jadwal_tanggal: jadwal.tanggal_praktikum,
      jadwal_minggu_ke: jadwal.minggu_ke,
      jadwal_topik: jadwal.topik,
      jadwal_status: jadwal.status,
      jadwal_is_active: jadwal.is_active,

      // Laboratorium info
      laboratorium_id: jadwal.laboratorium?.id || "",
      laboratorium_nama: jadwal.laboratorium?.nama_lab || "",
      laboratorium_kode: jadwal.laboratorium?.kode_lab,

      // Kelas info
      kelas_id: jadwal.kelas.id,
      kelas_nama: jadwal.kelas.nama_kelas,
      kelas_kode: jadwal.kelas.kode_kelas,
      tahun_ajaran: jadwal.kelas.tahun_ajaran,
      semester_ajaran: jadwal.kelas.semester_ajaran,

      // Dosen info - prioritize jadwal.dosen over kelas.dosen
      dosen_id: jadwal.dosen?.id || jadwal.kelas?.dosen?.id || "",
      dosen_name:
        jadwal.dosen?.users?.full_name ||
        jadwal.kelas?.dosen?.users?.full_name ||
        "Belum ada dosen",
      dosen_email:
        jadwal.dosen?.users?.email || jadwal.kelas?.dosen?.users?.email || "",
      dosen_nip: jadwal.dosen?.nip || jadwal.kelas?.dosen?.nip || "-",

      // Mata kuliah info - prioritize mata_kuliah from jadwal (dosen's choice), fallback to kelas
      mata_kuliah_id:
        jadwal.mata_kuliah?.id ||
        jadwal.kelas?.mata_kuliah?.id ||
        jadwal.mata_kuliah_id ||
        "",
      mata_kuliah_nama:
        jadwal.mata_kuliah?.nama_mk ||
        jadwal.kelas?.mata_kuliah?.nama_mk ||
        "Belum ada mata kuliah",
      mata_kuliah_kode:
        jadwal.mata_kuliah?.kode_mk ||
        jadwal.kelas?.mata_kuliah?.kode_mk ||
        "-",
      mata_kuliah_sks:
        jadwal.mata_kuliah?.sks || jadwal.kelas?.mata_kuliah?.sks || 0,

      // Stats (will be populated later)
      mahasiswa_count: 0,

      // Timestamps
      created_at: jadwal.created_at,
      updated_at: jadwal.updated_at,
    }));

  // Get mahasiswa counts for each kelas
  const kelasIds = [...new Set(assignments.map((a) => a.kelas_id))];

  if (kelasIds.length > 0) {
    const { data: mahasiswaData } = await supabase
      .from("kelas_mahasiswa")
      .select("kelas_id")
      .in("kelas_id", kelasIds)
      .eq("is_active", true);

    const mahasiswaCounts = (mahasiswaData || []).reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.kelas_id] = (acc[item.kelas_id] || 0) + 1;
        return acc;
      },
      {},
    );

    assignments = assignments.map((a) => ({
      ...a,
      mahasiswa_count: mahasiswaCounts[a.kelas_id] || 0,
    }));
  }

  // Apply search filter if provided
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    assignments = assignments.filter(
      (a) =>
        a.dosen_name.toLowerCase().includes(searchLower) ||
        a.mata_kuliah_nama.toLowerCase().includes(searchLower) ||
        a.mata_kuliah_kode.toLowerCase().includes(searchLower) ||
        a.kelas_nama.toLowerCase().includes(searchLower),
    );
  }

  console.log("🔍 Final assignments result:", {
    inputCount: data?.length || 0,
    outputCount: assignments.length,
    assignments: assignments,
  });

  return assignments;
}

export const getAllAssignments = requirePermission(
  "manage:kelas",
  getAllAssignmentsImpl,
);

/**
 * Get assignment summary grouped by dosen
 */
async function getAssignmentSummaryImpl(): Promise<DosenAssignmentSummary[]> {
  const assignments = await getAllAssignmentsImpl({ status: "active" });

  // Group by dosen
  const grouped = assignments.reduce(
    (acc: Record<string, DosenAssignmentTracking[]>, assignment) => {
      if (!acc[assignment.dosen_id]) {
        acc[assignment.dosen_id] = [];
      }
      acc[assignment.dosen_id].push(assignment);
      return acc;
    },
    {},
  );

  // Transform to summary
  const summaries: DosenAssignmentSummary[] = Object.entries(grouped).map(
    ([dosenId, assignments]) => {
      const first = assignments[0];
      const uniqueKelas = new Set(assignments.map((a) => a.kelas_id));
      const uniqueMataKuliah = new Set(
        assignments.map((a) => a.mata_kuliah_id),
      );
      const totalMahasiswa = assignments.reduce(
        (sum, a) => sum + a.mahasiswa_count,
        0,
      );

      return {
        dosen_id: dosenId,
        dosen_name: first.dosen_name,
        dosen_email: first.dosen_email,
        dosen_nip: first.dosen_nip,
        total_jadwal: assignments.length,
        total_kelas: uniqueKelas.size,
        total_mata_kuliah: uniqueMataKuliah.size,
        total_mahasiswa: totalMahasiswa,
        assignments: assignments,
      };
    },
  );

  return summaries.sort((a, b) => b.total_jadwal - a.total_jadwal);
}

export const getAssignmentSummary = requirePermission(
  "manage:kelas",
  getAssignmentSummaryImpl,
);

/**
 * Get assignment statistics
 */
async function getAssignmentStatsImpl(): Promise<AssignmentStats> {
  // Get all dosen (assuming all are active since table doesn't have is_active column)
  const { data: dosenData } = await supabase.from("dosen").select("id");

  const totalDosenAktif = dosenData?.length || 0;

  // Get dosen with jadwal - check both jadwal.dosen_id and kelas.dosen_id
  const { data: dosenWithJadwal } = await supabase
    .from("jadwal_praktikum")
    .select("dosen_id, kelas:kelas_id(dosen_id)")
    .eq("is_active", true);

  const dosenIdsWithJadwal = new Set();
  (dosenWithJadwal || []).forEach((j: any) => {
    // Add dosen_id from jadwal if exists
    if (j.dosen_id) {
      dosenIdsWithJadwal.add(j.dosen_id);
    }
    // Add dosen_id from kelas if exists
    if (j.kelas?.dosen_id) {
      dosenIdsWithJadwal.add(j.kelas.dosen_id);
    }
  });

  const dosenDenganJadwal = dosenIdsWithJadwal.size;
  const dosenTanpaJadwal = totalDosenAktif - dosenDenganJadwal;

  // Get all active kelas
  const { data: kelasData } = await supabase
    .from("kelas")
    .select("id")
    .eq("is_active", true);

  const totalKelas = kelasData?.length || 0;

  // Get kelas with jadwal
  const kelasIdsWithJadwal = new Set(
    (dosenWithJadwal || []).map((j: any) => j.kelas_id),
  );

  const kelasDenganJadwal = kelasIdsWithJadwal.size;
  const kelasTanpaJadwal = totalKelas - kelasDenganJadwal;

  // Get total active jadwal
  const { data: jadwalData } = await supabase
    .from("jadwal_praktikum")
    .select("id, kelas:kelas_id(mata_kuliah_id)")
    .eq("is_active", true);

  const totalJadwalAktif = jadwalData?.length || 0;

  const mataKuliahIds = new Set(
    (jadwalData || [])
      .filter((j: any) => j.kelas?.mata_kuliah_id)
      .map((j: any) => j.kelas.mata_kuliah_id),
  );

  const totalMataKuliahDiajarkan = mataKuliahIds.size;

  return {
    total_dosen_aktif: totalDosenAktif,
    dosen_dengan_jadwal: dosenDenganJadwal,
    dosen_tanpa_jadwal: dosenTanpaJadwal,
    total_kelas: totalKelas,
    kelas_dengan_jadwal: kelasDenganJadwal,
    kelas_tanpa_jadwal: kelasTanpaJadwal,
    total_jadwal_aktif: totalJadwalAktif,
    total_mata_kuliah_diajarkan: totalMataKuliahDiajarkan,
  };
}

export const getAssignmentStats = requirePermission(
  "manage:kelas",
  getAssignmentStatsImpl,
);

// ============================================================================
// HELPER FUNCTIONS - Get Dropdown Data
// ============================================================================

/**
 * Get list of dosen for filters
 */
async function getAllDosenImpl(): Promise<DosenInfo[]> {
  const { data, error } = await supabase
    .from("dosen")
    .select(
      `
      id,
      nip,
      users:user_id (
        id,
        full_name,
        email
      )
    `,
    )
    .order("users(full_name)");

  if (error) {
    console.error("Error fetching dosen:", error);
    throw new Error(`Failed to fetch dosen: ${error.message}`);
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    user_id: d.users?.id || "",
    full_name: d.users?.full_name || "",
    email: d.users?.email || "",
    nip: d.nip,
    is_active: true, // Assuming all dosen are active since table doesn't have is_active column
  }));
}

export const getAllDosen = requirePermission("manage:kelas", getAllDosenImpl);

/**
 * Get list of mata kuliah for filters
 */
async function getAllMataKuliahImpl(): Promise<MataKuliahInfo[]> {
  const { data, error } = await supabase
    .from("mata_kuliah")
    .select("id, nama_mk, kode_mk, sks, is_active")
    .eq("is_active", true)
    .order("kode_mk");

  if (error) {
    console.error("Error fetching mata kuliah:", error);
    throw new Error(`Failed to fetch mata kuliah: ${error.message}`);
  }

  return data || [];
}

export const getAllMataKuliah = requirePermission(
  "manage:kelas",
  getAllMataKuliahImpl,
);

/**
 * Get list of kelas for filters
 */
async function getAllKelasForFilterImpl(): Promise<KelasInfo[]> {
  const { data, error } = await supabase
    .from("kelas")
    .select(
      "id, nama_kelas, kode_kelas, tahun_ajaran, semester_ajaran, is_active",
    )
    .eq("is_active", true)
    .order("tahun_ajaran", { ascending: false })
    .order("semester_ajaran", { ascending: false })
    .order("nama_kelas");

  if (error) {
    console.error("Error fetching kelas:", error);
    throw new Error(`Failed to fetch kelas: ${error.message}`);
  }

  return data || [];
}

export const getAllKelasForFilter = requirePermission(
  "manage:kelas",
  getAllKelasForFilterImpl,
);

// ============================================================================
// ACADEMIC ASSIGNMENT FUNCTIONS (FROM JADWAL PRAKTIKUM, HIDE PRAKTIKUM DETAILS)
// ============================================================================

/**
 * Get academic assignments from kelas table
 * Shows dosen + mata kuliah + kelas assignments directly
 */
async function getAcademicAssignmentsImpl(filters?: {
  dosen_id?: string;
  mata_kuliah_id?: string;
  kelas_id?: string;
  tahun_ajaran?: string;
  semester_ajaran?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
}): Promise<DosenAssignmentTracking[]> {
  // Get assignments directly from kelas table
  const query = supabase
    .from("kelas")
    .select(
      `
      id,
      nama_kelas,
      kode_kelas,
      tahun_ajaran,
      semester_ajaran,
      is_active,
      dosen_id,
      mata_kuliah_id,
      catatan,
      created_at,
      updated_at,
      mata_kuliah:mata_kuliah_id (
        id,
        nama_mk,
        kode_mk,
        sks
      ),
      dosen:dosen_id (
        id,
        nip,
        users:user_id (
          id,
          full_name,
          email
        )
      )
    `,
    )
    .order("tahun_ajaran", { ascending: false })
    .order("semester_ajaran", { ascending: false })
    .order("nama_kelas") as any;

  // Apply filters
  let typedQuery: any = query;
  if (filters?.dosen_id) {
    typedQuery = typedQuery.eq("dosen_id", filters.dosen_id);
  }

  if (filters?.mata_kuliah_id) {
    typedQuery = typedQuery.eq("mata_kuliah_id", filters.mata_kuliah_id);
  }

  if (filters?.kelas_id) {
    typedQuery = typedQuery.eq("kelas_id", filters.kelas_id);
  }

  if (filters?.status && filters.status !== "all") {
    typedQuery = typedQuery.eq("is_active", filters.status === "active");
  }

  const { data, error } = await typedQuery;

  if (error) {
    console.error("Error fetching academic assignments:", error);
    throw new Error(`Failed to fetch academic assignments: ${error.message}`);
  }

  if (!data) return [];

  // Create unique assignments by dosen + mata_kuliah + kelas combination
  // This prevents showing duplicate assignments when dosen has multiple jadwal for same kelas/mk
  const uniqueAssignments = new Map();

  data.forEach((jadwal: any) => {
    if (!jadwal.kelas) return; // Skip if no kelas data

    const key = `${jadwal.dosen_id || "no-dosen"}-${jadwal.mata_kuliah_id || "no-mk"}-${jadwal.kelas_id}`;

    if (!uniqueAssignments.has(key)) {
      uniqueAssignments.set(key, {
        // Use first jadwal info for this assignment
        jadwal_id: jadwal.id,
        jadwal_hari: null, // Hide jadwal details
        jadwal_jam_mulai: null,
        jadwal_jam_selesai: null,
        jadwal_tanggal: null,
        jadwal_minggu_ke: null,
        jadwal_topik: null,
        jadwal_status: "assigned",
        jadwal_is_active: jadwal.is_active,

        // Laboratorium info (hidden)
        laboratorium_id: "",
        laboratorium_nama: "-",
        laboratorium_kode: "-",

        // Kelas info from jadwal
        kelas_id: jadwal.kelas.id,
        kelas_nama: jadwal.kelas.nama_kelas,
        kelas_kode: jadwal.kelas.kode_kelas,
        tahun_ajaran: jadwal.kelas.tahun_ajaran,
        semester_ajaran: jadwal.kelas.semester_ajaran,

        // Dosen info from jadwal or kelas
        dosen_id: jadwal.dosen?.id || jadwal.kelas?.dosen?.id || "",
        dosen_name:
          jadwal.dosen?.users?.full_name ||
          jadwal.kelas?.dosen?.users?.full_name ||
          "Belum ada dosen",
        dosen_email:
          jadwal.dosen?.users?.email || jadwal.kelas?.dosen?.users?.email || "",
        dosen_nip: jadwal.dosen?.nip || jadwal.kelas?.dosen?.nip || "-",

        // Mata kuliah info from jadwal or kelas
        mata_kuliah_id:
          jadwal.mata_kuliah?.id || jadwal.kelas?.mata_kuliah?.id || "",
        mata_kuliah_nama:
          jadwal.mata_kuliah?.nama_mk ||
          jadwal.kelas?.mata_kuliah?.nama_mk ||
          "Belum ada mata kuliah",
        mata_kuliah_kode:
          jadwal.mata_kuliah?.kode_mk ||
          jadwal.kelas?.mata_kuliah?.kode_mk ||
          "-",
        mata_kuliah_sks:
          jadwal.mata_kuliah?.sks || jadwal.kelas?.mata_kuliah?.sks || 0,

        // Stats
        mahasiswa_count: 0,

        // Timestamps
        created_at: jadwal.created_at,
        updated_at: jadwal.updated_at,
      });
    }
  });

  // Transform data to DosenAssignmentTracking format
  let assignments: DosenAssignmentTracking[] = data.map((kelas: any) => ({
    // Using kelas.id as identifier
    jadwal_id: kelas.id,
    jadwal_hari: null, // Not applicable for academic assignment
    jadwal_jam_mulai: null,
    jadwal_jam_selesai: null,
    jadwal_tanggal: null,
    jadwal_minggu_ke: null,
    jadwal_topik: null,
    jadwal_status: "assigned", // Static status for academic assignment
    jadwal_is_active: kelas.is_active,

    // Laboratorium info (not applicable)
    laboratorium_id: "",
    laboratorium_nama: "-",
    laboratorium_kode: "-",

    // Kelas info
    kelas_id: kelas.id,
    kelas_nama: kelas.nama_kelas,
    kelas_kode: kelas.kode_kelas,
    tahun_ajaran: kelas.tahun_ajaran,
    semester_ajaran: kelas.semester_ajaran,

    // Dosen info
    dosen_id: kelas.dosen?.id || "",
    dosen_name: kelas.dosen?.users?.full_name || "Belum ada dosen",
    dosen_email: kelas.dosen?.users?.email || "",
    dosen_nip: kelas.dosen?.nip || "-",

    // Mata kuliah info
    mata_kuliah_id: kelas.mata_kuliah?.id || "",
    mata_kuliah_nama: kelas.mata_kuliah?.nama_mk || "Belum ada mata kuliah",
    mata_kuliah_kode: kelas.mata_kuliah?.kode_mk || "-",
    mata_kuliah_sks: kelas.mata_kuliah?.sks || 0,

    // Stats
    mahasiswa_count: 0,

    // Timestamps
    created_at: kelas.created_at,
    updated_at: kelas.updated_at,
  }));

  // Apply filters
  if (filters?.dosen_id) {
    assignments = assignments.filter((a) => a.dosen_id === filters.dosen_id);
  }

  if (filters?.mata_kuliah_id) {
    assignments = assignments.filter(
      (a) => a.mata_kuliah_id === filters.mata_kuliah_id,
    );
  }

  if (filters?.kelas_id) {
    assignments = assignments.filter((a) => a.kelas_id === filters.kelas_id);
  }

  if (filters?.tahun_ajaran) {
    assignments = assignments.filter(
      (a) => a.tahun_ajaran === filters.tahun_ajaran,
    );
  }

  if (filters?.semester_ajaran !== undefined) {
    assignments = assignments.filter(
      (a) => a.semester_ajaran === filters.semester_ajaran,
    );
  }

  // Apply status filter
  if (filters?.status && filters.status !== "all") {
    assignments = assignments.filter((a) =>
      filters.status === "active" ? a.jadwal_is_active : !a.jadwal_is_active,
    );
  }

  // Apply search filter if provided
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    assignments = assignments.filter(
      (a) =>
        a.dosen_name.toLowerCase().includes(searchLower) ||
        a.mata_kuliah_nama.toLowerCase().includes(searchLower) ||
        a.mata_kuliah_kode.toLowerCase().includes(searchLower) ||
        a.kelas_nama.toLowerCase().includes(searchLower) ||
        a.kelas_kode.toLowerCase().includes(searchLower),
    );
  }

  return assignments;
}

export const getAcademicAssignments = requirePermission(
  "manage:kelas",
  getAcademicAssignmentsImpl,
);

/**
 * Get academic assignment statistics
 */
async function getAcademicAssignmentStatsImpl(): Promise<AssignmentStats> {
  const { data: kelasData } = await supabase
    .from("kelas")
    .select("dosen_id, mata_kuliah_id, is_active")
    .eq("is_active", true);

  const { data: dosenData } = await supabase.from("dosen").select("id");

  const totalDosenAktif = dosenData?.length || 0;

  const kelas = kelasData || [];
  const totalKelas = kelas.length;
  const kelasDenganDosen = kelas.filter((k) => k.dosen_id).length;
  const kelasDenganMataKuliah = kelas.filter((k) => k.mata_kuliah_id).length;

  const uniqueDosenIds = new Set(
    kelas.filter((k) => k.dosen_id).map((k) => k.dosen_id),
  );
  const uniqueMataKuliahIds = new Set(
    kelas.filter((k) => k.mata_kuliah_id).map((k) => k.mata_kuliah_id),
  );

  return {
    total_dosen_aktif: totalDosenAktif,
    dosen_dengan_jadwal: uniqueDosenIds.size, // Using available data
    dosen_tanpa_jadwal: totalDosenAktif - uniqueDosenIds.size,
    total_kelas: totalKelas,
    kelas_dengan_jadwal: kelasDenganDosen,
    kelas_tanpa_jadwal: totalKelas - kelasDenganDosen,
    total_jadwal_aktif: kelasDenganDosen, // Using kelas dengan dosen as proxy
    total_mata_kuliah_diajarkan: uniqueMataKuliahIds.size,
  };
}

export const getAcademicAssignmentStats = requirePermission(
  "manage:kelas",
  getAcademicAssignmentStatsImpl,
);

// ============================================================================
// CRUD FUNCTIONS FOR ACADEMIC ASSIGNMENTS
// ============================================================================

/**
 * Create new academic assignment (dosen + mata kuliah + kelas)
 * Updates kelas table directly with dosen and mata kuliah assignment
 */
async function createAcademicAssignmentImpl(data: {
  dosen_id: string;
  mata_kuliah_id: string;
  kelas_id: string;
  catatan?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Update kelas with dosen and mata kuliah assignment
    const { error } = await supabase
      .from("kelas")
      .update({
        dosen_id: data.dosen_id,
        mata_kuliah_id: data.mata_kuliah_id,
        catatan: data.catatan || "Ditambahkan sebagai assignment akademik",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.kelas_id);

    if (error) {
      console.error("Error creating academic assignment:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error creating academic assignment:", error);
    return { success: false, error: error.message };
  }
}

export const createAcademicAssignment = requirePermission(
  "manage:kelas",
  createAcademicAssignmentImpl,
);

/**
 * Update academic assignment
 */
async function updateAcademicAssignmentImpl(
  kelasId: string,
  data: {
    dosen_id?: string;
    mata_kuliah_id?: string;
    kelas_id?: string;
    catatan?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.dosen_id) updateData.dosen_id = data.dosen_id;
    if (data.mata_kuliah_id) updateData.mata_kuliah_id = data.mata_kuliah_id;
    if (data.catatan !== undefined) updateData.catatan = data.catatan;

    const { error } = await supabase
      .from("kelas")
      .update(updateData)
      .eq("id", kelasId);

    if (error) {
      console.error("Error updating academic assignment:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating academic assignment:", error);
    return { success: false, error: error.message };
  }
}

export const updateAcademicAssignment = requirePermission(
  "manage:kelas",
  updateAcademicAssignmentImpl,
);

/**
 * Clear academic assignment (remove dosen and mata kuliah from kelas)
 */
async function clearAcademicAssignmentImpl(
  kelasId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("kelas")
      .update({
        dosen_id: null,
        mata_kuliah_id: null,
        catatan: "Assignment dihapus oleh admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", kelasId);

    if (error) {
      console.error("Error clearing academic assignment:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error clearing academic assignment:", error);
    return { success: false, error: error.message };
  }
}

export const clearAcademicAssignment = requirePermission(
  "manage:kelas",
  clearAcademicAssignmentImpl,
);

/**
 * Toggle kelas status (active/inactive)
 */
async function toggleKelasStatusImpl(
  kelasId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("kelas")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", kelasId);

    if (error) {
      console.error("Error toggling kelas status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling kelas status:", error);
    return { success: false, error: error.message };
  }
}

export const toggleKelasStatus = requirePermission(
  "manage:kelas",
  toggleKelasStatusImpl,
);
