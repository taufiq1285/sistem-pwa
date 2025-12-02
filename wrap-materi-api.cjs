const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/materi.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Rename createMateri to createMateriImpl
content = content.replace(
  /export async function createMateri\(/,
  'async function createMateriImpl('
);

// Step 2: Rename updateMateri to updateMateriImpl
content = content.replace(
  /export async function updateMateri\(/,
  'async function updateMateriImpl('
);

// Step 3: Rename deleteMateri to deleteMateriImpl
content = content.replace(
  /export async function deleteMateri\(/,
  'async function deleteMateriImpl('
);

// Step 4: Add wrapped createMateri export after createMateriImpl
const createMateriImplIndex = content.indexOf('async function createMateriImpl(');
if (createMateriImplIndex !== -1) {
  // Find the end of createMateriImpl function
  const startBraceIndex = content.indexOf('{', createMateriImplIndex);
  let braceCount = 1;
  let endIndex = startBraceIndex + 1;

  while (braceCount > 0 && endIndex < content.length) {
    if (content[endIndex] === '{') braceCount++;
    if (content[endIndex] === '}') braceCount--;
    endIndex++;
  }

  const wrappedExport = `\n\n// 🔒 PROTECTED: Only dosen can create materi\nexport const createMateri = requirePermission('manage:materi', createMateriImpl);\n`;
  content = content.slice(0, endIndex) + wrappedExport + content.slice(endIndex);
}

// Step 5: Add wrapped updateMateri export after updateMateriImpl
const updateMateriImplIndex = content.indexOf('async function updateMateriImpl(');
if (updateMateriImplIndex !== -1) {
  const startBraceIndex = content.indexOf('{', updateMateriImplIndex);
  let braceCount = 1;
  let endIndex = startBraceIndex + 1;

  while (braceCount > 0 && endIndex < content.length) {
    if (content[endIndex] === '{') braceCount++;
    if (content[endIndex] === '}') braceCount--;
    endIndex++;
  }

  const wrappedExport = `\n\n// 🔒 PROTECTED: Only dosen can update their own materi\nexport const updateMateri = requirePermissionAndOwnership(\n  'manage:materi',\n  'materi',\n  'dosen_id',\n  updateMateriImpl\n);\n`;
  content = content.slice(0, endIndex) + wrappedExport + content.slice(endIndex);
}

// Step 6: Add wrapped deleteMateri export after deleteMateriImpl
const deleteMateriImplIndex = content.indexOf('async function deleteMateriImpl(');
if (deleteMateriImplIndex !== -1) {
  const startBraceIndex = content.indexOf('{', deleteMateriImplIndex);
  let braceCount = 1;
  let endIndex = startBraceIndex + 1;

  while (braceCount > 0 && endIndex < content.length) {
    if (content[endIndex] === '{') braceCount++;
    if (content[endIndex] === '}') braceCount--;
    endIndex++;
  }

  const wrappedExport = `\n\n// 🔒 PROTECTED: Only dosen can delete their own materi\nexport const deleteMateri = requirePermissionAndOwnership(\n  'manage:materi',\n  'materi',\n  'dosen_id',\n  deleteMateriImpl\n);\n`;
  content = content.slice(0, endIndex) + wrappedExport + content.slice(endIndex);
}

// Step 7: Fix internal calls - publishMateri and unpublishMateri should call updateMateriImpl
content = content.replace(
  /return await updateMateri\(id, \{/g,
  'return await updateMateriImpl(id, {'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ materi.api.ts successfully wrapped!');
