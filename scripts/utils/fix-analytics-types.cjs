const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript errors in Analytics Page...\n');

const filePath = path.join(__dirname, 'src/pages/admin/AnalyticsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Change kuis_attempts to attempt_kuis
content = content.replace(
  "supabase.from('kuis_attempts').select('id', { count: 'exact', head: true }),",
  "supabase.from('attempt_kuis').select('id', { count: 'exact', head: true }),"
);

// Fix 2: Remove 'borrowed' status check, use only 'approved'
content = content.replace(
  `const activeBorrowings = borrowings.filter(b =>
        b.status === 'approved' || b.status === 'borrowed'
      ).length;`,
  `const activeBorrowings = borrowings.filter(b =>
        b.status === 'approved'
      ).length;`
);

// Fix 3: Change stok_tersedia to jumlah_tersedia
content = content.replace(
  "supabase.from('inventaris').select('stok_tersedia'),",
  "supabase.from('inventaris').select('jumlah_tersedia'),"
);

content = content.replace(
  "const availableEquipment = equipment.filter(e => (e.stok_tersedia || 0) > 0).length;",
  "const availableEquipment = equipment.filter(e => (e.jumlah_tersedia || 0) > 0).length;"
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed TypeScript errors:');
console.log('   1. Changed kuis_attempts → attempt_kuis');
console.log('   2. Removed invalid "borrowed" status');
console.log('   3. Changed stok_tersedia → jumlah_tersedia');
