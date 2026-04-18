import { supabase } from './src/lib/supabase/client';
import { getAllJadwalForLaboran } from './src/lib/api/jadwal.api';

async function test() {
  try {
    const data = await supabase.from("jadwal_praktikum").select(`
          *,
          kelas:kelas_id (
            nama_kelas,
            kode_kelas,
            mata_kuliah:mata_kuliah_id (
              nama_mk,
              kode_mk
            )
          )
        `).eq('is_active', true);
    
    console.log(JSON.stringify(data.data?.[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
