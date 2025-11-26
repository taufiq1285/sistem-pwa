/**
 * Fix Double Layout Issue in Laboran Pages
 * Remove AppLayout wrapper from components since routes already have it
 */

const fs = require('fs');
const path = require('path');

const laboranPages = [
  'LaboratoriumPage.tsx',
  'LaporanPage.tsx',
  'PersetujuanPage.tsx',
];

const basePath = 'F:/tes 9/sistem-praktikum-pwa/src/pages/laboran';

laboranPages.forEach((filename) => {
  const filePath = path.join(basePath, filename);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove AppLayout import
    content = content.replace(
      /import AppLayout from '@\/components\/layout\/AppLayout';\n?/g,
      ''
    );

    // 2. Remove opening <AppLayout> tag (with proper indentation)
    content = content.replace(
      /(\s*)<AppLayout>\n/g,
      ''
    );

    // 3. Remove closing </AppLayout> tag (with proper indentation)
    content = content.replace(
      /(\s*)<\/AppLayout>\n/g,
      ''
    );

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filename}`);

  } catch (error) {
    console.error(`❌ Error fixing ${filename}:`, error.message);
  }
});

console.log('\n✅ All laboran pages fixed!');
