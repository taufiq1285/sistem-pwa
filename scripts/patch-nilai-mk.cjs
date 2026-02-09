const fs = require('fs');
const path = require('path');

console.log('📝 Patching nilai.api.ts to support mata_kuliah_id...\n');

// ============================================================================
// PATCH 1: Add mata_kuliah_id to BatchUpdateNilaiData interface
// ============================================================================

const nilaiApiPath = path.join(__dirname, 'src/lib/api/nilai.api.ts');

try {
  let content = fs.readFileSync(nilaiApiPath, 'utf-8');

  // Add mata_kuliah_id to BatchUpdateNilaiData
  const oldInterface = `export interface BatchUpdateNilaiData {
  kelas_id: string;
  nilai_list: BatchUpdateNilaiItem[];
}`;

  const newInterface = `export interface BatchUpdateNilaiData {
  kelas_id: string;
  mata_kuliah_id?: string; // Mata kuliah yang dipilih dosen
  nilai_list: BatchUpdateNilaiItem[];
}`;

  if (content.includes('mata_kuliah_id?: string; // Mata kuliah yang dipilih dosen')) {
    console.log('✅ BatchUpdateNilaiData already patched');
  } else if (content.includes(oldInterface)) {
    content = content.replace(oldInterface, newInterface);
    console.log('✅ Added mata_kuliah_id to BatchUpdateNilaiData interface');
  } else {
    console.log('⚠️  Could not find BatchUpdateNilaiData interface to patch');
  }

  // Add mata_kuliah_id to upsert data in updateNilaiImpl
  const oldUpsert = `    // ✅ FIX: Include mahasiswa_id and kelas_id in data for UPSERT
    const upsertData = {
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      ...data,
      nilai_akhir: nilaiAkhir,
      nilai_huruf: nilaiHuruf,
      updated_at: new Date().toISOString(),
    };`;

  const newUpsert = `    // ✅ FIX: Include mahasiswa_id and kelas_id in data for UPSERT
    const upsertData = {
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      ...data,
      nilai_akhir: nilaiAkhir,
      nilai_huruf: nilaiHuruf,
      updated_at: new Date().toISOString(),
    };`;

  // Update batchUpdateNilaiImpl to pass mata_kuliah_id
  const oldBatch = `async function batchUpdateNilaiImpl(
  batchData: BatchUpdateNilaiData,
): Promise<Nilai[]> {
  try {
    const results: Nilai[] = [];

    for (const item of batchData.nilai_list) {
      try {
        const updated = await updateNilaiImpl(
          item.mahasiswa_id,
          batchData.kelas_id,
          item,
        );
        results.push(updated);
      } catch (error) {
        console.error("batchUpdateNilai - single update failed:", error);
        // Continue with other updates even if one fails
      }
    }

    return results;
  } catch (error) {
    console.error("batchUpdateNilai error:", error);
    throw handleError(error);
  }
}`;

  const newBatch = `async function batchUpdateNilaiImpl(
  batchData: BatchUpdateNilaiData,
): Promise<Nilai[]> {
  try {
    const results: Nilai[] = [];

    for (const item of batchData.nilai_list) {
      try {
        const itemWithMK = {
          ...item,
          mata_kuliah_id: batchData.mata_kuliah_id, // Include mata kuliah
        };
        const updated = await updateNilaiImpl(
          item.mahasiswa_id,
          batchData.kelas_id,
          itemWithMK,
        );
        results.push(updated);
      } catch (error) {
        console.error("batchUpdateNilai - single update failed:", error);
        // Continue with other updates even if one fails
      }
    }

    return results;
  } catch (error) {
    console.error("batchUpdateNilai error:", error);
    throw handleError(error);
  }
}`;

  if (content.includes('mata_kuliah_id: batchData.mata_kuliah_id')) {
    console.log('✅ batchUpdateNilaiImpl already patched');
  } else if (content.includes(oldBatch)) {
    content = content.replace(oldBatch, newBatch);
    console.log('✅ Updated batchUpdateNilaiImpl to include mata_kuliah_id');
  } else {
    console.log('⚠️  Could not find batchUpdateNilaiImpl to patch');
  }

  fs.writeFileSync(nilaiApiPath, content, 'utf-8');
  console.log('\n✅ nilai.api.ts patched successfully\n');

} catch (error) {
  console.error('❌ Error patching nilai.api.ts:', error.message);
  process.exit(1);
}
