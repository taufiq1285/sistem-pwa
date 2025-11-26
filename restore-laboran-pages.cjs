const fs = require('fs');
const path = require('path');

const laboranPages = [
  { file: 'PersetujuanPage.tsx', title: 'Persetujuan' },
  { file: 'LaboratoriumPage.tsx', title: 'Laboratorium' },
  { file: 'LaporanPage.tsx', title: 'Laporan' },
];

const basePath = 'F:/tes 9/sistem-praktikum-pwa/src/pages/laboran';

laboranPages.forEach(({ file }) => {
  const filePath = path.join(basePath, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if AppLayout import already exists
    if (!content.includes("import AppLayout from '@/components/layout/AppLayout'")) {
      // Add import after first import line
      content = content.replace(
        /(import.*from.*;\n)/,
        "$1import AppLayout from '@/components/layout/AppLayout';\n"
      );
    }
    
    // Check if return already has AppLayout
    if (!content.includes('return (\n    <AppLayout>')) {
      // Wrap return content with AppLayout
      content = content.replace(
        /return \(\n    <div/,
        'return (\n    <AppLayout>\n      <div'
      );
      
      // Add closing tag before last closing of component
      content = content.replace(
        /(\s+)<\/div>\n  \);\n};/,
        '$1</div>\n    </AppLayout>\n  );\n};'
      );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n✅ All files restored with AppLayout!');
