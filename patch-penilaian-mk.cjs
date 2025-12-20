const fs = require('fs');
const path = require('path');

console.log('📝 Patching PenilaianPage.tsx for independent mata kuliah selection...\n');

const filePath = path.join(__dirname, 'src/pages/dosen/PenilaianPage.tsx');

try {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changesMade = 0;

  // ============================================================================
  // PATCH 1: Add import for getMataKuliah
  // ============================================================================

  const oldImports = `import { getKelas, updateKelas } from "@/lib/api/kelas.api";
import { getMyKelas } from "@/lib/api/dosen.api";`;

  const newImports = `import { getKelas, updateKelas } from "@/lib/api/kelas.api";
import { getMyKelas } from "@/lib/api/dosen.api";
import { getMataKuliah } from "@/lib/api/mata-kuliah.api";`;

  if (content.includes('import { getMataKuliah }')) {
    console.log('✅ getMataKuliah import already exists');
  } else if (content.includes(oldImports)) {
    content = content.replace(oldImports, newImports);
    console.log('✅ Added getMataKuliah import');
    changesMade++;
  }

  // ============================================================================
  // PATCH 2: Fix loadMataKuliahDiajarkan to fetch from mata_kuliah table
  // ============================================================================

  const oldLoadMK = `  /**
   * Load mata kuliah yang diajarkan oleh dosen
   */
  const loadMataKuliahDiajarkan = async () => {
    try {
      setLoading(true);
      if (!user?.dosen?.id) return;

      // Get all kelas from assignment system
      const allKelas = await getMyKelas();

      // Extract unique mata kuliah from kelas
      const mataKuliahMap = new Map();
      allKelas.forEach((kelas) => {
        if (kelas.id && kelas.mata_kuliah_nama) {
          mataKuliahMap.set(kelas.id, {
            id: kelas.id,
            nama_mk: kelas.mata_kuliah_nama,
            kode_mk: kelas.mata_kuliah_kode || "",
          });
        }
      });

      const uniqueMataKuliah = Array.from(mataKuliahMap.values());
      setMataKuliahList(uniqueMataKuliah);

      // DO NOT auto-select: Dosen must manually choose
      // User should see welcome screen and choose manually
    } catch (error) {
      console.error("Error loading mata kuliah:", error);
      toast.error("Gagal memuat data mata kuliah");
    } finally {
      setLoading(false);
    }
  };`;

  const newLoadMK = `  /**
   * Load mata kuliah yang diajarkan oleh dosen
   */
  const loadMataKuliahDiajarkan = async () => {
    try {
      setLoading(true);
      if (!user?.dosen?.id) return;

      // 🎯 Fetch mata kuliah directly from mata_kuliah table
      // Dosen bebas pilih mata kuliah apapun yang aktif
      const mataKuliahData = await getMataKuliah({ is_active: true });
      const mataKuliahArray = mataKuliahData.map((mk: any) => ({
        id: mk.id,
        nama_mk: mk.nama_mk,
        kode_mk: mk.kode_mk,
      }));
      setMataKuliahList(mataKuliahArray);

      // DO NOT auto-select: Dosen must manually choose
      // User should see welcome screen and choose manually
    } catch (error) {
      console.error("Error loading mata kuliah:", error);
      toast.error("Gagal memuat data mata kuliah");
    } finally {
      setLoading(false);
    }
  };`;

  if (content.includes('// 🎯 Fetch mata kuliah directly from mata_kuliah table')) {
    console.log('✅ loadMataKuliahDiajarkan already patched');
  } else if (content.includes(oldLoadMK)) {
    content = content.replace(oldLoadMK, newLoadMK);
    console.log('✅ Fixed loadMataKuliahDiajarkan to fetch from mata_kuliah table');
    changesMade++;
  } else {
    console.log('⚠️  Could not find exact loadMataKuliahDiajarkan pattern');
  }

  // ============================================================================
  // PATCH 3: Fix loadKelas to NOT filter by mata kuliah
  // ============================================================================

  const oldLoadKelas = `  /**
   * Load kelas untuk mata kuliah yang dipilih
   */
  const loadKelas = async () => {
    try {
      setLoading(true);
      if (!user?.dosen?.id || !selectedMataKuliah) return;

      const allKelas = await getMyKelas();
      // Filter kelas by selected mata kuliah
      const data = allKelas.filter(kelas =>
        kelas.mata_kuliah_nama &&
        mataKuliahList.find(mk => mk.id === selectedMataKuliah)?.nama_mk === kelas.mata_kuliah_nama
      );
      setKelasList(data);

      // DO NOT auto-select: Dosen must manually choose kelas
      // User should see selection options and choose manually
    } catch (error) {
      console.error("Error loading kelas:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };`;

  const newLoadKelas = `  /**
   * Load kelas untuk mata kuliah yang dipilih
   */
  const loadKelas = async () => {
    try {
      setLoading(true);
      if (!user?.dosen?.id || !selectedMataKuliah) return;

      // 🎯 Load all kelas - dosen bebas pilih kelas manapun
      // Kelas dan mata kuliah dipilih independently
      const allKelas = await getMyKelas();
      setKelasList(allKelas);

      // DO NOT auto-select: Dosen must manually choose kelas
      // User should see selection options and choose manually
    } catch (error) {
      console.error("Error loading kelas:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };`;

  if (content.includes('// 🎯 Load all kelas - dosen bebas pilih kelas manapun')) {
    console.log('✅ loadKelas already patched');
  } else if (content.includes(oldLoadKelas)) {
    content = content.replace(oldLoadKelas, newLoadKelas);
    console.log('✅ Fixed loadKelas to not filter by mata kuliah');
    changesMade++;
  } else {
    console.log('⚠️  Could not find exact loadKelas pattern');
  }

  // ============================================================================
  // PATCH 4: Find and update batchUpdateNilai call to include mata_kuliah_id
  // ============================================================================

  // Search for the batch update call pattern
  const batchUpdatePattern = /await batchUpdateNilai\(\s*{\s*kelas_id:\s*selectedKelas,\s*nilai_list:/;

  if (content.match(batchUpdatePattern)) {
    // Replace the call to include mata_kuliah_id
    content = content.replace(
      /await batchUpdateNilai\(\s*{\s*kelas_id:\s*selectedKelas,\s*nilai_list:/,
      'await batchUpdateNilai({\n        kelas_id: selectedKelas,\n        mata_kuliah_id: selectedMataKuliah,\n        nilai_list:'
    );
    console.log('✅ Added mata_kuliah_id to batchUpdateNilai call');
    changesMade++;
  } else if (content.includes('mata_kuliah_id: selectedMataKuliah')) {
    console.log('✅ batchUpdateNilai already includes mata_kuliah_id');
  } else {
    console.log('⚠️  Could not find batchUpdateNilai call to patch');
  }

  // Write changes
  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`\n✅ PenilaianPage.tsx patched successfully (${changesMade} changes)\n`);
  } else {
    console.log('\n✅ No changes needed - all patches already applied\n');
  }

  console.log('🎯 Next steps:');
  console.log('   1. Run ADD_MK_TO_NILAI.sql di Supabase SQL Editor');
  console.log('   2. Refresh browser');
  console.log('   3. Test input nilai dengan pilih mata kuliah dan kelas');

} catch (error) {
  console.error('❌ Error patching PenilaianPage.tsx:', error.message);
  process.exit(1);
}
