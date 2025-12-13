/**
 * Database Structure Checker
 * Script untuk mengecek struktur database Supabase
 *
 * Usage:
 * 1. Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env atau .env.local
 * 2. Run: npx tsx scripts/check-database-structure.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { config } from "dotenv";
import { join } from "path";

// Load from .env.local first, then .env
config({ path: join(process.cwd(), ".env.local") });
if (!process.env.VITE_SUPABASE_URL) {
  config({ path: join(process.cwd(), ".env") });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diset!"
  );
  console.log("\nBuat file .env dengan isi:");
  console.log("VITE_SUPABASE_URL=https://your-project.supabase.co");
  console.log("VITE_SUPABASE_ANON_KEY=your-anon-key");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName as any)
      .select("*")
      .limit(1);
    return !error || !error.message.includes("does not exist");
  } catch {
    return false;
  }
}

async function checkTableStructure(tableName: string) {
  const { data, error, count } = await supabase
    .from(tableName as any)
    .select("*", { count: "exact", head: false })
    .limit(1);

  if (error) {
    return {
      exists: false,
      error: error.message,
      count: 0,
      sample: null,
      columns: [],
    };
  }

  return {
    exists: true,
    count: count || 0,
    columns: data && data.length > 0 ? Object.keys(data[0]) : [],
    sample: data && data.length > 0 ? data[0] : null,
  };
}

async function checkRLSEnabled(tableName: string) {
  try {
    // Attempt to query without auth - if RLS is enabled, should return empty or error
    const { error } = await supabase
      .from(tableName as any)
      .select("id")
      .limit(1);
    return {
      enabled: true,
      note: error
        ? "RLS aktif (ada error saat query tanpa auth)"
        : "RLS mungkin aktif",
    };
  } catch {
    return { enabled: true, note: "RLS aktif" };
  }
}

// ============================================================================
// MAIN CHECK
// ============================================================================

async function main() {
  console.log("🔍 CHECKING SUPABASE DATABASE STRUCTURE\n");
  console.log(`📍 URL: ${supabaseUrl}\n`);
  console.log("=".repeat(80));

  const tables = [
    // Core tables
    "users",
    "mahasiswa",
    "dosen",
    "admin",

    // Academic tables
    "mata_kuliah",
    "kelas",
    "kelas_mahasiswa",

    // Lab & Schedule tables
    "laboratorium",
    "jadwal",
    "kehadiran",

    // Quiz tables
    "kuis",
    "soal_kuis",
    "attempt_kuis",
    "jawaban_kuis",

    // Equipment tables
    "inventaris",
    "kategori_inventaris",
    "peminjaman",

    // Assessment tables
    "penilaian",
    "komponen_nilai",
    "nilai_mahasiswa",

    // Notification table
    "notifikasi",
  ];

  const results = {
    existing: [] as string[],
    missing: [] as string[],
    errors: [] as { table: string; error: string }[],
  };

  for (const table of tables) {
    process.stdout.write(`\n📋 Checking ${table}... `);

    const result = await checkTableStructure(table);

    if (result.exists) {
      console.log(
        `✅ EXISTS (${result.count} rows, ${result.columns.length} columns)`
      );
      results.existing.push(table);

      // Show columns
      if (result.columns.length > 0) {
        console.log(
          `   Columns: ${result.columns.slice(0, 10).join(", ")}${result.columns.length > 10 ? "..." : ""}`
        );
      }
    } else {
      console.log(`❌ MISSING or ERROR`);
      results.missing.push(table);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
        results.errors.push({ table, error: result.error });
      }
    }
  }

  // ============================================================================
  // CRITICAL FIELDS CHECK
  // ============================================================================

  console.log("\n" + "=".repeat(80));
  console.log("\n🔍 CHECKING CRITICAL FIELDS\n");

  const criticalFields = [
    { table: "jadwal", field: "status", description: "Status approval jadwal" },
    {
      table: "jadwal",
      field: "cancelled_by",
      description: "User yang membatalkan",
    },
    { table: "jadwal", field: "cancelled_at", description: "Waktu pembatalan" },
    {
      table: "jadwal",
      field: "kelas_id",
      description: "Reference ke tabel kelas",
    },
    { table: "users", field: "role", description: "Role pengguna" },
    { table: "users", field: "status", description: "Status akun" },
    {
      table: "kuis",
      field: "randomize_options",
      description: "Acak pilihan jawaban",
    },
    { table: "kuis", field: "allow_review", description: "Izinkan review" },
    {
      table: "attempt_kuis",
      field: "sync_status",
      description: "Status sinkronisasi offline",
    },
  ];

  for (const check of criticalFields) {
    if (results.existing.includes(check.table)) {
      process.stdout.write(`   ${check.table}.${check.field}... `);

      const { data, error } = await supabase
        .from(check.table as any)
        .select(check.field)
        .limit(1);

      if (!error) {
        console.log(`✅ ${check.description}`);
      } else {
        console.log(`❌ MISSING - ${check.description}`);
      }
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("\n" + "=".repeat(80));
  console.log("\n📊 SUMMARY\n");
  console.log(
    `✅ Existing tables: ${results.existing.length}/${tables.length}`
  );
  console.log(`❌ Missing tables: ${results.missing.length}/${tables.length}`);

  if (results.missing.length > 0) {
    console.log("\n⚠️  Missing tables:");
    results.missing.forEach((t) => console.log(`   - ${t}`));
  }

  if (results.errors.length > 0) {
    console.log("\n❌ Errors encountered:");
    results.errors.forEach((e) => console.log(`   - ${e.table}: ${e.error}`));
  }

  console.log("\n" + "=".repeat(80));

  if (results.missing.length === 0 && results.errors.length === 0) {
    console.log("\n✅ DATABASE STRUCTURE LOOKS GOOD!\n");
  } else {
    console.log("\n⚠️  PLEASE FIX MISSING TABLES/FIELDS\n");
    console.log("Run migration scripts in scripts/sql/ folder");
  }
}

main().catch(console.error);
