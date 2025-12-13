const { createClient } = require('@supabase/supabase-js');

async function checkAuthUsers() {
  const supabase = createClient(
    'https://rkyoifqbfcztnhevpnpx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E'
  );

  console.log('🔐 Checking Authentication Users...\n');

  // Try to login with a test dosen account to see what happens
  console.log('Attempting to check current session...\n');

  // Check users table with no RLS filter
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .limit(10);

  if (usersError) {
    console.log('❌ Error fetching users:', usersError.message);
  } else {
    console.log('📊 Users in public.users table:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('\nUsers found:');
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.role}) - ${u.full_name}`);
      });
    }
  }

  // Check dosen table
  console.log('\n📋 Checking dosen table...');
  const { data: dosen, error: dosenError } = await supabase
    .from('dosen')
    .select('*')
    .limit(10);

  if (dosenError) {
    console.log('❌ Error fetching dosen:', dosenError.message);
  } else {
    console.log('   Dosen records:', dosen?.length || 0);
    if (dosen && dosen.length > 0) {
      console.log('\nDosen found:');
      dosen.forEach(d => {
        console.log(`   - NIP: ${d.nip}, User ID: ${d.user_id}`);
      });
    }
  }

  // Check mahasiswa table
  console.log('\n📋 Checking mahasiswa table...');
  const { data: mahasiswa, error: mhsError } = await supabase
    .from('mahasiswa')
    .select('*')
    .limit(10);

  if (mhsError) {
    console.log('❌ Error fetching mahasiswa:', mhsError.message);
  } else {
    console.log('   Mahasiswa records:', mahasiswa?.length || 0);
    if (mahasiswa && mahasiswa.length > 0) {
      console.log('\nMahasiswa found:');
      mahasiswa.forEach(m => {
        console.log(`   - NIM: ${m.nim}, User ID: ${m.user_id}`);
      });
    }
  }

  console.log('\n💡 NOTE: Data mungkin tidak terlihat karena RLS (Row Level Security)');
  console.log('   Coba cek langsung di Supabase Dashboard > Table Editor');

  console.log('\n✅ Done!');
}

checkAuthUsers();
