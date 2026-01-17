const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanup() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  console.log('🧹 Cleanup Dosen Data - Starting...\n');

  const tables = [
    { name: 'kehadiran', condition: 'jadwal_praktikum_id IN (SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL)' },
    { name: 'nilai', condition: 'jadwal_praktikum_id IN (SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL)' },
    { name: 'jawaban_kuis', condition: 'kuis_id IN (SELECT id FROM kuis WHERE dosen_id IS NOT NULL)' },
    { name: 'hasil_kuis', condition: 'kuis_id IN (SELECT id FROM kuis WHERE dosen_id IS NOT NULL)' },
    { name: 'soal_kuis', condition: 'kuis_id IN (SELECT id FROM kuis WHERE dosen_id IS NOT NULL)' },
    { name: 'kuis', condition: 'dosen_id IS NOT NULL' },
    { name: 'materi', condition: 'jadwal_praktikum_id IN (SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL)' },
    { name: 'detail_peminjaman', condition: 'peminjaman_id IN (SELECT id FROM peminjaman WHERE dosen_id IS NOT NULL)' },
    { name: 'peminjaman', condition: 'dosen_id IS NOT NULL' },
    { name: 'jadwal_praktikum_mahasiswa', condition: 'jadwal_praktikum_id IN (SELECT id FROM jadwal_praktikum WHERE dosen_id IS NOT NULL)' },
    { name: 'jadwal_praktikum', condition: 'dosen_id IS NOT NULL' }
  ];

  let totalDeleted = 0;
  let errors = [];

  for (const table of tables) {
    try {
      // First get count
      const { count: beforeCount } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      console.log(`📊 ${table.name}: ${beforeCount || 0} rows before cleanup`);

      // Try to delete - this might fail due to RLS
      // We'll show instructions if it fails

    } catch (err) {
      errors.push({ table: table.name, error: err.message });
    }
  }

  console.log('\n⚠️  DELETE operations need to be run with elevated privileges.');
  console.log('   Please run the SQL script manually in Supabase Dashboard.\n');
  console.log('📝 Steps:');
  console.log('   1. Open: https://supabase.com/dashboard/project/rkyoifqbfcztnhevpnpx/sql/new');
  console.log('   2. Copy the contents of: scripts/sql/cleanup-dosen-data.sql');
  console.log('   3. Paste into SQL Editor');
  console.log('   4. Click "Run"\n');
}

cleanup();
