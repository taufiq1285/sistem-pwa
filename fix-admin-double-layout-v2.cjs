const fs = require('fs');
const path = require('path');

/**
 * Fix double AppLayout wrapper in admin pages
 * The routes already wrap pages with AppLayout, so pages shouldn't include it themselves
 */

const adminPagesDir = path.join(__dirname, 'src/pages/admin');

// Get all admin page files
const adminPageFiles = fs.readdirSync(adminPagesDir)
  .filter(file => file.endsWith('Page.tsx'))
  .map(file => path.join(adminPagesDir, file));

let fixedCount = 0;
let skippedCount = 0;

adminPageFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Check if file has AppLayout import and wrapper
    if (content.includes("import { AppLayout }") && content.includes("<AppLayout>")) {
      console.log(`\nFixing: ${path.basename(filePath)}`);

      // Remove AppLayout import
      content = content.replace(
        /import \{ AppLayout \} from '@\/components\/layout\/AppLayout';\n/g,
        ''
      );

      // Remove AppLayout wrapper tags
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
        console.log(`  ✅ Removed AppLayout wrapper`);
        fixedCount++;
      } else {
        console.log(`  ⚠️  No changes made`);
        skippedCount++;
      }
    } else {
      console.log(`  ✓ ${path.basename(filePath)} - Already fixed or no AppLayout`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n═══════════════════════════════════════`);
console.log(`  Fixed: ${fixedCount} files`);
console.log(`  Skipped: ${skippedCount} files`);
console.log(`═══════════════════════════════════════`);

if (fixedCount > 0) {
  console.log(`\n✅ Successfully fixed ${fixedCount} admin page(s)!`);
}
