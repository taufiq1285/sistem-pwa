const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/lib/api/dosen.api.ts',
  'src/lib/api/kelas.api.ts',
  'src/lib/api/laboran.api.ts'
];

filesToFix.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern: Find middleware imports that are incorrectly placed
  // Remove duplicate or misplaced import statements
  const lines = content.split('\n');
  const fixedLines = [];
  let skipNext = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip lines that look like misplaced imports in the middle of file
    if (i > 50 && line.trim().startsWith('import {') && line.includes('requirePermission')) {
      // This is a misplaced import, skip it and next 3 lines
      skipNext = 3;
      continue;
    }
    
    if (skipNext > 0) {
      skipNext--;
      continue;
    }
    
    fixedLines.push(line);
  }
  
  content = fixedLines.join('\n');
  
  // Ensure middleware import exists at the top
  if (!content.match(/import\s*{\s*requirePermission[\s\S]*?from\s*['"]@\/lib\/middleware['"]/)) {
    const lastImportIndex = content.lastIndexOf('import ');
    const nextLineIndex = content.indexOf('\n', lastImportIndex);
    const middlewareImport = `import {\n  requirePermission,\n  requirePermissionAndOwnership,\n} from '@/lib/middleware';\n`;
    content = content.slice(0, nextLineIndex + 1) + middlewareImport + content.slice(nextLineIndex + 1);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${filePath}`);
});

console.log('\n✅ All files fixed!');
