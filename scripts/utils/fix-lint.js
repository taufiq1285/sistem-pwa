#!/usr/bin/env node

/**
 * Quick lint fixer for common issues
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Get lint output
console.log('Running lint...');
const lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8' });

// Parse lint errors
const unusedVarRegex = /^(.*):(\d+):(\d+)\s+error\s+'(.*)' is defined but never used/gm;
const files = new Map();

let match;
while ((match = unusedVarRegex.exec(lintOutput)) !== null) {
  const [, filePath, line, , varName] = match;
  if (!files.has(filePath)) {
    files.set(filePath, []);
  }
  files.get(filePath).push({ line: parseInt(line), varName });
}

// Fix unused variables by prefixing with underscore
for (const [filePath, issues] of files) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Sort by line number descending to avoid line number shifts
    issues.sort((a, b) => b.line - a.line);

    for (const { line, varName } of issues) {
      const lineIndex = line - 1;
      if (lineIndex < lines.length) {
        // Replace variable name with underscore-prefixed version
        lines[lineIndex] = lines[lineIndex].replace(
          new RegExp(`\\b${varName}\\b`, 'g'),
          `_${varName}`
        );
      }
    }

    writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Fixed ${issues.length} unused variables in ${filePath}`);
  } catch (err) {
    console.error(`Error fixing ${filePath}:`, err.message);
  }
}

console.log('\nDone! Run npm run lint again to see remaining issues.');
