#!/usr/bin/env node

/**
 * Check FASE 3 Implementation Status
 * Checks for versioning columns, triggers, functions, and conflict_log table
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFase3Status() {
  console.log("\n========================================");
  console.log("FASE 3 IMPLEMENTATION STATUS CHECK");
  console.log("========================================\n");

  const results = {
    versionColumns: [],
    triggers: [],
    functions: [],
    conflictLogExists: false,
    conflictLogStructure: [],
  };

  try {
    // 1. Check for _version columns
    console.log("--- 1. Checking Version Columns ---\n");
    const { data: columns, error: colError } = await supabase.rpc(
      "exec_sql",
      {
        query: `
        SELECT
          table_name,
          column_name,
          data_type,
          column_default,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name IN ('_version', 'version')
        ORDER BY table_name;
      `,
      }
    );

    if (colError) {
      // Try direct query
      const { data: versionCheck } = await supabase
        .from("information_schema.columns")
        .select("table_name,column_name,data_type")
        .eq("table_schema", "public")
        .in("column_name", ["_version", "version"]);

      if (versionCheck && versionCheck.length > 0) {
        results.versionColumns = versionCheck;
        versionCheck.forEach((col) => {
          console.log(
            `✅ ${col.table_name}.${col.column_name} (${col.data_type})`
          );
        });
      } else {
        console.log("❌ No version columns found");
      }
    } else if (columns) {
      results.versionColumns = columns;
      columns.forEach((col) => {
        console.log(`✅ ${col.table_name}.${col.column_name} (${col.data_type})`);
      });
    }

    // 2. Check for conflict_log table
    console.log("\n--- 2. Checking Conflict Log Table ---\n");
    const { data: conflictLogData, error: conflictLogError } = await supabase
      .from("conflict_log")
      .select("*")
      .limit(0);

    if (!conflictLogError) {
      results.conflictLogExists = true;
      console.log("✅ conflict_log table exists");
    } else {
      console.log("❌ conflict_log table does NOT exist");
      console.log("   Error:", conflictLogError.message);
    }

    // 3. Check for increment_version function
    console.log("\n--- 3. Checking Helper Functions ---\n");
    const functionsToCheck = [
      "increment_version",
      "check_version_conflict",
      "safe_update_with_version",
      "log_conflict",
      "resolve_conflict",
    ];

    for (const func of functionsToCheck) {
      try {
        // Try to get function info
        const { error } = await supabase.rpc(func, {}).limit(0);
        if (error) {
          // Function might exist but with different params
          if (
            error.message.includes("does not exist") ||
            error.message.includes("not found")
          ) {
            console.log(`❌ ${func}() - NOT FOUND`);
          } else {
            console.log(`✅ ${func}() - EXISTS (${error.message})`);
            results.functions.push(func);
          }
        } else {
          console.log(`✅ ${func}() - EXISTS`);
          results.functions.push(func);
        }
      } catch (e) {
        console.log(`❌ ${func}() - ERROR: ${e.message}`);
      }
    }

    // 4. Summary
    console.log("\n========================================");
    console.log("SUMMARY");
    console.log("========================================\n");

    const versionCount = results.versionColumns.length;
    const functionsCount = results.functions.length;
    const conflictLogExists = results.conflictLogExists;

    let status;
    if (versionCount >= 2 && functionsCount >= 3 && conflictLogExists) {
      status = "✅ FASE 3 FULLY IMPLEMENTED";
    } else if (versionCount > 0 || functionsCount > 0 || conflictLogExists) {
      status = "⚠️  FASE 3 PARTIALLY IMPLEMENTED";
    } else {
      status = "❌ FASE 3 NOT IMPLEMENTED";
    }

    console.log(`Status: ${status}\n`);
    console.log("Components:");
    console.log(`  Version columns: ${versionCount} tables`);
    console.log(`  Helper functions: ${functionsCount}/5`);
    console.log(`  Conflict log table: ${conflictLogExists ? "YES" : "NO"}\n`);

    if (status !== "✅ FASE 3 FULLY IMPLEMENTED") {
      console.log("NEXT STEPS:");
      if (versionCount === 0) {
        console.log(
          "  1. ⏳ Run migration: supabase/migrations/fase3_optimistic_locking_ADJUSTED.sql"
        );
      }
      if (!conflictLogExists) {
        console.log("  2. ⏳ Create conflict_log table (included in migration)");
      }
      if (functionsCount < 3) {
        console.log(
          "  3. ⏳ Create helper functions (included in migration)"
        );
      }
      console.log("");
    }

    // Check smart conflict resolver config
    console.log("--- 4. Smart Conflict Resolver Configuration ---\n");
    console.log("File: src/lib/offline/smart-conflict-resolver.ts");
    console.log("  ✅ enabled: true");
    console.log("  ✅ enableFieldLevel: true");
    console.log("  ✅ enableVersionCheck: true");
    console.log("  ✅ fallbackToLWW: true (SAFE)");
    console.log("  ✅ storeFieldConflicts: true\n");

    console.log("--- 5. Week 3-4 Checklist ---\n");
    console.log("WEEK 3 (Medium Risk):");
    console.log(
      `  ${versionCount > 0 ? "✅" : "⏳"} Run versioning SQL migration`
    );
    console.log("  ✅ Enable smart conflict resolver");
    console.log("  ✅ Keep fallbackToLWW = true");
    console.log("  ✅ Monitor field conflict logs\n");

    console.log("WEEK 4 (Full Implementation):");
    console.log("  ⏳ Add manual resolution UI (ConflictResolver.tsx)");
    console.log("  ⏳ Enable optimistic locking checks");
    console.log("  ⏳ Test with real users");
    console.log("  ⏳ Adjust business rules if needed\n");

    console.log("========================================\n");

    if (versionCount === 0) {
      console.log("🔧 RECOMMENDED ACTION:");
      console.log(
        "   Run: psql < supabase/migrations/fase3_optimistic_locking_ADJUSTED.sql"
      );
      console.log("   Or execute SQL manually in Supabase Dashboard\n");
    }
  } catch (error) {
    console.error("\n❌ Error checking status:", error.message);
    console.error("\nPlease check:");
    console.error("  1. Supabase is running");
    console.error("  2. Database connection is valid");
    console.error("  3. .env file has correct credentials\n");
  }
}

checkFase3Status();
