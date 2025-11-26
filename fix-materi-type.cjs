const fs = require('fs');
const path = require('path');

const materiTypesPath = path.join(__dirname, 'src/types/materi.types.ts');
let content = fs.readFileSync(materiTypesPath, 'utf8');

// Remove the additional fields that conflict with MateriTable
content = content.replace(
  /export interface Materi extends MateriTable \{[\s\S]*?  \/\/ Relations/,
  `export interface Materi extends MateriTable {
  // Relations`
);

fs.writeFileSync(materiTypesPath, content, 'utf8');
console.log('✓ Fixed: materi.types.ts - removed conflicting optional fields');
