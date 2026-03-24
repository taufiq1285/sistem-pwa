/**
 * Cleanup Page - Admin page untuk membersihkan database
 *
 * ⚠️ PERINGATAN: Halaman ini akan menghapus data kuis!
 * Hanya gunakan untuk testing/debugging
 */

import { useState } from "react";
import {
  cleanupAllKuisData,
  cleanupTugasPraktikumOnly,
  verifyKuisDataCounts,
} from "@/lib/api/cleanup.api";

export default function CleanupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    deleted: {
      jawaban: number;
      attempt_kuis: number;
      soal: number;
      kuis: number;
    };
    mode?: "all" | "tugas-praktikum";
    error?: string;
  } | null>(null);
  const [currentCounts, setCurrentCounts] = useState<{
    jawaban: number;
    attempt_kuis: number;
    soal: number;
    kuis: number;
    kuis_essay: number;
    kuis_pilihan_ganda: number;
  } | null>(null);

  const handleVerify = async () => {
    try {
      const counts = await verifyKuisDataCounts();
      setCurrentCounts(counts);
      console.log("📊 Current data counts:", counts);
    } catch (error) {
      console.error("❌ Verify error:", error);
      alert("Gagal memverifikasi data: " + (error as Error).message);
    }
  };

  const handleCleanupAll = async () => {
    // Konfirmasi dengan password/pin
    const confirmation = prompt(
      '⚠️ PERINGATAN: Ini akan menghapus SEMUA data kuis (essay & pilihan_ganda)!\n\nKetik "HAPUS SEMUA" untuk melanjutkan:',
    );

    if (confirmation !== "HAPUS SEMUA") {
      alert("❌ Dibatalkan. Konfirmasi tidak valid.");
      return;
    }

    // Double confirmation
    const doubleConfirm = confirm(
      "⚠️ KONFIRMASI TERAKHIR:\n\n" +
        "Anda akan MENGHAPUS PERMANEN:\n" +
        "- SEMUA kuis (essay & pilihan_ganda)\n" +
        "- Semua soal\n" +
        "- Semua attempt mahasiswa\n" +
        "- Semua jawaban mahasiswa\n" +
        "- Semua nilai yang sudah diberikan\n\n" +
        "Data TIDAK BISA dikembalikan!\n\n" +
        "Lanjutkan?",
    );

    if (!doubleConfirm) {
      alert("❌ Dibatalkan.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const cleanupResult = await cleanupAllKuisData();
      setResult({ ...cleanupResult, mode: "all" });

      if (cleanupResult.success) {
        alert(
          `✅ Cleanup berhasil!\n\n` +
            `Dihapus:\n` +
            `- ${cleanupResult.deleted.kuis} kuis\n` +
            `- ${cleanupResult.deleted.soal} soal\n` +
            `- ${cleanupResult.deleted.attempt_kuis} attempt\n` +
            `- ${cleanupResult.deleted.jawaban} jawaban\n\n` +
            `Cache juga sudah dibersihkan.`,
        );

        // Refresh current counts
        await handleVerify();
      } else {
        alert(`❌ Cleanup gagal: ${cleanupResult.error}`);
      }
    } catch (error) {
      console.error("❌ Cleanup error:", error);
      alert("Gagal melakukan cleanup: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupTugasPraktikum = async () => {
    // Konfirmasi
    const confirmation = prompt(
      '⚠️ PERINGATAN: Ini akan menghapus HANYA tugas praktikum (essay)!\n\nKetik "HAPUS TUGAS" untuk melanjutkan:',
    );

    if (confirmation !== "HAPUS TUGAS") {
      alert("❌ Dibatalkan. Konfirmasi tidak valid.");
      return;
    }

    // Double confirmation
    const doubleConfirm = confirm(
      "⚠️ KONFIRMASI TERAKHIR:\n\n" +
        "Anda akan MENGHAPUS PERMANEN:\n" +
        "- Hanya kuis ESSAY (tugas praktikum)\n" +
        "- Semua soal essay\n" +
        "- Semua attempt ke tugas praktikum\n" +
        "- Semua jawaban tugas praktikum\n" +
        "- Semua nilai tugas praktikum\n\n" +
        "Kuis PILIHAN GANDA TIDAK akan dihapus.\n\n" +
        "Data TIDAK BISA dikembalikan!\n\n" +
        "Lanjutkan?",
    );

    if (!doubleConfirm) {
      alert("❌ Dibatalkan.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const cleanupResult = await cleanupTugasPraktikumOnly();
      setResult({ ...cleanupResult, mode: "tugas-praktikum" });

      if (cleanupResult.success) {
        alert(
          `✅ Cleanup berhasil!\n\n` +
            `Dihapus:\n` +
            `- ${cleanupResult.deleted.kuis} kuis essay\n` +
            `- ${cleanupResult.deleted.soal} soal essay\n` +
            `- ${cleanupResult.deleted.attempt_kuis} attempt\n` +
            `- ${cleanupResult.deleted.jawaban} jawaban\n\n` +
            `Kuis pilihan_ganda TIDAK dihapus.\n` +
            `Cache juga sudah dibersihkan.`,
        );

        // Refresh current counts
        await handleVerify();
      } else {
        alert(`❌ Cleanup gagal: ${cleanupResult.error}`);
      }
    } catch (error) {
      console.error("❌ Cleanup error:", error);
      alert("Gagal melakukan cleanup: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Warning */}
        <div className="bg-danger/5 border border-danger/30 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-danger mb-2">
            ⚠️ Cleanup Database - Hapus Data Kuis
          </h1>
          <p className="text-danger/80">
            Halaman ini akan menghapus PERMANEN data kuis dari database. Gunakan
            dengan hati-hati!
          </p>
        </div>

        {/* Current Counts */}
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">📊 Data Saat Ini</h2>

          {currentCounts ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-warning/5 p-4 rounded border border-warning/30">
                  <div className="text-2xl font-bold text-warning">
                    {currentCounts.kuis_essay}
                  </div>
                  <div className="text-sm text-warning/80">
                    Kuis Essay (Tugas Praktikum)
                  </div>
                </div>
                <div className="bg-primary/5 p-4 rounded border border-primary/30">
                  <div className="text-2xl font-bold text-primary">
                    {currentCounts.kuis_pilihan_ganda}
                  </div>
                  <div className="text-sm text-primary/80">
                    Kuis Pilihan Ganda
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-success/5 p-4 rounded">
                  <div className="text-2xl font-bold text-success">
                    {currentCounts.soal}
                  </div>
                  <div className="text-sm text-success/80">Soal</div>
                </div>
                <div className="bg-warning/5 p-4 rounded">
                  <div className="text-2xl font-bold text-warning">
                    {currentCounts.attempt_kuis}
                  </div>
                  <div className="text-sm text-warning/80">Attempt</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              Klik tombol "Cek Data" untuk melihat jumlah data saat ini
            </p>
          )}

          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 Cek Data
          </button>
        </div>

        {/* Cleanup Actions - Tugas Praktikum Only */}
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-warning">
            🗑️ Hapus Tugas Praktikum (Essay) Saja
          </h2>

          <div className="space-y-4">
            <div className="bg-warning/5 border-l-4 border-warning p-4">
              <p className="text-warning font-medium">Yang akan dihapus:</p>
              <ul className="list-disc list-inside text-warning/80 text-sm mt-2">
                <li>Hanya kuis ESSAY (tugas praktikum)</li>
                <li>Semua soal essay</li>
                <li>Semua attempt ke tugas praktikum</li>
                <li>Semua jawaban tugas praktikum</li>
                <li>Semua nilai tugas praktikum</li>
              </ul>
              <p className="text-warning font-medium mt-3">
                ✅ Kuis pilihan ganda TIDAK akan dihapus
              </p>
            </div>

            <button
              onClick={handleCleanupTugasPraktikum}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-warning text-warning-foreground rounded-lg font-semibold hover:bg-warning/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "⏳ Menghapus..." : "🗑️ Hapus Tugas Praktikum Saja"}
            </button>
          </div>
        </div>

        {/* Cleanup Actions - All */}
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-danger">
            ⚠️ Hapus SEMUA Data Kuis
          </h2>

          <div className="space-y-4">
            <div className="bg-danger/5 border-l-4 border-danger p-4">
              <p className="text-danger font-medium">Yang akan dihapus:</p>
              <ul className="list-disc list-inside text-danger/80 text-sm mt-2">
                <li>SEMUA kuis (essay & pilihan_ganda)</li>
                <li>Semua soal</li>
                <li>Semua attempt mahasiswa</li>
                <li>Semua jawaban yang sudah disubmit</li>
                <li>Semua nilai yang sudah diberikan dosen</li>
              </ul>
            </div>

            <button
              onClick={handleCleanupAll}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-danger text-danger-foreground rounded-lg font-semibold hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "⏳ Menghapus..." : "⚠️ Hapus SEMUA Data Kuis"}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`border rounded-lg p-6 shadow-sm ${
              result.success
                ? "bg-success/5 border-success/30"
                : "bg-danger/5 border-danger/30"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 ${
                result.success ? "text-success" : "text-danger"
              }`}
            >
              {result.success ? "✅ Cleanup Berhasil" : "❌ Cleanup Gagal"}
            </h2>

            {result.success && (
              <div className="space-y-2">
                <p className="text-success">
                  <strong>{result.deleted.kuis}</strong> kuis dihapus
                  {result.mode === "tugas-praktikum" && " (essay saja)"}
                </p>
                <p className="text-success">
                  <strong>{result.deleted.soal}</strong> soal dihapus
                </p>
                <p className="text-success">
                  <strong>{result.deleted.attempt_kuis}</strong> attempt dihapus
                </p>
                <p className="text-success">
                  <strong>{result.deleted.jawaban}</strong> jawaban dihapus
                </p>
                <p className="text-success text-sm mt-4">
                  ✨ Cache juga sudah dibersihkan. Refresh halaman untuk melihat
                  perubahan.
                </p>
              </div>
            )}

            {!result.success && result.error && (
              <p className="text-danger">Error: {result.error}</p>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-muted/60 border rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">
            💡 <strong>Tips:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Pilih "Hapus Tugas Praktikum Saja" untuk hanya membersihkan data
              tugas praktikum (essay)
            </li>
            <li>Kuis pilihan ganda akan tetap ada jika memilih opsi di atas</li>
            <li>
              Gunakan "Hapus SEMUA Data Kuis" hanya untuk benar-benar
              membersihkan semua data
            </li>
            <li>Data yang dihapus TIDAK BISA dikembalikan</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
