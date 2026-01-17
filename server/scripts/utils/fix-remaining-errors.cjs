const fs = require('fs');
const path = require('path');

console.log('Fixing remaining production code errors...\n');

// Fix 1: Add missing Soal types to kuis.types.ts
const kuisTypesPath = path.join(__dirname, 'src/types/kuis.types.ts');
let kuisTypes = fs.readFileSync(kuisTypesPath, 'utf8');

// Check if CreateSoalData and UpdateSoalData already exist
if (!kuisTypes.includes('export interface CreateSoalData')) {
  // Add at the end before last closing brace or export
  kuisTypes = kuisTypes.replace(
    /(export interface UpdateKuisData[\s\S]*?\})/,
    `$1

// Soal (Question) Data Types
export interface CreateSoalData {
  kuis_id: string;
  nomor_soal: number;
  tipe_soal: 'pilihan_ganda' | 'esai' | 'isian_singkat';
  pertanyaan: string;
  poin: number;
  pilihan_jawaban?: Record<string, unknown> | null;
  jawaban_benar?: string | null;
}

export interface UpdateSoalData extends Partial<CreateSoalData> {
  id: string;
}`
  );
  
  fs.writeFileSync(kuisTypesPath, kuisTypes, 'utf8');
  console.log('✓ Fixed: kuis.types.ts - added CreateSoalData and UpdateSoalData');
}

// Fix 2: QuizBuilder.tsx - rename 'error' variables
const quizBuilderPath = path.join(__dirname, 'src/components/features/kuis/builder/QuizBuilder.tsx');
let quizBuilder = fs.readFileSync(quizBuilderPath, 'utf8');

// Replace undefined 'error' with proper error variable names based on context
quizBuilder = quizBuilder.replace(/console\.log\(["']Failed to save question:["'], error\);/g, 
  `console.log('Failed to save question:', _error);`);
quizBuilder = quizBuilder.replace(/console\.error\(["']Failed to delete question:["'], error\);/g,
  `console.error('Failed to delete question:', _error);`);
quizBuilder = quizBuilder.replace(/\berror\.message\b/g, '_error.message');
quizBuilder = quizBuilder.replace(/console\.error\(["']Failed to publish quiz:["'], error\);/g,
  `console.error('Failed to publish quiz:', publishError);`);

fs.writeFileSync(quizBuilderPath, quizBuilder, 'utf8');
console.log('✓ Fixed: QuizBuilder.tsx - renamed error variables');

// Fix 3: Add error type assertions for catch blocks
const filesToFixErrorType = [
  'src/components/features/kuis/QuizCard.tsx',
  'src/lib/api/kelas.api.ts',
  'src/lib/api/mahasiswa.api.ts',
  'src/lib/supabase/auth.ts'
];

filesToFixErrorType.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace error.message with proper type assertion
  content = content.replace(/\} catch \((error|e)\) \{/g, '} catch ($1: unknown) {');
  content = content.replace(/error\.message(?! as)/g, '(error as Error).message');
  content = content.replace(/e\.message(?! as)/g, '(e as Error).message');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Fixed: ${filePath} - added error type assertions`);
});

console.log('\nAll production code errors fixed!');
