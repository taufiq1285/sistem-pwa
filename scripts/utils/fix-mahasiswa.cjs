const fs = require('fs');
const content = fs.readFileSync('src/lib/api/mahasiswa.api.ts', 'utf8');

// Fix enrollToKelas
let fixed = content.replace(
  /async function enrollToKelasImpl\(kelasId: string\): Promise<\{ success: boolean; message: string \}\n\n\/\/ 🔒 PROTECTED: Requires enroll:kelas permission\nexport const enrollToKelas = requirePermission\('enroll:kelas', enrollToKelasImpl\);\n> \{/s,
  `async function enrollToKelasImpl(kelasId: string): Promise<{ success: boolean; message: string }> {`
);

// Fix unenrollFromKelas
fixed = fixed.replace(
  /async function unenrollFromKelasImpl\(kelasId: string\): Promise<\{ success: boolean; message: string \}\n\n\/\/ 🔒 PROTECTED: Requires enroll:kelas permission\nexport const unenrollFromKelas = requirePermission\('enroll:kelas', unenrollFromKelasImpl\);\n> \{/s,
  `async function unenrollFromKelasImpl(kelasId: string): Promise<{ success: boolean; message: string }> {`
);

// Add exports after functions
fixed = fixed.replace(
  /(\n  \}\n\})\n\nasync function unenrollFromKelasImpl/,
  `$1\n\n// 🔒 PROTECTED: Requires enroll:kelas permission\nexport const enrollToKelas = requirePermission('enroll:kelas', enrollToKelasImpl);\n\nasync function unenrollFromKelasImpl`
);

fixed = fixed.replace(
  /(\n  \}\n\})\n\n\/\/ ={12,}\n\/\/ MY CLASSES/,
  `$1\n\n// 🔒 PROTECTED: Requires enroll:kelas permission\nexport const unenrollFromKelas = requirePermission('enroll:kelas', unenrollFromKelasImpl);\n\n// ============================================================================\n// MY CLASSES`
);

fs.writeFileSync('src/lib/api/mahasiswa.api.ts', fixed, 'utf8');
console.log('✅ Fixed mahasiswa.api.ts');
