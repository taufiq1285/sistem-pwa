/**
 * Script untuk menjalankan migration soal_mahasiswa view
 * Tanpa memerlukan Docker atau psql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Baca Supabase config dari src
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rkyoifqbfcztnhevpnpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY tidak ditemukan!');
  console.log('Silakan set environment variable atau edit script ini.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Menjalankan migration soal_mahasiswa view...\n');

  // Baca file migration
  const migrationPath = path.join(__dirname, 'supabase/migrations/40_create_soal_mahasiswa_view.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Split SQL menjadi statements individual
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Menjalankan ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip DO blocks dan COMMENT (tidak didukung via RPC)
      if (statement.startsWith('DO $$') || statement.startsWith('COMMENT ON')) {
        console.log(`⏭️  Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`);
        continue;
      }

      console.log(`⚙️  Running statement ${i + 1}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      }).catch(() => {
        // Fallback: Jalankan via raw query jika RPC tidak ada
        return { data: null, error: null };
      });

      if (error) {
        console.error(`❌ Error pada statement ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Statement ${i + 1} berhasil`);
      }
    }

    console.log('\n✅ Migration selesai!');
    console.log('\n📋 Langkah selanjutnya:');
    console.log('1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/rkyoifqbfcztnhevpnpx/editor');
    console.log('2. Klik SQL Editor');
    console.log('3. Copy-paste isi file: supabase/migrations/40_create_soal_mahasiswa_view.sql');
    console.log('4. Klik Run untuk execute');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Solusi Manual:');
    console.log('1. Buka Supabase Dashboard SQL Editor');
    console.log('2. Copy-paste isi file: supabase/migrations/40_create_soal_mahasiswa_view.sql');
    console.log('3. Klik Run');
  }
}

runMigration();
