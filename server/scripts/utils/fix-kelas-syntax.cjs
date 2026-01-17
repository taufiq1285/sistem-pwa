const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kelas.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the incorrectly placed export statement in createOrEnrollMahasiswaImpl
// Remove the export statement from the middle of function signature
content = content.replace(
  /data: {\s+nim: string;\s+full_name: string;\s+email: string;\s+\n\/\/ 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission\nexport const createOrEnrollMahasiswa = requirePermission\('manage:kelas_mahasiswa', createOrEnrollMahasiswaImpl\);\n}/,
  `data: {
    nim: string;
    full_name: string;
    email: string;
  }`
);

// Find the end of createOrEnrollMahasiswaImpl function and add the export there
// The function should end with a closing brace followed by newline
const functionEnd = /(\}\n)(\n\/\/ =+ or export)/;

// If we can't find that pattern, look for the end of the catch block
if (!content.match(functionEnd)) {
  // Find the catch block ending for createOrEnrollMahasiswaImpl
  const lines = content.split('\n');
  let foundImpl = false;
  let braceCount = 0;
  let insertLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('async function createOrEnrollMahasiswaImpl')) {
      foundImpl = true;
      continue;
    }

    if (foundImpl) {
      // Count braces to find function end
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }

      if (braceCount === 0 && line.trim() === '}') {
        insertLine = i + 1;
        break;
      }
    }
  }

  if (insertLine !== -1) {
    // Insert the export statement
    lines.splice(insertLine, 0, '');
    lines.splice(insertLine + 1, 0, '// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission');
    lines.splice(insertLine + 2, 0, 'export const createOrEnrollMahasiswa = requirePermission(\'manage:kelas_mahasiswa\', createOrEnrollMahasiswaImpl);');

    content = lines.join('\n');
  }
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ kelas.api.ts syntax error fixed!');
