const fs = require('fs');
const path = require('path');

console.log('Applying final fixes...\n');

// Fix 1: QuestionEditor - import missing types
const questionEditorPath = path.join(__dirname, 'src/components/features/kuis/builder/QuestionEditor.tsx');
let questionEditor = fs.readFileSync(questionEditorPath, 'utf8');

if (!questionEditor.includes('CreateSoalData')) {
  questionEditor = questionEditor.replace(
    /import.*from '@\/types'/,
    `import type { CreateSoalData, UpdateSoalData } from '@/types'`
  );
  fs.writeFileSync(questionEditorPath, questionEditor, 'utf8');
  console.log('✓ Fixed: QuestionEditor.tsx - added missing type imports');
}

// Fix 2: QuizBuilder - fix all error variables
const quizBuilderPath = path.join(__dirname, 'src/components/features/kuis/builder/QuizBuilder.tsx');
let quizBuilder = fs.readFileSync(quizBuilderPath, 'utf8');

// Type all catch blocks
quizBuilder = quizBuilder.replace(/catch \(_error\) \{/g, 'catch (_error: unknown) {');
quizBuilder = quizBuilder.replace(/catch \(error\) \{/g, 'catch (error: unknown) {');
quizBuilder = quizBuilder.replace(/catch \(err\) \{/g, 'catch (err: unknown) {');

// Type assert error.message
quizBuilder = quizBuilder.replace(/\b_error\.message\b/g, '(_error as Error).message');
quizBuilder = quizBuilder.replace(/\berror\.message\b/g, '(error as Error).message');

fs.writeFileSync(quizBuilderPath, quizBuilder, 'utf8');
console.log('✓ Fixed: QuizBuilder.tsx - fixed error type assertions');

// Fix 3: peminjaman-extensions - change tanggal_kembali_real to tanggal_kembali_aktual
const peminjamanExtPath = path.join(__dirname, 'src/lib/api/peminjaman-extensions.ts');
let peminjamanExt = fs.readFileSync(peminjamanExtPath, 'utf8');

peminjamanExt = peminjamanExt.replace(/tanggal_kembali_real/g, 'tanggal_kembali_aktual');
peminjamanExt = peminjamanExt.replace(/kondisi_pinjam/g, 'kondisi_saat_pinjam');
peminjamanExt = peminjamanExt.replace(/kondisi_kembali/g, 'kondisi_saat_kembali');
peminjamanExt = peminjamanExt.replace(/keterangan_kembali/g, 'catatan_pengembalian');

fs.writeFileSync(peminjamanExtPath, peminjamanExt, 'utf8');
console.log('✓ Fixed: peminjaman-extensions.ts - fixed column names');

// Fix 4: Add error type assertions to all pages
const pagesToFix = [
  'src/pages/admin/KelasPage.tsx',
  'src/pages/admin/MataKuliahPage.tsx',
  'src/pages/dosen/JadwalPage.tsx',
  'src/pages/dosen/kuis/KuisBuilderPage.tsx',
  'src/pages/dosen/MateriPage.tsx',
  'src/lib/supabase/auth.ts'
];

pagesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Type catch blocks
  content = content.replace(/catch \((error|e|err)\) \{/g, 'catch ($1: unknown) {');
  
  // Type assert error.message
  content = content.replace(/\berror\.message\b(?! as)/g, '(error as Error).message');
  content = content.replace(/\be\.message\b(?! as)/g, '(e as Error).message');
  content = content.replace(/\berr\.message\b(?! as)/g, '(err as Error).message');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Fixed: ${filePath} - error type assertions`);
});

// Fix 5: format.ts - fix undefined returns
const formatPath = path.join(__dirname, 'src/lib/utils/format.ts');
let formatContent = fs.readFileSync(formatPath, 'utf8');

// Fix formatCurrency to return empty string instead of undefined
formatContent = formatContent.replace(
  /export function formatCurrency[\s\S]*?^\}/m,
  `export function formatCurrency(amount?: number | null, currency = 'IDR'): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}`
);

// Fix formatDate
formatContent = formatContent.replace(
  /if \(!date\) return;/g,
  `if (!date) return '';`
);

// Fix formatTime
formatContent = formatContent.replace(
  /export function formatTime\(date\?\: Date \| string \| null\): string \{[\s\S]*?if \(!date\) return '';/,
  `export function formatTime(date?: Date | string | null): string {
  if (!date) return '';`
);

// Fix formatFileSize
formatContent = formatContent.replace(
  /export function formatFileSize[\s\S]*?^\}/m,
  `export function formatFileSize(bytes?: number | null): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}`
);

fs.writeFileSync(formatPath, formatContent, 'utf8');
console.log('✓ Fixed: format.ts - fixed undefined returns');

console.log('\nAll critical fixes applied!');
