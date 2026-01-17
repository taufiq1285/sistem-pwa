const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/laboran.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add middleware import after existing imports
if (!content.includes("from '@/lib/middleware'")) {
  const lastImport = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf(';', lastImport) + 1;
  const middlewareImport = `\nimport { requirePermission } from '@/lib/middleware';`;
  content = content.slice(0, endOfLastImport) + middlewareImport + content.slice(endOfLastImport);
}

const functionsToWrap = [
  { name: 'processApproval', permission: 'manage:peminjaman' },
  { name: 'updateLaboratorium', permission: 'manage:laboratorium' },
  { name: 'createLaboratorium', permission: 'manage:laboratorium' },
  { name: 'deleteLaboratorium', permission: 'manage:laboratorium' },
];

functionsToWrap.forEach(({ name, permission }) => {
  // Replace 'export async function' with 'async function' and add 'Impl'
  const exportPattern = new RegExp(`export async function ${name}\\(`, 'g');
  content = content.replace(exportPattern, `async function ${name}Impl(`);

  // Find the function and add wrapped export after it
  const implPattern = new RegExp(`async function ${name}Impl\\(`);
  const implStart = content.search(implPattern);

  if (implStart === -1) {
    console.warn(`⚠️  Function ${name} not found`);
    return;
  }

  // Find the end of the function by counting braces
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

  // Find the next line after the closing brace
  let insertIndex = endIndex;
  while (insertIndex < content.length && content[insertIndex] === '\n') {
    insertIndex++;
  }
  insertIndex--; // Go back one to insert before the next content

  // Add wrapped export
  const wrappedExport = `\n// 🔒 PROTECTED: Requires ${permission} permission\nexport const ${name} = requirePermission('${permission}', ${name}Impl);\n`;
  content = content.slice(0, insertIndex) + wrappedExport + content.slice(insertIndex);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ laboran.api.ts successfully wrapped!');
console.log('   Functions: ' + functionsToWrap.map(f => f.name).join(', '));
