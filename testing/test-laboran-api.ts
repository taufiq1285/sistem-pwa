/**
 * Test file untuk debug Laboran API
 * Run: npx tsx test-laboran-api.ts
 */

import { createClient } from '@supabase/supabase-js';

// Setup Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLaboranStats() {
  console.log('\n🔍 Testing getLaboranStats()...');
  try {
    // Test 1: Total laboratorium
    const { count: totalLab, error: labError } = await supabase
      .from('laboratorium')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (labError) {
      console.error('❌ Error getting total lab:', labError);
      return false;
    }
    console.log('✅ Total Lab:', totalLab);

    // Test 2: Total inventaris
    const { count: totalInventaris, error: invError } = await supabase
      .from('inventaris')
      .select('*', { count: 'exact', head: true });

    if (invError) {
      console.error('❌ Error getting total inventaris:', invError);
      return false;
    }
    console.log('✅ Total Inventaris:', totalInventaris);

    // Test 3: Pending approvals
    const { count: pendingApprovals, error: pendError } = await supabase
      .from('peminjaman')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendError) {
      console.error('❌ Error getting pending approvals:', pendError);
      return false;
    }
    console.log('✅ Pending Approvals:', pendingApprovals);

    // Test 4: Low stock alerts
    const { count: lowStockAlerts, error: stockError } = await supabase
      .from('inventaris')
      .select('*', { count: 'exact', head: true })
      .lt('jumlah_tersedia', 5)
      .eq('is_available_for_borrowing', true);

    if (stockError) {
      console.error('❌ Error getting low stock alerts:', stockError);
      return false;
    }
    console.log('✅ Low Stock Alerts:', lowStockAlerts);

    return true;
  } catch (error) {
    console.error('❌ Exception in getLaboranStats:', error);
    return false;
  }
}

async function testPendingApprovals() {
  console.log('\n🔍 Testing getPendingApprovals()...');
  try {
    const { data, error } = await supabase
      .from('peminjaman')
      .select(`
        id,
        jumlah_pinjam,
        keperluan,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        created_at,
        peminjam:mahasiswa!peminjaman_peminjam_id_fkey(
          nim,
          user:users!mahasiswa_user_id_fkey(
            full_name
          )
        ),
        inventaris:inventaris!peminjaman_inventaris_id_fkey(
          kode_barang,
          nama_barang,
          laboratorium:laboratorium!inventaris_laboratorium_id_fkey(
            nama_lab
          )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error in getPendingApprovals:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    console.log('✅ Pending Approvals count:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Sample data:', JSON.stringify(data[0], null, 2));
    }
    return true;
  } catch (error) {
    console.error('❌ Exception in getPendingApprovals:', error);
    return false;
  }
}

async function testInventoryAlerts() {
  console.log('\n🔍 Testing getInventoryAlerts()...');
  try {
    const { data, error } = await supabase
      .from('inventaris')
      .select(`
        id,
        kode_barang,
        nama_barang,
        kategori,
        jumlah,
        jumlah_tersedia,
        kondisi,
        laboratorium:laboratorium!inventaris_laboratorium_id_fkey(
          kode_lab,
          nama_lab
        )
      `)
      .lt('jumlah_tersedia', 5)
      .eq('is_available_for_borrowing', true)
      .order('jumlah_tersedia', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Error in getInventoryAlerts:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    console.log('✅ Inventory Alerts count:', data?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Exception in getInventoryAlerts:', error);
    return false;
  }
}

async function testLabScheduleToday() {
  console.log('\n🔍 Testing getLabScheduleToday()...');
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);

    const { data, error } = await supabase
      .from('jadwal_praktikum')
      .select(`
        id,
        hari,
        jam_mulai,
        jam_selesai,
        tanggal_praktikum,
        topik,
        kelas:kelas!jadwal_praktikum_kelas_id_fkey(
          nama_kelas,
          mata_kuliah:mata_kuliah!kelas_mata_kuliah_id_fkey(
            nama_mk
          ),
          dosen:dosen!kelas_dosen_id_fkey(
            user:users!dosen_user_id_fkey(
              full_name
            )
          )
        ),
        laboratorium:laboratorium!jadwal_praktikum_laboratorium_id_fkey(
          nama_lab
        )
      `)
      .eq('tanggal_praktikum', today)
      .eq('is_active', true)
      .order('jam_mulai', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Error in getLabScheduleToday:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    console.log('✅ Lab Schedule Today count:', data?.length || 0);
    return true;
  } catch (error) {
    console.error('❌ Exception in getLabScheduleToday:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 LABORAN API TESTS');
  console.log('='.repeat(60));

  const results = {
    stats: await testLaboranStats(),
    pendingApprovals: await testPendingApprovals(),
    inventoryAlerts: await testInventoryAlerts(),
    labSchedule: await testLabScheduleToday(),
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log('getLaboranStats():', results.stats ? '✅ PASS' : '❌ FAIL');
  console.log('getPendingApprovals():', results.pendingApprovals ? '✅ PASS' : '❌ FAIL');
  console.log('getInventoryAlerts():', results.inventoryAlerts ? '✅ PASS' : '❌ FAIL');
  console.log('getLabScheduleToday():', results.labSchedule ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(60));

  const allPass = Object.values(results).every(r => r);
  if (allPass) {
    console.log('\n✅ ALL TESTS PASSED!');
  } else {
    console.log('\n❌ SOME TESTS FAILED - Check errors above');
  }
}

runAllTests().catch(console.error);
