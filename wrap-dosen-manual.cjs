const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/dosen.api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add middleware import after existing imports
const importPattern = /import { supabase } from '@\/lib\/supabase\/client';/;
const middlewareImport = `import { supabase } from '@/lib/supabase/client';\nimport { requirePermission } from '@/lib/middleware';`;
content = content.replace(importPattern, middlewareImport);

// Step 2: Wrap createBorrowingRequest function
content = content.replace(
  /export async function createBorrowingRequest\(data: {/,
  'async function createBorrowingRequestImpl(data: {'
);

// Find the end of createBorrowingRequestImpl function and add wrapped export
const createBorrowingEndPattern = /(\}\n)(\n\/\*\*\n \* Get available equipment for borrowing)/;
content = content.replace(
  createBorrowingEndPattern,
  '$1\n// 🔒 PROTECTED: Requires create:peminjaman permission\nexport const createBorrowingRequest = requirePermission(\'create:peminjaman\', createBorrowingRequestImpl);$2'
);

// Step 3: Wrap returnBorrowingRequest function
content = content.replace(
  /export async function returnBorrowingRequest\(data: {/,
  'async function returnBorrowingRequestImpl(data: {'
);

// Find the end of returnBorrowingRequestImpl function and add wrapped export
const returnBorrowingEndPattern = /(\}\n)(\n\/\*\*\n \* Mark borrowing as in_use when dosen takes)/;
content = content.replace(
  returnBorrowingEndPattern,
  '$1\n// 🔒 PROTECTED: Requires update:peminjaman permission\nexport const returnBorrowingRequest = requirePermission(\'update:peminjaman\', returnBorrowingRequestImpl);$2'
);

// Step 4: Wrap markBorrowingAsTaken function
content = content.replace(
  /export async function markBorrowingAsTaken\(peminjaman_id: string\): Promise<{ id: string }> {/,
  'async function markBorrowingAsTakenImpl(peminjaman_id: string): Promise<{ id: string }> {'
);

// Find the end of markBorrowingAsTakenImpl function and add wrapped export
const markBorrowingEndPattern = /(\}\n)(\n\/\/ =+\n\/\/ EXPORTS)/;
content = content.replace(
  markBorrowingEndPattern,
  '$1\n// 🔒 PROTECTED: Requires update:peminjaman permission\nexport const markBorrowingAsTaken = requirePermission(\'update:peminjaman\', markBorrowingAsTakenImpl);$2'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ dosen.api.ts successfully wrapped!');
console.log('   Functions: createBorrowingRequest, returnBorrowingRequest, markBorrowingAsTaken');
