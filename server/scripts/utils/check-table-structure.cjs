const { createClient } = require('@supabase/supabase-js');

async function checkStructure() {
  const supabase = createClient(
    'https://rkyoifqbfcztnhevpnpx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E'
  );

  console.log('🔍 Checking table structures from Supabase...\n');

  // Check jadwal_praktikum structure
  console.log('📋 JADWAL_PRAKTIKUM:');
  const { data: jadwal, error: e1 } = await supabase
    .from('jadwal_praktikum')
    .select('*')
    .limit(1);

  if (jadwal && jadwal[0]) {
    console.log('   Columns:', Object.keys(jadwal[0]).join(', '));
  } else {
    console.log('   No data or error:', e1?.message);
  }

  // Check kelas structure
  console.log('\n📋 KELAS:');
  const { data: kelas, error: e2 } = await supabase
    .from('kelas')
    .select('*')
    .limit(1);

  if (kelas && kelas[0]) {
    console.log('   Columns:', Object.keys(kelas[0]).join(', '));
  } else {
    console.log('   No data or error:', e2?.message);
  }

  // Check kuis structure
  console.log('\n📋 KUIS:');
  const { data: kuis, error: e3 } = await supabase
    .from('kuis')
    .select('*')
    .limit(1);

  if (kuis && kuis[0]) {
    console.log('   Columns:', Object.keys(kuis[0]).join(', '));
  } else {
    console.log('   No data or error:', e3?.message);
  }

  // Check peminjaman structure
  console.log('\n📋 PEMINJAMAN:');
  const { data: peminjaman, error: e4 } = await supabase
    .from('peminjaman')
    .select('*')
    .limit(1);

  if (peminjaman && peminjaman[0]) {
    console.log('   Columns:', Object.keys(peminjaman[0]).join(', '));
  } else {
    console.log('   No data or error:', e4?.message);
  }

  // Check soal table name
  console.log('\n📋 SOAL (checking if exists):');
  const { data: soal, error: e5 } = await supabase
    .from('soal')
    .select('*')
    .limit(1);

  if (e5) {
    console.log('   ❌ Table "soal" not found, trying "soal_kuis"...');
    const { data: soalKuis, error: e6 } = await supabase
      .from('soal_kuis')
      .select('*')
      .limit(1);

    if (soalKuis && soalKuis[0]) {
      console.log('   ✅ Table "soal_kuis" exists');
      console.log('   Columns:', Object.keys(soalKuis[0]).join(', '));
    } else {
      console.log('   ❌ Neither "soal" nor "soal_kuis" found:', e6?.message);
    }
  } else {
    console.log('   ✅ Table "soal" exists');
    if (soal && soal[0]) {
      console.log('   Columns:', Object.keys(soal[0]).join(', '));
    }
  }

  // Count current data
  console.log('\n📊 CURRENT DATA COUNTS:');

  const tables = [
    'kehadiran', 'nilai', 'kuis', 'jadwal_praktikum',
    'peminjaman', 'kelas', 'dosen', 'materi'
  ];

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`   ${table}: ${count || 0} rows`);
  }

  console.log('\n✅ Done!');
}

checkStructure();
