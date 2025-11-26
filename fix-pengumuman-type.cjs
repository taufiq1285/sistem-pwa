const fs = require('fs');
const path = require('path');

const commonTypesPath = path.join(__dirname, 'src/types/common.types.ts');
let content = fs.readFileSync(commonTypesPath, 'utf8');

// Update PengumumanTable fallback to include all actual database columns
const oldPengumumanTable = `type PengumumanTable =
  Database['public']['Tables'] extends { pengumuman: { Row: infer R } }
    ? R
    : {
        id: string;
        judul: string;
        konten: string;
        tipe?: string | null;
        prioritas?: string | null;
        target_role?: string[] | null;
        target_kelas_id?: string | null;
        tanggal_mulai?: string | null;
        tanggal_selesai?: string | null;
        attachment_url?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
      };`;

const newPengumumanTable = `type PengumumanTable =
  Database['public']['Tables'] extends { pengumuman: { Row: infer R } }
    ? R
    : {
        id: string;
        judul: string;
        konten: string;
        tipe: string | null;
        prioritas: string | null;
        penulis_id: string;
        target_role: string[] | null;
        target_kelas_id: string | null;
        is_active: boolean | null;
        is_pinned: boolean | null;
        tanggal_mulai: string | null;
        tanggal_selesai: string | null;
        attachment_url: string | null;
        view_count: number | null;
        created_at: string | null;
        updated_at: string | null;
      };`;

content = content.replace(oldPengumumanTable, newPengumumanTable);

fs.writeFileSync(commonTypesPath, content, 'utf8');
console.log('✓ Fixed: common.types.ts - Updated PengumumanTable to match database schema');
