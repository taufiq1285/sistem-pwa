const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kelas.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add middleware import after existing imports
if (!content.includes("from '@/lib/middleware'")) {
  // Find the end of the imports section (look for first non-import line)
  const lines = content.split('\n');
  let lastImportLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim() === '') {
      if (lines[i].trim().startsWith('import ')) {
        lastImportLine = i;
      }
    } else {
      break;
    }
  }

  if (lastImportLine !== -1) {
    lines.splice(lastImportLine + 1, 0, "import { requirePermission } from '@/lib/middleware';");
    content = lines.join('\n');
  }
}

// Step 2: Wrap each function individually
const functionsToWrap = [
  { name: 'createKelas', permission: 'manage:kelas' },
  { name: 'updateKelas', permission: 'manage:kelas' },
  { name: 'deleteKelas', permission: 'manage:kelas' },
  { name: 'enrollStudent', permission: 'manage:kelas_mahasiswa' },
  { name: 'unenrollStudent', permission: 'manage:kelas_mahasiswa' },
  { name: 'toggleStudentStatus', permission: 'manage:kelas_mahasiswa' },
  { name: 'createOrEnrollMahasiswa', permission: 'manage:kelas_mahasiswa' },
];

functionsToWrap.forEach(({ name, permission }) => {
  // Step A: Change export to internal
  content = content.replace(
    new RegExp(`export async function ${name}\\(`, 'g'),
    `async function ${name}Impl(`
  );

  // Step B: Find the function and locate its end
  const funcStart = content.indexOf(`async function ${name}Impl(`);
  if (funcStart === -1) {
    console.warn(`⚠️  Function ${name} not found`);
    return;
  }

  // Find the opening brace of the function body
  let bodyStart = -1;
  for (let i = funcStart; i < content.length; i++) {
    if (content[i] === '{') {
      bodyStart = i;
      break;
    }
  }

  if (bodyStart === -1) {
    console.warn(`⚠️  Function ${name} body not found`);
    return;
  }

  // Count braces from the body start to find the end
  let braceCount = 1; // We already have the opening brace
  let bodyEnd = -1;

  for (let i = bodyStart + 1; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;

    if (braceCount === 0) {
      bodyEnd = i;
      break;
    }
  }

  if (bodyEnd === -1) {
    console.warn(`⚠️  Function ${name} end not found`);
    return;
  }

  // Add wrapped export after the closing brace
  const wrappedExport = `\n\n// 🔒 PROTECTED: Requires ${permission} permission\nexport const ${name} = requirePermission('${permission}', ${name}Impl);`;
  content = content.slice(0, bodyEnd + 1) + wrappedExport + content.slice(bodyEnd + 1);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ kelas.api.ts successfully wrapped!');
console.log('   Functions: ' + functionsToWrap.map(f => f.name).join(', '));
