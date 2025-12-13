// ============================================================================
// DELETE ORPHANED USER VIA CLI
// ============================================================================
// Script Node.js untuk menghapus user dari auth.users menggunakan service role
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

// Konfigurasi - ambil dari .env.local
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rkyoifqbfcztnhevpnpx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// User ID yang akan dihapus
const USER_ID_TO_DELETE = '7eb7eead-29e8-48aa-b8be-758b561d35cf';
const USER_EMAIL = 'superadmin@akbid.ac.id';

async function deleteOrphanedUser() {
  console.log('🔧 Delete Orphaned User Script');
  console.log('================================');
  console.log('User ID:', USER_ID_TO_DELETE);
  console.log('Email:', USER_EMAIL);
  console.log('');

  // Validasi service role key
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan!');
    console.log('');
    console.log('Cara mendapatkan service role key:');
    console.log('1. Buka Supabase Dashboard > Settings > API');
    console.log('2. Copy "service_role" key (secret key)');
    console.log('3. Set environment variable:');
    console.log('   set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('4. Jalankan script ini lagi');
    process.exit(1);
  }

  console.log('✅ Service role key ditemukan');
  console.log('🔗 Connecting to Supabase...');

  // Create admin client dengan service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Connected to Supabase');
  console.log('');

  try {
    // Step 1: Verifikasi user ada
    console.log('🔍 Step 1: Verifikasi user ada...');
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(USER_ID_TO_DELETE);

    if (getUserError) {
      console.error('❌ Error getting user:', getUserError.message);
      process.exit(1);
    }

    if (!userData.user) {
      console.log('⚠️  User tidak ditemukan (mungkin sudah dihapus)');
      process.exit(0);
    }

    console.log('✅ User ditemukan:', userData.user.email);
    console.log('   Created:', userData.user.created_at);
    console.log('');

    // Step 2: Hapus dari public.users dulu (jika ada)
    console.log('🗑️  Step 2: Hapus dari public.users...');
    const { error: deletePublicError } = await supabase
      .from('users')
      .delete()
      .eq('id', USER_ID_TO_DELETE);

    if (deletePublicError) {
      console.log('⚠️  Warning: Error deleting from public.users:', deletePublicError.message);
      console.log('   (Kemungkinan user memang tidak ada di public.users - OK)');
    } else {
      console.log('✅ Deleted from public.users');
    }
    console.log('');

    // Step 3: Hapus dari auth.users
    console.log('🗑️  Step 3: Hapus dari auth.users...');
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(USER_ID_TO_DELETE);

    if (deleteAuthError) {
      console.error('❌ ERROR: Gagal menghapus user dari auth.users');
      console.error('   Error:', deleteAuthError.message);
      process.exit(1);
    }

    console.log('✅ User berhasil dihapus dari auth.users!');
    console.log('');

    // Step 4: Verifikasi user sudah terhapus
    console.log('✅ Step 4: Verifikasi cleanup...');
    const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(USER_ID_TO_DELETE);

    if (verifyError || !verifyData.user) {
      console.log('✅ VERIFIED: User sudah tidak ada di auth.users');
    } else {
      console.log('⚠️  WARNING: User masih ada?');
    }

    console.log('');
    console.log('================================');
    console.log('✅ CLEANUP SELESAI!');
    console.log('');
    console.log('Silakan jalankan query verifikasi di SQL Editor:');
    console.log('');
    console.log('SELECT');
    console.log('    (SELECT COUNT(*) FROM auth.users) AS auth_users,');
    console.log('    (SELECT COUNT(*) FROM public.users) AS public_users,');
    console.log('    (SELECT COUNT(*) FROM auth.users au');
    console.log('     LEFT JOIN public.users pu ON au.id = pu.id');
    console.log('     WHERE pu.id IS NULL) AS orphaned_users;');
    console.log('');
    console.log('Expected: orphaned_users = 0');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run
deleteOrphanedUser();
