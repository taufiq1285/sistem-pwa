const fs = require('fs');
const path = require('path');

console.log('Fixing duplicate type exports...\n');

// Fix 1: user.types.ts - don't re-export, just import what's needed
const userTypesPath = path.join(__dirname, 'src/types/user.types.ts');
let userTypes = fs.readFileSync(userTypesPath, 'utf8');

// Remove the re-export section at the top
userTypes = userTypes.replace(
  /\/\/ Re-export main user types from auth\.types[\s\S]*?from '\.\/auth\.types';/,
  `// Import types from auth.types for use in this file
// Note: Don't re-export to avoid duplication in index.ts
import type { UserRole, AuthUser, RegisterData } from './auth.types';`
);

fs.writeFileSync(userTypesPath, userTypes, 'utf8');
console.log('✓ Fixed: user.types.ts');

// Fix 2: peminjaman.types.ts - don't re-export, just import what's needed
const peminjamanTypesPath = path.join(__dirname, 'src/types/peminjaman.types.ts');
let peminjamanTypes = fs.readFileSync(peminjamanTypesPath, 'utf8');

// Remove the re-export section at the top
peminjamanTypes = peminjamanTypes.replace(
  /\/\/ Re-export main types from inventaris[\s\S]*?from '\.\/inventaris\.types';/,
  `// Import types from inventaris.types for use in this file
// Note: Don't re-export to avoid duplication in index.ts
import type { Inventaris, Peminjaman, CreatePeminjamanData, EquipmentCondition, BorrowingStatus } from './inventaris.types';`
);

fs.writeFileSync(peminjamanTypesPath, peminjamanTypes, 'utf8');
console.log('✓ Fixed: peminjaman.types.ts');

// Fix 3: sync.types.ts - import instead of re-export SyncConfig, SyncResult, SyncConflict
const syncTypesPath = path.join(__dirname, 'src/types/sync.types.ts');
let syncTypes = fs.readFileSync(syncTypesPath, 'utf8');

// Update to import instead of re-export for conflicting types
syncTypes = syncTypes.replace(
  /\/\/ Re-export main sync types from offline\.types[\s\S]*?from '\.\/offline\.types';/,
  `// Re-export some sync types from offline.types, import others to avoid duplication
export type {
  SyncOperation,
  SyncStatus,
  SyncEntity,
  SyncQueueItem,
} from './offline.types';

// Import (but don't re-export) to avoid duplication in index.ts
import type { SyncConfig as OfflineSyncConfig, SyncResult as OfflineSyncResult, SyncConflict as OfflineSyncConflict } from './offline.types';`
);

fs.writeFileSync(syncTypesPath, syncTypes, 'utf8');
console.log('✓ Fixed: sync.types.ts');

// Fix 4: common.types.ts - remove ApiResponse definition
const commonTypesPath = path.join(__dirname, 'src/types/common.types.ts');
let commonTypes = fs.readFileSync(commonTypesPath, 'utf8');

// Remove ApiResponse interface
commonTypes = commonTypes.replace(
  /export interface ApiResponse<T> \{[\s\S]*?\}/,
  `// ApiResponse is defined in api.types.ts - import from there if needed`
);

fs.writeFileSync(commonTypesPath, commonTypes, 'utf8');
console.log('✓ Fixed: common.types.ts');

// Fix 5: dosen.types.ts - remove MataKuliahWithStats definition
const dosenTypesPath = path.join(__dirname, 'src/types/dosen.types.ts');
let dosenTypes = fs.readFileSync(dosenTypesPath, 'utf8');

// Remove MataKuliahWithStats interface
dosenTypes = dosenTypes.replace(
  /export interface MataKuliahWithStats \{[\s\S]*?\n\}/,
  `// MataKuliahWithStats is defined in mata-kuliah.types.ts - import from there if needed`
);

fs.writeFileSync(dosenTypesPath, dosenTypes, 'utf8');
console.log('✓ Fixed: dosen.types.ts');

console.log('\nAll fixes applied!');
