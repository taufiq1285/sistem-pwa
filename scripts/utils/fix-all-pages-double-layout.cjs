const fs = require('fs');
const path = require('path');

/**
 * Fix double AppLayout wrapper in ALL role pages
 * The routes already wrap pages with AppLayout, so pages shouldn't include it themselves
 */

const roleDirs = [
  { name: 'dosen', path: path.join(__dirname, 'src/pages/dosen') },
  { name: 'mahasiswa', path: path.join(__dirname, 'src/pages/mahasiswa') },
  { name: 'laboran', path: path.join(__dirname, 'src/pages/laboran') }
];

let totalFixed = 0;
let totalSkipped = 0;

roleDirs.forEach(({ name, path: roleDir }) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Checking ${name.toUpperCase()} pages...`);
  console.log('='.repeat(50));

  if (!fs.existsSync(roleDir)) {
    console.log(`  ⚠️  Directory not found: ${roleDir}`);
    return;
  }

  // Get all page files
  const pageFiles = fs.readdirSync(roleDir)
    .filter(file => file.endsWith('Page.tsx'))
    .map(file => path.join(roleDir, file));

  let roleFixed = 0;
  let roleSkipped = 0;

  pageFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Check if file has AppLayout import and wrapper
      if (content.includes("import { AppLayout }") && content.includes("<AppLayout>")) {
        console.log(`\n  Fixing: ${path.basename(filePath)}`);

        // Remove AppLayout import
        content = content.replace(
          /import \{ AppLayout \} from '@\/components\/layout\/AppLayout';\n/g,
          ''
        );

        // Remove AppLayout wrapper tags - handle different formatting
        content = content.replace(
          /return \(\s*<AppLayout>\s*/g,
          'return (\n    '
        );

        content = content.replace(
          /\s*<\/AppLayout>\s*\);/g,
          '\n  );'
        );

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`    ✅ Removed AppLayout wrapper`);
          roleFixed++;
        } else {
          console.log(`    ⚠️  No changes made`);
          roleSkipped++;
        }
      } else {
        console.log(`  ✓ ${path.basename(filePath)} - No double AppLayout`);
        roleSkipped++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\n  ${name}: Fixed ${roleFixed}, Skipped ${roleSkipped}`);
  totalFixed += roleFixed;
  totalSkipped += roleSkipped;
});

console.log(`\n${'='.repeat(50)}`);
console.log(`  TOTAL: Fixed ${totalFixed} files, Skipped ${totalSkipped} files`);
console.log('='.repeat(50));

if (totalFixed > 0) {
  console.log(`\n✅ Successfully fixed ${totalFixed} page(s) across all roles!`);
} else {
  console.log(`\n✓ All pages are already correct - no double AppLayout found!`);
}
