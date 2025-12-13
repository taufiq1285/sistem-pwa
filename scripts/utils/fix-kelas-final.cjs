const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kelas.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Remove the incorrectly placed export statement (lines 470-472)
content = content.replace(
  /\}\n\n\/\/ 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission\nexport const createOrEnrollMahasiswa = requirePermission\('manage:kelas_mahasiswa', createOrEnrollMahasiswaImpl\);\n\): Promise/,
  `}
): Promise`
);

// Step 2: Find the end of createOrEnrollMahasiswaImpl function and add export there
// Look for the pattern: closing brace, then newline, then closing brace (end of function)
const lines = content.split('\n');
let foundImpl = false;
let braceCount = 0;
let insertLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('async function createOrEnrollMahasiswaImpl')) {
    foundImpl = true;
    braceCount = 0;
    continue;
  }

  if (foundImpl) {
    // Count braces
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    // When we reach the end of the function (braceCount back to 0)
    if (braceCount === 0 && line.trim() === '}') {
      insertLine = i;
      break;
    }
  }
}

if (insertLine !== -1) {
  // Insert the export statement after the closing brace
  lines.splice(insertLine + 1, 0, '');
  lines.splice(insertLine + 2, 0, '// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission');
  lines.splice(insertLine + 3, 0, 'export const createOrEnrollMahasiswa = requirePermission(\'manage:kelas_mahasiswa\', createOrEnrollMahasiswaImpl);');

  content = lines.join('\n');
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ kelas.api.ts syntax error fixed!');
