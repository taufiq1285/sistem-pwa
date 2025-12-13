const fs = require('fs');
const path = require('path');

console.log('Applying final comprehensive fixes...\n');

// Fix 1: user.types.ts - move import before export
const userTypesPath = path.join(__dirname, 'src/types/user.types.ts');
let userTypes = fs.readFileSync(userTypesPath, 'utf8');

// Remove the import line after export
userTypes = userTypes.replace(/\n\/\/ Import for use in this file\nimport type \{ UserRole, AuthUser, RegisterData \} from '\.\/auth\.types';\n/, '\n');

// Add import at the very top
userTypes = userTypes.replace(
  /\/\*\*\n \* User Types/,
  `import type { UserRole, AuthUser, RegisterData } from './auth.types';\n\n/**\n * User Types`
);

fs.writeFileSync(userTypesPath, userTypes, 'utf8');
console.log('✓ Fixed: user.types.ts - moved import to top');

// Fix 2: peminjaman.types.ts - move import before export
const peminjamanTypesPath = path.join(__dirname, 'src/types/peminjaman.types.ts');
let peminjamanTypes = fs.readFileSync(peminjamanTypesPath, 'utf8');

// Remove the import if it exists after export
peminjamanTypes = peminjamanTypes.replace(/\n\/\/ Import for use in this file\nimport type \{ EquipmentCondition, BorrowingStatus \} from '\.\/inventaris\.types';\n/, '\n');

// Add import at the very top
if (!peminjamanTypes.includes('import type { EquipmentCondition, BorrowingStatus }')) {
  peminjamanTypes = peminjamanTypes.replace(
    /\/\*\*\n \* Peminjaman/,
    `import type { EquipmentCondition, BorrowingStatus } from './inventaris.types';\n\n/**\n * Peminjaman`
  );
}

fs.writeFileSync(peminjamanTypesPath, peminjamanTypes, 'utf8');
console.log('✓ Fixed: peminjaman.types.ts - moved import to top');

// Fix 3: OfflineSyncPage - replace all queueStats.synced
const offlineSyncPath = path.join(__dirname, 'src/pages/mahasiswa/OfflineSyncPage.tsx');
let offlineSync = fs.readFileSync(offlineSyncPath, 'utf8');

offlineSync = offlineSync.replace(/queueStats\.synced/g, 'queueStats.completed');

// Remove unused import line 30
offlineSync = offlineSync.replace(/^import \{[^}]*\} from '@\/lib\/offline\/indexeddb';\n/m, '');

fs.writeFileSync(offlineSyncPath, offlineSync, 'utf8');
console.log('✓ Fixed: OfflineSyncPage.tsx - replaced all synced references');

// Fix 4: QuizBuilder - fix remaining error reference on line 219
const quizBuilderPath = path.join(__dirname, 'src/components/features/kuis/builder/QuizBuilder.tsx');
let quizBuilder = fs.readFileSync(quizBuilderPath, 'utf8');

const lines = quizBuilder.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Line 219 (0-indexed 218)
  if (i === 218 && lines[i].includes('${error.message}')) {
    lines[i] = lines[i].replace(/\$\{error\.message\}/g, '${(_error as Error).message}');
  }
}
quizBuilder = lines.join('\n');

fs.writeFileSync(quizBuilderPath, quizBuilder, 'utf8');
console.log('✓ Fixed: QuizBuilder.tsx - fixed line 219');

// Fix 5: QuestionEditor - fix lines 222, 225
const questionEditorPath = path.join(__dirname, 'src/components/features/kuis/builder/QuestionEditor.tsx');
let questionEditor = fs.readFileSync(questionEditorPath, 'utf8');

const qeLines = questionEditor.split('\n');
for (let i = 0; i < qeLines.length; i++) {
  // Line 222
  if (i === 221 && qeLines[i].includes('tipe_soal:')) {
    qeLines[i] = qeLines[i].replace(
      'tipe_soal: formData.tipe_soal as any,',
      'tipe_soal: (formData.tipe_soal ?? \'pilihan_ganda\') as any,'
    );
  }
  // Line 225  
  if (i === 224 && qeLines[i].includes('jawaban_benar:')) {
    qeLines[i] = qeLines[i].replace(
      'jawaban_benar: formData.jawaban_benar ?? undefined,',
      'jawaban_benar: (formData.jawaban_benar || null) as any,'
    );
  }
}
questionEditor = qeLines.join('\n');

fs.writeFileSync(questionEditorPath, questionEditor, 'utf8');
console.log('✓ Fixed: QuestionEditor.tsx - fixed type assertions');

// Fix 6: Remove unused HomePage import
const routesPath = path.join(__dirname, 'src/routes/index.tsx');
let routes = fs.readFileSync(routesPath, 'utf8');

routes = routes.replace(/^.*HomePage.*\n/m, '');

fs.writeFileSync(routesPath, routes, 'utf8');
console.log('✓ Fixed: routes/index.tsx - removed HomePage import');

// Fix 7: Remove unused imports in sync.types.ts
const syncTypesPath = path.join(__dirname, 'src/types/sync.types.ts');
let syncTypes = fs.readFileSync(syncTypesPath, 'utf8');

// Remove or comment the unused import
syncTypes = syncTypes.replace(
  /\/\/ Import \(but don't re-export\) from offline\.types to avoid conflicts[\s\S]*?import type \{[^}]*\} from '\.\/offline\.types';/,
  '// Note: SyncConfig, SyncResult, SyncConflict are available from offline.types via index.ts'
);

fs.writeFileSync(syncTypesPath, syncTypes, 'utf8');
console.log('✓ Fixed: sync.types.ts - removed unused imports');

console.log('\nFinal comprehensive fixes applied!');
