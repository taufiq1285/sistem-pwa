const fs = require('fs');
const path = require('path');

/**
 * Improved API wrapping script with better regex
 */

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node wrap-api-improved.cjs <filename> <functions_json>');
  process.exit(1);
}

const filename = args[0];
const functionsToWrap = JSON.parse(args[1]);

const filePath = path.join(__dirname, 'src/lib/api', filename);
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add middleware import if not present
if (!content.includes("from '@/lib/middleware'")) {
  const importIndex = content.indexOf('\n\n', content.lastIndexOf('import '));
  if (importIndex > -1) {
    const middlewareImport = `\nimport {\n  requirePermission,\n  requirePermissionAndOwnership,\n} from '@/lib/middleware';`;
    content = content.slice(0, importIndex) + middlewareImport + content.slice(importIndex);
  }
}

// Step 2: Wrap each function
functionsToWrap.forEach(({ name, permission, ownership, table }) => {
  // Find function definition with multiline support
  const functionPattern = new RegExp(
    `export\\s+async\\s+function\\s+${name}\\s*\\([^)]*\\)\\s*:\\s*Promise<[^>]+>`,
    ''
  );

  const match = content.match(functionPattern);
  if (!match) {
    console.warn(`⚠️  Function ${name} not found`);
    return;
  }

  // Replace 'export async function' with 'async function' and add 'Impl'
  content = content.replace(
    functionPattern,
    match[0].replace('export async function', 'async function').replace(name, `${name}Impl`)
  );

  // Find where the function ends (next 'export' or 'async function' or end of file)
  const implStart = content.indexOf(`async function ${name}Impl`);
  let searchStart = implStart + 100;

  // Find the closing brace of the function
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
  let wrappedExport;
  if (ownership && table) {
    wrappedExport = `\n\n// 🔒 PROTECTED: Requires ${permission} permission + ownership check\nexport const ${name} = requirePermissionAndOwnership(\n  '${permission}',\n  '${table}',\n  '${ownership}',\n  ${name}Impl\n);`;
  } else {
    wrappedExport = `\n\n// 🔒 PROTECTED: Requires ${permission} permission\nexport const ${name} = requirePermission('${permission}', ${name}Impl);`;
  }

  content = content.slice(0, endIndex) + wrappedExport + content.slice(endIndex);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ ${filename} successfully wrapped!`);
console.log(`   Functions: ${functionsToWrap.map(f => f.name).join(', ')}`);
