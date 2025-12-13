const fs = require('fs');
const path = require('path');

const offlineSyncPath = path.join(__dirname, 'src/pages/mahasiswa/OfflineSyncPage.tsx');
let content = fs.readFileSync(offlineSyncPath, 'utf8');

// Find the commented getStatusBadge and fix it
content = content.replace(
  /\/\/ const getStatusBadge = \(status: string\) => \{/,
  'const getStatusBadge = (status: string) => {'
);

fs.writeFileSync(offlineSyncPath, content, 'utf8');
console.log('✓ Fixed: OfflineSyncPage.tsx - uncommented getStatusBadge');
