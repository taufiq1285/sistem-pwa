const fs = require('fs');
const path = require('path');

/**
 * Generic API wrapping script
 * Usage: node wrap-api-generic.cjs <filename> <functions_json>
 *
 * Example:
 * node wrap-api-generic.cjs jadwal.api.ts '[{"name":"createJadwal","permission":"manage:jadwal"},{"name":"updateJadwal","permission":"manage:jadwal","ownership":"dosen_id"},{"name":"deleteJadwal","permission":"manage:jadwal","ownership":"dosen_id"}]'
 */

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node wrap-api-generic.cjs <filename> <functions_json>');
  process.exit(1);
}

const filename = args[0];
const functionsToWrap = JSON.parse(args[1]);

const filePath = path.join(__dirname, 'src/lib/api', filename);
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add middleware import if not present
if (!content.includes("from '@/lib/middleware'")) {
  const lastImportIndex = content.lastIndexOf('import ');
  const nextLineIndex = content.indexOf('\n', lastImportIndex);

  const middlewareImport = `import {\n  requirePermission,\n  requirePermissionAndOwnership,\n} from '@/lib/middleware';\n`;

  content = content.slice(0, nextLineIndex + 1) + middlewareImport + content.slice(nextLineIndex + 1);
}

// Step 2: Process each function
functionsToWrap.forEach(({ name, permission, ownership, table }) => {
  const functionRegex = new RegExp(`export async function ${name}\\(`, 'g');

  // Rename to *Impl
  content = content.replace(functionRegex, `async function ${name}Impl(`);

  // Find the end of the function
  const implIndex = content.indexOf(`async function ${name}Impl(`);
  if (implIndex === -1) return;

  const startBraceIndex = content.indexOf('{', implIndex);
  let braceCount = 1;
  let endIndex = startBraceIndex + 1;

  while (braceCount > 0 && endIndex < content.length) {
    if (content[endIndex] === '{') braceCount++;
    if (content[endIndex] === '}') braceCount--;
    endIndex++;
  }

  // Add wrapped export
  let wrappedExport;
  if (ownership && table) {
    wrappedExport = `\n\n// 🔒 PROTECTED: Requires ${permission} permission + ownership check\nexport const ${name} = requirePermissionAndOwnership(\n  '${permission}',\n  '${table}',\n  '${ownership}',\n  ${name}Impl\n);\n`;
  } else {
    wrappedExport = `\n\n// 🔒 PROTECTED: Requires ${permission} permission\nexport const ${name} = requirePermission('${permission}', ${name}Impl);\n`;
  }

  content = content.slice(0, endIndex) + wrappedExport + content.slice(endIndex);
});

// Step 3: Fix internal calls - replace function calls to *Impl
functionsToWrap.forEach(({ name }) => {
  // Look for internal calls like: await functionName(
  // But NOT in comments or the export statement itself
  const callRegex = new RegExp(`(\\s+await\\s+|return\\s+await\\s+)${name}\\(`, 'g');
  content = content.replace(callRegex, `$1${name}Impl(`);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ ${filename} successfully wrapped!`);
console.log(`   Functions wrapped: ${functionsToWrap.map(f => f.name).join(', ')}`);
