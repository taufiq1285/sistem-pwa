const fs = require('fs');
const path = require('path');

// Fix 1: useAutoSave.test.ts - Add await before act(async)
function fixUseAutoSaveTest() {
  const filePath = path.join(__dirname, 'src/__tests__/unit/hooks/useAutoSave.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace pattern: const savePromise = act(async () => {
  // With: const savePromise = await act(async () => {
  content = content.replace(
    /const savePromise = act\(async \(\) => \{\s+await result\.current\.save\(\);/g,
    `const savePromise = await act(async () => {
        return result.current.save();`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed useAutoSave.test.ts');
}

// Fix 2: useLocalData.test.ts - Add read method to mock
function fixUseLocalDataTest() {
  const filePath = path.join(__dirname, 'src/__tests__/unit/hooks/useLocalData.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add read method to the mock
  const oldMock = `vi.mock('@/lib/offline/indexeddb', () => ({
  indexedDBManager: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));`;

  const newMock = `vi.mock('@/lib/offline/indexeddb', () => ({
  indexedDBManager: {
    getAll: vi.fn(),
    read: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));`;

  content = content.replace(oldMock, newMock);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed useLocalData.test.ts - added read method to mock');
}

// Fix 3: useLocalData.test.ts - Add read mock implementation for update test
function fixUseLocalDataUpdateTest() {
  const filePath = path.join(__dirname, 'src/__tests__/unit/hooks/useLocalData.test.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add read mock before update test
  const oldUpdateTest = `    it('should update item with optimistic update', async () => {
      (indexedDBManager.update as any).mockResolvedValue({ ...mockKuis[0], judul: 'Updated' });

      const { result } = renderHook(() =>
        useLocalData('kuis' as StoreName, { optimistic: true })
      );`;

  const newUpdateTest = `    it('should update item with optimistic update', async () => {
      (indexedDBManager.read as any).mockResolvedValue(mockKuis[0]);
      (indexedDBManager.update as any).mockResolvedValue({ ...mockKuis[0], judul: 'Updated' });

      const { result } = renderHook(() =>
        useLocalData('kuis' as StoreName, { optimistic: true })
      );`;

  content = content.replace(oldUpdateTest, newUpdateTest);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed useLocalData.test.ts - added read mock for update test');
}

// Run all fixes
try {
  fixUseAutoSaveTest();
  fixUseLocalDataTest();
  fixUseLocalDataUpdateTest();
  console.log('\n✅ All test fixes applied successfully!');
} catch (error) {
  console.error('❌ Error applying fixes:', error);
  process.exit(1);
}
