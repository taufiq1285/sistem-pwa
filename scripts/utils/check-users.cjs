const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
  const supabase = createClient(
    'https://rkyoifqbfcztnhevpnpx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E'
  );

  console.log('👥 Checking Users Data...\n');

  // Count users by role
  const roles = ['dosen', 'mahasiswa', 'laboran', 'admin'];

  for (const role of roles) {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role);

    console.log(`   ${role}: ${count || 0} users`);
  }

  // Total users
  const { count: totalCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  console.log(`   TOTAL: ${totalCount || 0} users`);

  // Check specific tables
  console.log('\n📊 Profile Tables:');
  const profileTables = ['dosen', 'mahasiswa', 'laboran', 'admin'];

  for (const table of profileTables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`   ${table}: ${count || 0} rows`);
  }

  // Check master data
  console.log('\n📚 Master Data:');
  const masterTables = ['mata_kuliah', 'laboratorium', 'inventaris'];

  for (const table of masterTables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`   ${table}: ${count || 0} rows`);
  }

  console.log('\n✅ Done!');
}

checkUsers();
