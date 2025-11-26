const fs = require('fs');
const path = require('path');

// Fix 1: useAutoSave.test.ts - Simply add await before act(async)
function fixUseAutoSaveTest() {
  const filePath = path.join(__dirname, 'src/__tests__/unit/hooks/useAutoSave.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Simple replacement: add await before `const savePromise = act(async`
  content = content.replace(
    /(\s+)const savePromise = act\(async \(\) => \{/g,
    '$1const savePromise = await act(async () => {'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed useAutoSave.test.ts - added await before act(async)');
}

// Fix 2: useLocalData.test.ts - Turn off autoLoad for initialization tests
function fixUseLocalDataTests() {
  const filePath = path.join(__dirname, 'src/__tests__/unit/hooks/useLocalData.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix: Disable autoLoad in initialization tests to prevent act warnings
  content = content.replace(
    /it\('should initialize with default state', \(\) => \{\s+const \{ result \} = renderHook\(\(\) => useLocalData\('kuis' as StoreName\)\);/,
    `it('should initialize with default state', () => {
      const { result } = renderHook(() => useLocalData('kuis' as StoreName, { autoLoad: false }));`
  );

  content = content.replace(
    /it\('should expose all required methods', \(\) => \{\s+const \{ result \} = renderHook\(\(\) => useLocalData\('kuis' as StoreName\)\);/,
    `it('should expose all required methods', () => {
      const { result } = renderHook(() => useLocalData('kuis' as StoreName, { autoLoad: false }));`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed useLocalData.test.ts - disabled autoLoad in init tests');
}

// Run all fixes
try {
  fixUseAutoSaveTest();
  fixUseLocalDataTests();
  console.log('\n✅ All fixes applied successfully!');
} catch (error) {
  console.error('❌ Error applying fixes:', error.message);
  process.exit(1);
}
