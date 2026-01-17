const fs = require('fs');
const path = require('path');

console.log('Fixing critical remaining errors...\n');

// Fix 1: QuestionEditor - Add import properly
const questionEditorPath = path.join(__dirname, 'src/components/features/kuis/builder/QuestionEditor.tsx');
let questionEditor = fs.readFileSync(questionEditorPath, 'utf8');

// Add import after other imports if not already there
if (!questionEditor.includes('CreateSoalData')) {
  const lines = questionEditor.split('\n');
  let importIndex = -1;
  
  // Find the last import line
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import') && lines[i].includes('from')) {
      importIndex = i;
    }
  }
  
  if (importIndex >= 0) {
    lines.splice(importIndex + 1, 0, `import type { CreateSoalData, UpdateSoalData } from '@/types';`);
    questionEditor = lines.join('\n');
    fs.writeFileSync(questionEditorPath, questionEditor, 'utf8');
    console.log('✓ Fixed: QuestionEditor.tsx - added imports');
  }
}

// Fix 2: QuizBuilder - fix remaining 'error' references
const quizBuilderPath = path.join(__dirname, 'src/components/features/kuis/builder/QuizBuilder.tsx');
let quizBuilder = fs.readFileSync(quizBuilderPath, 'utf8');

// Replace any remaining standalone 'error' with '_error' in context
quizBuilder = quizBuilder.replace(/console\.error\(['"]Failed to delete question:['"], error\)/g, 
  `console.error('Failed to delete question:', _error)`);
quizBuilder = quizBuilder.replace(/\$\{error\.message\}/g, '${(_error as Error).message}');

fs.writeFileSync(quizBuilderPath, quizBuilder, 'utf8');
console.log('✓ Fixed: QuizBuilder.tsx');

// Fix 3: PeminjamanPage - fix column name reference
const peminjamanPagePath = path.join(__dirname, 'src/pages/laboran/PeminjamanPage.tsx');
let peminjamanPage = fs.readFileSync(peminjamanPagePath, 'utf8');

peminjamanPage = peminjamanPage.replace(/tanggal_kembali_real/g, 'tanggal_kembali_aktual');

fs.writeFileSync(peminjamanPagePath, peminjamanPage, 'utf8');
console.log('✓ Fixed: PeminjamanPage.tsx');

// Fix 4: MateriPage - add error type
const materiPagePath = path.join(__dirname, 'src/pages/mahasiswa/MateriPage.tsx');
let materiPage = fs.readFileSync(materiPagePath, 'utf8');

materiPage = materiPage.replace(/} catch \(error\) \{/g, '} catch (error: unknown) {');
materiPage = materiPage.replace(/error\.message(?! as)/g, '(error as Error).message');

fs.writeFileSync(materiPagePath, materiPage, 'utf8');
console.log('✓ Fixed: MateriPage.tsx');

console.log('\nCritical fixes applied!');
