/**
 * Script to automatically wrap all API functions with caching
 *
 * Usage: node wrap-all-apis.cjs
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'src', 'lib', 'api');

// List of API files to process
const apiFiles = [
  'dosen.api.ts',
  'mahasiswa.api.ts',
  'laboran.api.ts',
  'admin.api.ts',
  'kuis.api.ts',
  'jadwal.api.ts',
  'nilai.api.ts',
  'kehadiran.api.ts',
  'materi.api.ts',
  'announcements.api.ts',
  'analytics.api.ts',
  'mata-kuliah.api.ts',
  'kelas.api.ts',
  'users.api.ts',
];

console.log('🚀 Starting API wrapping process...\n');

apiFiles.forEach(file => {
  const filePath = path.join(API_DIR, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${file} (not found)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has cacheAPI import
    if (content.includes("from '@/lib/offline/api-cache'")) {
      console.log(`✅ ${file} - Already has caching import`);
    } else {
      // Add import after supabase import
      const supabaseImport = "import { supabase } from '@/lib/supabase/client';";
      if (content.includes(supabaseImport)) {
        content = content.replace(
          supabaseImport,
          `${supabaseImport}\nimport { cacheAPI } from '@/lib/offline/api-cache';`
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} - Added caching import`);
      } else {
        console.log(`⚠️  ${file} - No supabase import found, add manually`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n✅ API wrapping imports complete!');
console.log('\n📝 Next steps:');
console.log('1. Wrap individual functions with cacheAPI()');
console.log('2. Follow the pattern in README_API_CACHING.md');
console.log('3. Test each API file after wrapping');
