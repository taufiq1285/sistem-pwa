const fs = require('fs');
const path = require('path');

console.log('Fixing schema and retry errors...\n');

// Fix 1: retry.ts - fix class constructor
const retryPath = path.join(__dirname, 'src/lib/utils/retry.ts');
let retryContent = fs.readFileSync(retryPath, 'utf8');

retryContent = retryContent.replace(
  /export class RetryError extends Error \{[\s\S]*?  \}\n\}/,
  `export class RetryError extends Error {
  public readonly lastError: unknown;
  public readonly attempts: number;

  constructor(
    message: string,
    lastError: unknown,
    attempts: number
  ) {
    super(message);
    this.name = 'RetryError';
    this.lastError = lastError;
    this.attempts = attempts;
  }
}`
);

fs.writeFileSync(retryPath, retryContent, 'utf8');
console.log('✓ Fixed: retry.ts - fixed class constructor');

// Fix 2: offline-data.schema.ts - fix z.record usage
const schemaPath = path.join(__dirname, 'src/lib/validations/offline-data.schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

schemaContent = schemaContent.replace(/z\.record\(z\.unknown\(\)\)/g, 'z.record(z.string(), z.unknown())');

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('✓ Fixed: offline-data.schema.ts - fixed z.record usage');

// Fix 3: QuestionEditor - add import if missing
const questionEditorPath = path.join(__dirname, 'src/components/features/kuis/builder/QuestionEditor.tsx');
let questionEditor = fs.readFileSync(questionEditorPath, 'utf8');

// Check if already imported
if (!questionEditor.includes('CreateSoalData')) {
  // Find existing import from @/types and add to it
  if (questionEditor.match(/import.*from ['"]@\/types['"]/)) {
    questionEditor = questionEditor.replace(
      /(import.*from ['"]@\/types['"])/,
      `import type { CreateSoalData, UpdateSoalData } from '@/types'\n$1`
    );
  } else {
    // Add new import after other imports
    questionEditor = questionEditor.replace(
      /(import.*from ['"]@\/components\/ui\/.*['"];?\n)/,
      `$1import type { CreateSoalData, UpdateSoalData } from '@/types';\n`
    );
  }
  
  fs.writeFileSync(questionEditorPath, questionEditor, 'utf8');
  console.log('✓ Fixed: QuestionEditor.tsx - added type imports');
}

console.log('\nAll schema and retry fixes applied!');
