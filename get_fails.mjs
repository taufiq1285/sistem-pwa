import fs from 'fs';

// Try reading with multiple encodings
let text = '';
try {
  const buffer = fs.readFileSync('test_results.txt');
  // vitest logs might be utf-16le from powershell >
  text = buffer.toString('utf16le');
  if (!text.includes('FAIL')) {
    text = buffer.toString('utf8');
  }
} catch(e) {
  console.error(e);
}

const lines = text.split('\n');
const failed = new Set();
for(const line of lines) {
  if (line.includes('FAIL ') && line.includes('src/')) {
    failed.add(line.trim());
  }
}

// Fallback search since Vitest basic reporter might just use '❯' and 'failed'
let currentFile = '';
for(const line of lines) {
  if (line.includes(' ❯ src/')) {
    const parts = line.split(' ');
    const file = parts.find(p => p.includes('src/'));
    if (file) currentFile = file;
  }
  if (line.includes('failed') && currentFile) {
    if (line.includes('Tests ') || line.includes('Test Files ')) continue;
    failed.add(currentFile.replace(/[^a-zA-Z0-9/._-]/g, ''));
  }
}

console.log('--- FAILED TESTS ---');
console.log(Array.from(failed).join('\n'));
