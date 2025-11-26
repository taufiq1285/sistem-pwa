const fs = require('fs');
const path = require('path');

console.log('Fixing type exports to maintain backward compatibility...\n');

// Fix 1: user.types.ts - re-export types
const userTypesPath = path.join(__dirname, 'src/types/user.types.ts');
let userTypes = fs.readFileSync(userTypesPath, 'utf8');

userTypes = userTypes.replace(
  /\/\/ Import types from auth\.types for use in this file\n\/\/ Note: Don't re-export to avoid duplication in index\.ts\nimport type \{ UserRole, AuthUser, RegisterData \} from '\.\/auth\.types';/,
  `// Re-export types from auth.types for backward compatibility
// Note: index.ts exports both files, but TypeScript handles this correctly
export type { UserRole, AuthUser, RegisterData, RegisterableRole } from './auth.types';`
);

fs.writeFileSync(userTypesPath, userTypes, 'utf8');
console.log('✓ Fixed: user.types.ts');

// Fix 2: peminjaman.types.ts - re-export types
const peminjamanTypesPath = path.join(__dirname, 'src/types/peminjaman.types.ts');
let peminjamanTypes = fs.readFileSync(peminjamanTypesPath, 'utf8');

peminjamanTypes = peminjamanTypes.replace(
  /\/\/ Import types from inventaris\.types for use in this file\n\/\/ Note: Don't re-export to avoid duplication in index\.ts\nimport type \{ Inventaris, Peminjaman, CreatePeminjamanData, EquipmentCondition, BorrowingStatus \} from '\.\/inventaris\.types';/,
  `// Re-export types from inventaris.types for backward compatibility
export type { Inventaris, Peminjaman, CreatePeminjamanData, EquipmentCondition, BorrowingStatus } from './inventaris.types';`
);

fs.writeFileSync(peminjamanTypesPath, peminjamanTypes, 'utf8');
console.log('✓ Fixed: peminjaman.types.ts');

// Fix 3: sync.types.ts - update comment
const syncTypesPath = path.join(__dirname, 'src/types/sync.types.ts');
let syncTypes = fs.readFileSync(syncTypesPath, 'utf8');

// Just update to re-export everything from offline.types
syncTypes = syncTypes.replace(
  /\/\/ Re-export some sync types from offline\.types, import others to avoid duplication\nexport type \{\n  SyncOperation,\n  SyncStatus,\n  SyncEntity,\n  SyncQueueItem,\n\} from '\.\/offline\.types';\n\n\/\/ Import \(but don't re-export\) to avoid duplication in index\.ts\nimport type \{ SyncConfig as OfflineSyncConfig, SyncResult as OfflineSyncResult, SyncConflict as OfflineSyncConflict \} from '\.\/offline\.types';/,
  `// Re-export types from offline.types
// Note: We only re-export what we don't override
export type {
  SyncOperation,
  SyncStatus,
  SyncEntity,
  SyncQueueItem,
  SyncConfig,
  SyncResult,
  SyncConflict,
} from './offline.types';`
);

fs.writeFileSync(syncTypesPath, syncTypes, 'utf8');
console.log('✓ Fixed: sync.types.ts');

console.log('\nAll fixes applied!');
