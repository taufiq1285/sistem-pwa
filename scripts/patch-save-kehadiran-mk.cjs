const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/dosen/KehadiranPage.tsx');

console.log('📝 Patching KehadiranPage.tsx to include mata_kuliah_id...');

try {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Find and replace the saveKehadiranBulk call to add mata_kuliah_id
  const oldCode = `      await saveKehadiranBulk({
        kelas_id: selectedKelas,
        tanggal: selectedTanggal,
        kehadiran: bulkData.kehadiran,
      });`;

  const newCode = `      await saveKehadiranBulk({
        kelas_id: selectedKelas,
        mata_kuliah_id: selectedMataKuliah,
        tanggal: selectedTanggal,
        kehadiran: bulkData.kehadiran,
      });`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Successfully patched KehadiranPage.tsx');
    console.log('   - Added mata_kuliah_id to saveKehadiranBulk call');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Test input kehadiran dengan data baru');
    console.log('   2. Cek database: mata_kuliah_id should be populated');
    console.log('   3. Export CSV - mata kuliah should appear');
  } else if (content.includes('mata_kuliah_id: selectedMataKuliah')) {
    console.log('✅ Patch already applied - mata_kuliah_id already included');
  } else {
    console.log('⚠️  Could not find exact code to patch');
    console.log('   File may have been modified');
  }
} catch (error) {
  console.error('❌ Error patching file:', error.message);
  process.exit(1);
}
