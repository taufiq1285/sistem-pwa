const fs = require('fs');
const data = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));

// Filter for lib/utils files (excluding validations)
// Only get files from sistem-praktikum-pwa subdirectory
const utilsFiles = Object.keys(data).filter(k =>
  (k.includes('lib\\utils') || k.includes('lib/utils')) &&
  k.includes('sistem-praktikum-pwa') &&
  k.includes('src') &&
  !k.includes('validations')
);

// Get specific files you asked about
const targetFiles = ['constants.ts', 'error-messages.ts', 'network-status.ts'];

console.log('\n=== Coverage for src/lib/utils ===\n');

// Group by filename and use the one with coverage
const fileMap = new Map();
utilsFiles.forEach(file => {
  const fileName = file.split(/[\\/]/).pop();
  if (!fileMap.has(fileName)) {
    fileMap.set(fileName, file);
  }
});

targetFiles.forEach(fileName => {
  const file = fileMap.get(fileName);
  if (file) {
    const fileData = data[file];
    const stmts = Object.keys(fileData.s || {}).length;
    const coveredStmts = Object.values(fileData.s || {}).filter(v => v > 0).length;
    const pct = stmts > 0 ? ((coveredStmts / stmts) * 100).toFixed(2) : '0.00';

    console.log(`${fileName}:`);
    console.log(`  Statements: ${pct}% (${coveredStmts}/${stmts})`);
  }
});

// Also calculate overall lib/utils percentage
let totalStmts = 0;
let totalCovered = 0;
utilsFiles.forEach(file => {
  const fileData = data[file];
  const stmtKeys = Object.keys(fileData.s || {});
  totalStmts += stmtKeys.length;
  totalCovered += Object.values(fileData.s || {}).filter(v => v > 0).length;
});

const overallPct = totalStmts > 0 ? ((totalCovered / totalStmts) * 100).toFixed(2) : '0.00';
console.log(`\nOverall src/lib/utils: ${overallPct}% (${totalCovered}/${totalStmts})`);
