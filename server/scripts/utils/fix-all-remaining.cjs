const fs = require('fs');
const path = require('path');

console.log('Fixing ALL remaining errors...\n');

// Fix 1: QuestionEditor - force add import at top
const questionEditorPath = path.join(__dirname, 'src/components/features/kuis/builder/QuestionEditor.tsx');
let questionEditor = fs.readFileSync(questionEditorPath, 'utf8');

if (!questionEditor.includes('CreateSoalData')) {
  // Add import after first line
  questionEditor = questionEditor.replace(
    /^(import.*\n)/,
    `$1import type { CreateSoalData, UpdateSoalData } from '@/types';\n`
  );
  fs.writeFileSync(questionEditorPath, questionEditor, 'utf8');
  console.log('✓ Fixed: QuestionEditor.tsx - added type imports');
}

// Fix 2: QuizBuilder - fix all error references
const quizBuilderPath = path.join(__dirname, 'src/components/features/kuis/builder/QuizBuilder.tsx');
let quizBuilder = fs.readFileSync(quizBuilderPath, 'utf8');

// Read the file and fix line by line
const lines = quizBuilder.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Fix line 217 and 219 - change 'error' to '_error'
  if (lines[i].includes('Failed to delete question') && lines[i].includes('error)')) {
    lines[i] = lines[i].replace(/\berror\)/g, '_error)');
  }
  if (lines[i].includes('error.message') && !lines[i].includes('_error')) {
    lines[i] = lines[i].replace(/\berror\.message\b/g, '(_error as Error).message');
  }
}
quizBuilder = lines.join('\n');
fs.writeFileSync(quizBuilderPath, quizBuilder, 'utf8');
console.log('✓ Fixed: QuizBuilder.tsx - fixed error references');

// Fix 3: format.ts - rewrite problematic functions
const formatPath = path.join(__dirname, 'src/lib/utils/format.ts');
let formatContent = fs.readFileSync(formatPath, 'utf8');

// Find and replace formatDate function
const formatDateRegex = /export function formatDate\([\s\S]*?(?=\nexport function|$)/;
const newFormatDate = `export function formatDate(date?: Date | string | null, format = 'dd MMM yyyy'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = dateObj.toLocaleString('id-ID', { month: 'short' });
  const year = dateObj.getFullYear();
  
  return \`\${day} \${month} \${year}\`;
}

export function formatTime(date?: Date | string | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return \`\${hours}:\${minutes}\`;
}

export function formatDateTime(date?: Date | string | null): string {
  if (!date) return '';
  return \`\${formatDate(date)} \${formatTime(date)}\`;
}

`;

formatContent = formatContent.replace(formatDateRegex, newFormatDate);

// Fix formatFileSize
const formatFileSizeRegex = /export function formatFileSize[\s\S]*?(?=\nexport function|$)/;
const newFormatFileSize = `export function formatFileSize(bytes?: number | null): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

`;

formatContent = formatContent.replace(formatFileSizeRegex, newFormatFileSize);

fs.writeFileSync(formatPath, formatContent, 'utf8');
console.log('✓ Fixed: format.ts - fixed undefined returns');

// Fix 4: auth.ts - add missing error type
const authPath = path.join(__dirname, 'src/lib/supabase/auth.ts');
let authContent = fs.readFileSync(authPath, 'utf8');

// Find line 399 and add type assertion
const authLines = authContent.split('\n');
for (let i = 0; i < authLines.length; i++) {
  if (i === 398 && authLines[i].includes('error')) { // Line 399 (0-indexed)
    authLines[i] = authLines[i].replace(/\berror\b(?!:)/g, '(error as Error)');
  }
}
authContent = authLines.join('\n');
fs.writeFileSync(authPath, authContent, 'utf8');
console.log('✓ Fixed: auth.ts - error type assertion');

// Fix 5: Remove unused imports/variables
const filesToCleanup = [
  { path: 'src/pages/laboran/LaboratoriumPage.tsx', pattern: ', CardDescription' },
  { path: 'src/pages/mahasiswa/OfflineSyncPage.tsx', pattern: ', useEffect' },
  { path: 'src/routes/index.tsx', pattern: /^import \{ HomePage \}.*\n/m }
];

filesToCleanup.forEach(({ path: filePath, pattern }) => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (typeof pattern === 'string') {
    content = content.replace(pattern, '');
  } else {
    content = content.replace(pattern, '');
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Fixed: ${filePath} - removed unused imports`);
});

console.log('\nPhase 1 fixes completed!');
