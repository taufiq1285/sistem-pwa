#!/usr/bin/env node
/**
 * Export Schema Live dari Supabase
 * - Tables + Columns + Constraints
 * - RLS Policies
 * - Triggers + Functions
 * - Indexes
 * - Foreign Keys
 */

const https = require('https');

// Dari .env.local
const SUPABASE_URL = 'https://rkyoifqbfcztnhevpnpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E';

// SQL queries untuk export schema
const QUERIES = {
  tables: `
    SELECT
      t.table_name,
      t.table_type,
      obj_description(c.oid, 'pg_class') as table_comment
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name;
  `,

  columns: `
    SELECT
      c.table_name,
      c.column_name,
      c.ordinal_position,
      c.column_default,
      c.is_nullable,
      c.data_type,
      c.character_maximum_length,
      c.udt_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
  `,

  primaryKeys: `
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `,

  foreignKeys: `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `,

  uniqueConstraints: `
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `,

  indexes: `
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `,

  rlsPolicies: `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `,

  rlsEnabled: `
    SELECT
      n.nspname as schema_name,
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname;
  `,

  triggers: `
    SELECT
      trigger_name,
      event_object_table as table_name,
      event_manipulation,
      action_timing,
      action_orientation,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `,

  functions: `
    SELECT
      p.proname as function_name,
      pg_get_functiondef(p.oid) as function_def,
      pg_get_function_arguments(p.oid) as arguments,
      pg_get_function_result(p.oid) as return_type,
      l.lanname as language
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname;
  `,

  enums: `
    SELECT
      t.typname as enum_name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname;
  `,

  checkConstraints: `
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.constraint_type = 'CHECK'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `
};

