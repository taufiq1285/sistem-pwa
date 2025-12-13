const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kelas.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add middleware import after existing imports
if (!content.includes("from '@/lib/middleware'")) {
  const lastImport = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf(';', lastImport) + 1;
  const middlewareImport = `\nimport { requirePermission } from '@/lib/middleware';`;
  content = content.slice(0, endOfLastImport) + middlewareImport + content.slice(endOfLastImport);
}

// Step 2: Wrap each function EXCEPT createOrEnrollMahasiswa (we'll do it separately)
const simpleFunctions = [
  { name: 'createKelas', permission: 'manage:kelas' },
  { name: 'updateKelas', permission: 'manage:kelas' },
  { name: 'deleteKelas', permission: 'manage:kelas' },
  { name: 'enrollStudent', permission: 'manage:kelas_mahasiswa' },
  { name: 'unenrollStudent', permission: 'manage:kelas_mahasiswa' },
  { name: 'toggleStudentStatus', permission: 'manage:kelas_mahasiswa' },
];

simpleFunctions.forEach(({ name, permission }) => {
  // Change export to internal
  const exportRegex = new RegExp(`export async function ${name}\\(`, 'g');
  content = content.replace(exportRegex, `async function ${name}Impl(`);

  // Find function end and add wrapped export
  const implStart = content.indexOf(`async function ${name}Impl(`);
  if (implStart === -1) {
    console.warn(`⚠️  Function ${name} not found`);
    return;
  }

  let braceCount = 0;
  let inFunction = false;
  let endIndex = implStart;

  for (let i = implStart; i < content.length; i++) {
    if (content[i] === '{' && !inFunction) {
      inFunction = true;
      braceCount = 1;
      continue;
    }

    if (inFunction) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;

      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  // Add wrapped export after function
  const wrappedExport = `\n\n// 🔒 PROTECTED: Requires ${permission} permission\nexport const ${name} = requirePermission('${permission}', ${name}Impl);`;
  content = content.slice(0, endIndex) + wrappedExport + content.slice(endIndex);
});

// Step 3: Handle createOrEnrollMahasiswa separately (multiline signature)
// Find the exact pattern for this function
const createOrEnrollPattern = /export async function createOrEnrollMahasiswa\(/;
const match = content.search(createOrEnrollPattern);

if (match !== -1) {
  // Replace export with internal
  content = content.replace(
    /export async function createOrEnrollMahasiswa\(/,
    'async function createOrEnrollMahasiswaImpl('
  );

  // Find the function end
  const implStart = content.indexOf('async function createOrEnrollMahasiswaImpl(');
  let braceCount = 0;
  let inFunction = false;
  let endIndex = implStart;

  for (let i = implStart; i < content.length; i++) {
    if (content[i] === '{' && !inFunction) {
      inFunction = true;
      braceCount = 1;
      continue;
    }

    if (inFunction) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;

      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  // Add wrapped export
  const wrappedExport = `\n\n// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission\nexport const createOrEnrollMahasiswa = requirePermission('manage:kelas_mahasiswa', createOrEnrollMahasiswaImpl);`;
  content = content.slice(0, endIndex) + wrappedExport + content.slice(endIndex);
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ kelas.api.ts successfully wrapped!');
console.log('   Functions: createKelas, updateKelas, deleteKelas, enrollStudent, unenrollStudent, toggleStudentStatus, createOrEnrollMahasiswa');
