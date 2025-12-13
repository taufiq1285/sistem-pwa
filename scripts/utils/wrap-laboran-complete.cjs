const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/laboran.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add middleware import
if (!content.includes("from '@/lib/middleware'")) {
  const lines = content.split('\n');
  let lastImportLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportLine = i;
    } else if (lines[i].trim() !== '' && !lines[i].trim().startsWith('import')) {
      break;
    }
  }

  if (lastImportLine !== -1) {
    lines.splice(lastImportLine + 1, 0, "import { requirePermission } from '@/lib/middleware';");
    content = lines.join('\n');
  }
}

// Step 2: Define functions to wrap with their permissions
const functionsToWrap = [
  // Peminjaman management
  { name: 'approvePeminjaman', permission: 'manage:peminjaman' },
  { name: 'rejectPeminjaman', permission: 'manage:peminjaman' },
  { name: 'processApproval', permission: 'manage:peminjaman' },

  // Inventaris management
  { name: 'createInventaris', permission: 'manage:inventaris' },
  { name: 'updateInventaris', permission: 'manage:inventaris' },
  { name: 'deleteInventaris', permission: 'manage:inventaris' },
  { name: 'updateStock', permission: 'manage:inventaris' },

  // Laboratorium management
  { name: 'updateLaboratorium', permission: 'manage:laboratorium' },
  { name: 'createLaboratorium', permission: 'manage:laboratorium' },
  { name: 'deleteLaboratorium', permission: 'manage:laboratorium' },
];

functionsToWrap.forEach(({ name, permission }) => {
  // Change export to internal
  content = content.replace(
    new RegExp(`export async function ${name}\\(`, 'g'),
    `async function ${name}Impl(`
  );

  // Find function start
  const funcPattern = `async function ${name}Impl(`;
  const funcStart = content.indexOf(funcPattern);

  if (funcStart === -1) {
    console.warn(`⚠️  Function ${name} not found`);
    return;
  }

  // Find the Promise return type, then find the { after it
  const promisePattern = /: Promise<[^>]+>/;
  let searchStart = funcStart;
  let bodyStart = -1;

  // Search for ": Promise<...>" pattern after function start
  const remainingContent = content.slice(funcStart);
  const promiseMatch = remainingContent.match(promisePattern);

  if (promiseMatch) {
    // Found Promise type, now find the opening brace after it
    const promiseEnd = funcStart + promiseMatch.index + promiseMatch[0].length;
    for (let i = promiseEnd; i < content.length; i++) {
      if (content[i] === '{') {
        bodyStart = i;
        break;
      }
    }
  } else {
    // No Promise type, look for first { after function start
    for (let i = funcStart; i < content.length; i++) {
      // Skip parameter object braces
      if (content.substring(funcStart, i).includes(': {')) {
        continue;
      }
      if (content[i] === '{' && !content.substring(funcStart, i).match(/\(.*{/)) {
        bodyStart = i;
        break;
      }
    }
  }

  if (bodyStart === -1) {
    console.warn(`⚠️  Function ${name} body start not found`);
    return;
  }

  // Count braces to find function end
  let braceCount = 1;
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

  // Add wrapped export
  const wrappedExport = `\n\n// 🔒 PROTECTED: Requires ${permission} permission\nexport const ${name} = requirePermission('${permission}', ${name}Impl);`;
  content = content.slice(0, bodyEnd + 1) + wrappedExport + content.slice(bodyEnd + 1);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ laboran.api.ts successfully wrapped!');
console.log('   Functions: ' + functionsToWrap.map(f => f.name).join(', '));