function querySupabase(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

    // Use pg_catalog query via REST
    // Actually kita pakai endpoint yang berbeda
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Gunakan Supabase Management API
function queryViaManagementAPI(projectRef, sql, serviceKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function formatAsSQL(data, queryName) {
  let sql = `\n-- ============================================================\n`;
  sql += `-- ${queryName.toUpperCase()}\n`;
  sql += `-- ============================================================\n`;

  if (!data || (Array.isArray(data) && data.length === 0)) {
    sql += `-- (no data)\n`;
    return sql;
  }

  if (Array.isArray(data)) {
    data.forEach(row => {
      sql += `-- ${JSON.stringify(row)}\n`;
    });
  } else {
    sql += `-- ${JSON.stringify(data)}\n`;
  }

  return sql;
}

function generateCreateTableSQL(tableName, columns, primaryKeys, foreignKeys, uniqueConstraints) {
  const tableCols = columns.filter(c => c.table_name === tableName);
  const tablePKs = primaryKeys.filter(pk => pk.table_name === tableName).map(pk => pk.column_name);
  const tableFKs = foreignKeys.filter(fk => fk.table_name === tableName);
  const tableUQs = uniqueConstraints.filter(uq => uq.table_name === tableName);

  if (tableCols.length === 0) return '';

  let sql = `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;

  const colDefs = tableCols.map(col => {
    let def = `  ${col.column_name} `;

    // Data type
    if (col.udt_name === 'uuid') def += 'UUID';
    else if (col.udt_name === 'text') def += 'TEXT';
    else if (col.udt_name === 'varchar') def += `VARCHAR(${col.character_maximum_length || ''})`;
    else if (col.udt_name === 'int4' || col.udt_name === 'integer') def += 'INTEGER';
    else if (col.udt_name === 'int8' || col.udt_name === 'bigint') def += 'BIGINT';
    else if (col.udt_name === 'bool') def += 'BOOLEAN';
    else if (col.udt_name === 'timestamptz') def += 'TIMESTAMPTZ';
    else if (col.udt_name === 'timestamp') def += 'TIMESTAMP';
    else if (col.udt_name === 'date') def += 'DATE';
    else if (col.udt_name === 'time') def += 'TIME';
    else if (col.udt_name === 'jsonb') def += 'JSONB';
    else if (col.udt_name === 'json') def += 'JSON';
    else if (col.udt_name === 'numeric') def += 'NUMERIC';
    else if (col.udt_name === 'float4') def += 'FLOAT4';
    else if (col.udt_name === 'float8') def += 'FLOAT8';
    else def += col.data_type.toUpperCase();

    // Default
    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }

    // Nullable
    if (col.is_nullable === 'NO') def += ' NOT NULL';

    return def;
  });

  // Primary key constraint
  if (tablePKs.length > 0) {
    colDefs.push(`  PRIMARY KEY (${tablePKs.join(', ')})`);
  }

  // Unique constraints
  const uqByName = {};
  tableUQs.forEach(uq => {
    if (!uqByName[uq.constraint_name]) uqByName[uq.constraint_name] = [];
    uqByName[uq.constraint_name].push(uq.column_name);
  });
  Object.entries(uqByName).forEach(([name, cols]) => {
    colDefs.push(`  CONSTRAINT ${name} UNIQUE (${cols.join(', ')})`);
  });

  // Foreign keys
  tableFKs.forEach(fk => {
    colDefs.push(`  CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table_name}(${fk.foreign_column_name}) ON DELETE ${fk.delete_rule} ON UPDATE ${fk.update_rule}`);
  });

  sql += colDefs.join(',\n');
  sql += `\n);\n`;

  return sql;
}

function generateRLSSQL(tableName, rlsEnabled, policies) {
  const tableRLS = rlsEnabled.find(r => r.table_name === tableName);
  const tablePolicies = policies.filter(p => p.tablename === tableName);

  let sql = '';

  if (tableRLS && tableRLS.rls_enabled) {
    sql += `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n`;
    if (tableRLS.rls_forced) {
      sql += `ALTER TABLE public.${tableName} FORCE ROW LEVEL SECURITY;\n`;
    }
  }

  tablePolicies.forEach(policy => {
    sql += `\nCREATE POLICY "${policy.policyname}"\n`;
    sql += `  ON public.${tableName}\n`;
    sql += `  AS ${policy.permissive}\n`;
    sql += `  FOR ${policy.cmd}\n`;
    sql += `  TO ${policy.roles ? policy.roles.join(', ') : 'public'}`;
    if (policy.qual) {
      sql += `\n  USING (${policy.qual})`;
    }
    if (policy.with_check) {
      sql += `\n  WITH CHECK (${policy.with_check})`;
    }
    sql += `;\n`;
  });

  return sql;
}

async function main() {
  const projectRef = 'rkyoifqbfcztnhevpnpx';

  // Cek apakah ada service role key di environment
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.argv[2];

  if (!serviceKey) {
    console.log('============================================================');
    console.log('EXPORT SCHEMA VIA SUPABASE MANAGEMENT API');
    console.log('============================================================');
    console.log('');
    console.log('Butuh SUPABASE_SERVICE_KEY atau Personal Access Token');
    console.log('');
    console.log('Cara mendapatkan:');
    console.log('1. Buka: https://supabase.com/dashboard/account/tokens');
    console.log('2. Generate new token');
    console.log('3. Jalankan ulang: node scripts/export-schema-live.cjs <TOKEN>');
    console.log('');
    console.log('ATAU cara manual via Dashboard Supabase:');
    console.log('1. Buka: https://supabase.com/dashboard/project/rkyoifqbfcztnhevpnpx');
    console.log('2. Masuk ke SQL Editor');
    console.log('3. Jalankan query di: scripts/sql/EXPORT_QUERIES.sql');
    console.log('');

    // Generate query file untuk manual export
    const fs = require('fs');
    let exportSQL = `-- ============================================================
-- EXPORT QUERIES - Jalankan satu per satu di SQL Editor Supabase
-- Project: rkyoifqbfcztnhevpnpx (sistem-praktikum-v2)
-- ============================================================

-- 1. CEK SEMUA TABEL
${QUERIES.tables}

-- 2. CEK SEMUA KOLOM
${QUERIES.columns}

-- 3. CEK PRIMARY KEYS
${QUERIES.primaryKeys}

-- 4. CEK FOREIGN KEYS
${QUERIES.foreignKeys}

-- 5. CEK UNIQUE CONSTRAINTS
${QUERIES.uniqueConstraints}

-- 6. CEK INDEXES
${QUERIES.indexes}

-- 7. CEK RLS ENABLED/DISABLED per tabel
${QUERIES.rlsEnabled}

-- 8. CEK SEMUA RLS POLICIES
${QUERIES.rlsPolicies}

-- 9. CEK SEMUA TRIGGERS
${QUERIES.triggers}

-- 10. CEK SEMUA FUNCTIONS/PROCEDURES
${QUERIES.functions}

-- 11. CEK ENUMS
${QUERIES.enums}

-- 12. CEK CHECK CONSTRAINTS
${QUERIES.checkConstraints}
`;

    fs.writeFileSync('scripts/sql/EXPORT_QUERIES.sql', exportSQL);
    console.log('File scripts/sql/EXPORT_QUERIES.sql sudah dibuat!');
    console.log('Buka file itu dan jalankan tiap query di SQL Editor Supabase.');
    return;
  }

  console.log('Menghubungkan ke Supabase Management API...');
  console.log(`Project: ${projectRef}`);
  console.log('');

  const fs = require('fs');
  const results = {};

  for (const [name, sql] of Object.entries(QUERIES)) {
    process.stdout.write(`Mengambil ${name}... `);
    try {
      const result = await queryViaManagementAPI(projectRef, sql.trim(), serviceKey);
      if (result.status === 200) {
        results[name] = result.data;
        console.log(`OK (${Array.isArray(result.data) ? result.data.length : 1} rows)`);
      } else {
        console.log(`GAGAL (${result.status}): ${JSON.stringify(result.data).substring(0, 100)}`);
        results[name] = [];
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results[name] = [];
    }
  }

  console.log('\nMembuat file backup SQL...');

  // Generate SQL file
  let outputSQL = `-- ============================================================
-- FULL SCHEMA BACKUP - sistem-praktikum-v2
-- Project: ${projectRef}
-- Generated: ${new Date().toISOString()}
-- ============================================================

-- Jalankan file ini di SQL Editor Supabase project baru
-- untuk merekonstruksi semua tabel, RLS, dan triggers

`;

  // Extension
  outputSQL += `-- EXTENSIONS\nCREATE EXTENSION IF NOT EXISTS "uuid-ossp";\nCREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;

  // Enums dulu
  if (results.enums && results.enums.length > 0) {
    outputSQL += `-- ============================================================\n-- ENUMS\n-- ============================================================\n\n`;
    results.enums.forEach(e => {
      outputSQL += `CREATE TYPE public.${e.enum_name} AS ENUM (${e.enum_values.map(v => `'${v}'`).join(', ')});\n`;
    });
    outputSQL += '\n';
  }

  // Tables
  outputSQL += `-- ============================================================\n-- TABLES\n-- ============================================================\n\n`;

  if (results.tables) {
    results.tables.forEach(table => {
      if (table.table_type === 'BASE TABLE') {
        const createSQL = generateCreateTableSQL(
          table.table_name,
          results.columns || [],
          results.primaryKeys || [],
          results.foreignKeys || [],
          results.uniqueConstraints || []
        );
        if (createSQL) {
          outputSQL += createSQL + '\n';
        }
      }
    });
  }

  // Indexes
  if (results.indexes && results.indexes.length > 0) {
    outputSQL += `-- ============================================================\n-- INDEXES\n-- ============================================================\n\n`;
    results.indexes.forEach(idx => {
      if (!idx.indexname.endsWith('_pkey')) {
        outputSQL += `${idx.indexdef};\n`;
      }
    });
    outputSQL += '\n';
  }

  // Functions (untuk triggers)
  if (results.functions && results.functions.length > 0) {
    outputSQL += `-- ============================================================\n-- FUNCTIONS\n-- ============================================================\n\n`;
    results.functions.forEach(fn => {
      outputSQL += `${fn.function_def};\n\n`;
    });
  }

  // Triggers
  if (results.triggers && results.triggers.length > 0) {
    outputSQL += `-- ============================================================\n-- TRIGGERS\n-- ============================================================\n\n`;
    const triggersByTable = {};
    results.triggers.forEach(t => {
      if (!triggersByTable[t.table_name]) triggersByTable[t.table_name] = [];
      if (!triggersByTable[t.table_name].find(x => x.trigger_name === t.trigger_name)) {
        triggersByTable[t.table_name].push(t);
      }
    });

    Object.entries(triggersByTable).forEach(([table, triggers]) => {
      triggers.forEach(t => {
        outputSQL += `-- Trigger: ${t.trigger_name} on ${t.table_name}\n`;
        outputSQL += `DROP TRIGGER IF EXISTS ${t.trigger_name} ON public.${t.table_name};\n`;
        outputSQL += `CREATE TRIGGER ${t.trigger_name}\n`;
        outputSQL += `  ${t.action_timing} ${t.event_manipulation}\n`;
        outputSQL += `  ON public.${t.table_name}\n`;
        outputSQL += `  FOR EACH ${t.action_orientation}\n`;
        outputSQL += `  ${t.action_statement};\n\n`;
      });
    });
  }

  // RLS
  outputSQL += `-- ============================================================\n-- RLS POLICIES\n-- ============================================================\n\n`;

  if (results.tables) {
    results.tables.forEach(table => {
      if (table.table_type === 'BASE TABLE') {
        const rlsSQL = generateRLSSQL(
          table.table_name,
          results.rlsEnabled || [],
          results.rlsPolicies || []
        );
        if (rlsSQL) {
          outputSQL += `-- Table: ${table.table_name}\n`;
          outputSQL += rlsSQL + '\n';
        }
      }
    });
  }

  // Raw data untuk referensi
  outputSQL += `\n-- ============================================================\n-- RAW DATA (untuk referensi)\n-- ============================================================\n\n`;
  outputSQL += `-- RLS Policies raw:\n`;
  if (results.rlsPolicies) {
    results.rlsPolicies.forEach(p => {
      outputSQL += `-- Table: ${p.tablename} | Policy: ${p.policyname} | CMD: ${p.cmd} | Permissive: ${p.permissive}\n`;
      outputSQL += `--   USING: ${p.qual || '(none)'}\n`;
      outputSQL += `--   WITH CHECK: ${p.with_check || '(none)'}\n`;
    });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outputFile = `scripts/sql/SCHEMA_BACKUP_${timestamp}.sql`;
  fs.writeFileSync(outputFile, outputSQL);

  // Also save raw JSON for reference
  fs.writeFileSync(`scripts/sql/SCHEMA_RAW_${timestamp}.json`, JSON.stringify(results, null, 2));

  console.log(`\nBackup selesai!`);
  console.log(`SQL File: ${outputFile}`);
  console.log(`JSON Raw: scripts/sql/SCHEMA_RAW_${timestamp}.json`);
  console.log(`\nStatistik:`);
  console.log(`  - Tabel: ${(results.tables || []).length}`);
  console.log(`  - Kolom: ${(results.columns || []).length}`);
  console.log(`  - RLS Policies: ${(results.rlsPolicies || []).length}`);
  console.log(`  - Triggers: ${(results.triggers || []).filter((t,i,a) => a.findIndex(x=>x.trigger_name===t.trigger_name)===i).length}`);
  console.log(`  - Functions: ${(results.functions || []).length}`);
  console.log(`  - Indexes: ${(results.indexes || []).length}`);
}

main().catch(console.error);
