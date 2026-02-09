const fs = require('fs');
const path = require('path');

console.log('📝 Patching PenilaianPage confirmSave to include mata_kuliah_id...\n');

const filePath = path.join(__dirname, 'src/pages/dosen/PenilaianPage.tsx');

try {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Find and replace the batchData creation
  const oldBatchData = `      const batchData: BatchUpdateNilaiData = {
        kelas_id: selectedKelas,
        nilai_list: Array.from(editedGrades.entries()).map(
          ([mahasiswaId, data]) => ({
            mahasiswa_id: mahasiswaId,
            nilai_kuis: data.nilai_kuis,
            nilai_tugas: data.nilai_tugas,
            nilai_uts: data.nilai_uts,
            nilai_uas: data.nilai_uas,
            nilai_praktikum: data.nilai_praktikum,
            nilai_kehadiran: data.nilai_kehadiran,
            keterangan: data.keterangan || undefined,
          }),
        ),
      };`;

  const newBatchData = `      const batchData: BatchUpdateNilaiData = {
        kelas_id: selectedKelas,
        mata_kuliah_id: selectedMataKuliah,
        nilai_list: Array.from(editedGrades.entries()).map(
          ([mahasiswaId, data]) => ({
            mahasiswa_id: mahasiswaId,
            nilai_kuis: data.nilai_kuis,
            nilai_tugas: data.nilai_tugas,
            nilai_uts: data.nilai_uts,
            nilai_uas: data.nilai_uas,
            nilai_praktikum: data.nilai_praktikum,
            nilai_kehadiran: data.nilai_kehadiran,
            keterangan: data.keterangan || undefined,
          }),
        ),
      };`;

  if (content.includes('mata_kuliah_id: selectedMataKuliah,')) {
    console.log('✅ Patch already applied - mata_kuliah_id already in batchData');
  } else if (content.includes(oldBatchData)) {
    content = content.replace(oldBatchData, newBatchData);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Successfully added mata_kuliah_id to batchData');
    console.log('   - Location: confirmSave function, line ~447');
  } else {
    console.log('⚠️  Could not find exact batchData pattern to patch');
    console.log('   The code may have been modified');
  }

  console.log('\n🎯 All PenilaianPage patches complete!');

} catch (error) {
  console.error('❌ Error patching file:', error.message);
  process.exit(1);
}
