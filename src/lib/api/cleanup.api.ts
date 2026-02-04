/**
 * Cleanup API - Hapus data tugas praktikum/kuis dari database
 *
 * ⚠️ PERHATIAN: Fungsi ini akan menghapus data kuis!
 * Gunakan dengan hati-hati dan hanya untuk testing/cleanup
 */

import { supabase } from "@/lib/supabase/client";
import { clearAllCacheSync } from "@/lib/offline/api-cache";

/**
 * Hapus SEMUA kuis (essay dan pilihan_ganda)
 * Urutan penghapusan: jawaban → attempt_kuis → soal → kuis
 */
export async function cleanupAllKuisData(): Promise<{
  success: boolean;
  deleted: {
    jawaban: number;
    attempt_kuis: number;
    soal: number;
    kuis: number;
  };
  error?: string;
}> {
  try {
    console.log("🧹 Starting cleanup of ALL kuis data...");

    let deletedJawaban = 0;
    let deletedAttempts = 0;
    let deletedSoal = 0;
    let deletedKuis = 0;

    // 1. Hapus semua jawaban
    const { count: jawabanCount, error: jawabanError } = await supabase
      .from("jawaban")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (jawabanError && !jawabanError.message.includes("contains no rows")) {
      throw new Error(`Gagal menghapus jawaban: ${jawabanError.message}`);
    }
    deletedJawaban = jawabanCount || 0;
    console.log(`✅ Deleted ${deletedJawaban} jawaban`);

    // 2. Hapus semua attempt_kuis
    const { count: attemptCount, error: attemptError } = await supabase
      .from("attempt_kuis")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (attemptError && !attemptError.message.includes("contains no rows")) {
      throw new Error(`Gagal menghapus attempt_kuis: ${attemptError.message}`);
    }
    deletedAttempts = attemptCount || 0;
    console.log(`✅ Deleted ${deletedAttempts} attempt_kuis`);

    // 3. Hapus semua soal
    const { count: soalCount, error: soalError } = await supabase
      .from("soal")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (soalError && !soalError.message.includes("contains no rows")) {
      throw new Error(`Gagal menghapus soal: ${soalError.message}`);
    }
    deletedSoal = soalCount || 0;
    console.log(`✅ Deleted ${deletedSoal} soal`);

    // 4. Hapus semua kuis
    const { count: kuisCount, error: kuisError } = await supabase
      .from("kuis")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (kuisError && !kuisError.message.includes("contains no rows")) {
      throw new Error(`Gagal menghapus kuis: ${kuisError.message}`);
    }
    deletedKuis = kuisCount || 0;
    console.log(`✅ Deleted ${deletedKuis} kuis`);

    // 5. Clear semua cache
    const cacheCleared = await clearAllCacheSync();
    console.log(`✅ Cleared ${cacheCleared} cache entries`);

    console.log("🎉 Cleanup completed!");

    return {
      success: true,
      deleted: {
        jawaban: deletedJawaban,
        attempt_kuis: deletedAttempts,
        soal: deletedSoal,
        kuis: deletedKuis,
      },
    };
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return {
      success: false,
      deleted: {
        jawaban: 0,
        attempt_kuis: 0,
        soal: 0,
        kuis: 0,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Hapus HANYA tugas praktikum (tipe_kuis = 'essay')
 * Kuis pilihan_ganda TIDAK akan dihapus
 */
export async function cleanupTugasPraktikumOnly(): Promise<{
  success: boolean;
  deleted: {
    jawaban: number;
    attempt_kuis: number;
    soal: number;
    kuis: number;
  };
  error?: string;
}> {
  try {
    console.log("🧹 Starting cleanup of TUGAS PRAKTIKUM (essay) only...");

    // 1. Ambil semua ID kuis essay
    const { data: kuisEssay, error: fetchError } = await supabase
      .from("kuis")
      .select("id")
      .eq("tipe_kuis", "essay");

    if (fetchError) {
      throw new Error(`Gagal mengambil data kuis essay: ${fetchError.message}`);
    }

    const kuisIds = kuisEssay?.map((k) => k.id) || [];

    if (kuisIds.length === 0) {
      console.log("ℹ️ No essay kuis found, nothing to cleanup");
      return {
        success: true,
        deleted: {
          jawaban: 0,
          attempt_kuis: 0,
          soal: 0,
          kuis: 0,
        },
      };
    }

    console.log(`Found ${kuisIds.length} essay kuis to cleanup`);

    let deletedJawaban = 0;
    let deletedAttempts = 0;
    let deletedSoal = 0;
    let deletedKuis = 0;

    // 2. Hapus jawaban dari attempt kuis essay
    const { data: attempts } = await supabase
      .from("attempt_kuis")
      .select("id")
      .in("kuis_id", kuisIds);

    const attemptIds = attempts?.map((a) => a.id) || [];

    if (attemptIds.length > 0) {
      const { count: jawabanCount, error: jawabanError } = await supabase
        .from("jawaban")
        .delete({ count: "exact" })
        .in("attempt_id", attemptIds);

      if (jawabanError && !jawabanError.message.includes("contains no rows")) {
        throw new Error(`Gagal menghapus jawaban: ${jawabanError.message}`);
      }
      deletedJawaban = jawabanCount || 0;
      console.log(`✅ Deleted ${deletedJawaban} jawaban`);
    }

    // 3. Hapus attempt_kuis untuk kuis essay
    const { count: attemptCount, error: attemptError } = await supabase
      .from("attempt_kuis")
      .delete({ count: "exact" })
      .in("kuis_id", kuisIds);

    if (attemptError && !attemptError.message.includes("contains no rows")) {
      throw new Error(`Gagal menghapus attempt_kuis: ${attemptError.message}`);
    }
    deletedAttempts = attemptCount || 0;
    console.log(`✅ Deleted ${deletedAttempts} attempt_kuis`);

    // 4. Hapus soal untuk kuis essay
    const { count: soalCount, error: soalError } = await supabase
      .from("soal")
      .delete({ count: "exact" })
      .in("kuis_id", kuisIds);

    if (soalError && !soalError.message.includes("contains no rows")) {
      throw new Error(`Gagal menghapus soal: ${soalError.message}`);
    }
    deletedSoal = soalCount || 0;
    console.log(`✅ Deleted ${deletedSoal} soal`);

    // 5. Hapus kuis essay
    const { count: kuisCount, error: kuisError } = await supabase
      .from("kuis")
      .delete({ count: "exact" })
      .eq("tipe_kuis", "essay");

    if (kuisError && !kuisError.message.includes("contains no rows")) {
      throw new Error(`Gagal menghapus kuis essay: ${kuisError.message}`);
    }
    deletedKuis = kuisCount || 0;
    console.log(`✅ Deleted ${deletedKuis} kuis essay`);

    // 6. Clear cache
    const cacheCleared = await clearAllCacheSync();
    console.log(`✅ Cleared ${cacheCleared} cache entries`);

    console.log("🎉 Tugas praktikum cleanup completed!");

    return {
      success: true,
      deleted: {
        jawaban: deletedJawaban,
        attempt_kuis: deletedAttempts,
        soal: deletedSoal,
        kuis: deletedKuis,
      },
    };
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return {
      success: false,
      deleted: {
        jawaban: 0,
        attempt_kuis: 0,
        soal: 0,
        kuis: 0,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verifikasi jumlah data saat ini
 */
export async function verifyKuisDataCounts(): Promise<{
  jawaban: number;
  attempt_kuis: number;
  soal: number;
  kuis: number;
  kuis_essay: number;
  kuis_pilihan_ganda: number;
}> {
  const [jawabanResult, attemptResult, soalResult, kuisResult, essayResult, pgResult] =
    await Promise.all([
      supabase.from("jawaban").select("*", { count: "exact", head: true }),
      supabase.from("attempt_kuis").select("*", { count: "exact", head: true }),
      supabase.from("soal").select("*", { count: "exact", head: true }),
      supabase.from("kuis").select("*", { count: "exact", head: true }),
      supabase
        .from("kuis")
        .select("*", { count: "exact", head: true })
        .eq("tipe_kuis", "essay"),
      supabase
        .from("kuis")
        .select("*", { count: "exact", head: true })
        .eq("tipe_kuis", "pilihan_ganda"),
    ]);

  return {
    jawaban: jawabanResult.count || 0,
    attempt_kuis: attemptResult.count || 0,
    soal: soalResult.count || 0,
    kuis: kuisResult.count || 0,
    kuis_essay: essayResult.count || 0,
    kuis_pilihan_ganda: pgResult.count || 0,
  };
}
