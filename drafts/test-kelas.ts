import { supabase } from './src/lib/supabase/client';

async function test() {
  try {
    const { data, error } = await supabase.from("kelas").select("id, nama_kelas, mata_kuliah_id, mata_kuliah(nama_mk, kode_mk)").eq('nama_kelas', 'A');
    console.log(JSON.stringify(data, null, 2));
    if (error) console.error(error);
  } catch (e) {
    console.error(e);
  }
}

test();
