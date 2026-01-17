const fs = require('fs');
const path = require('path');

const routesConfigPath = path.join(__dirname, 'src/config/routes.config.ts');
let content = fs.readFileSync(routesConfigPath, 'utf8');

// Add PRESENSI to MAHASISWA routes
content = content.replace(
  /NILAI: '\/mahasiswa\/nilai',/,
  `NILAI: '/mahasiswa/nilai',\n    PRESENSI: '/mahasiswa/presensi',`
);

// Add PEMINJAMAN to LABORAN routes
content = content.replace(
  /INVENTARIS: '\/laboran\/inventaris',/,
  `INVENTARIS: '/laboran/inventaris',\n    PEMINJAMAN: '/laboran/peminjaman',`
);

fs.writeFileSync(routesConfigPath, content, 'utf8');
console.log('✓ Fixed: routes.config.ts - added missing PRESENSI and PEMINJAMAN routes');
