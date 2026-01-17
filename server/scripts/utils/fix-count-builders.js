const fs = require('fs');
const path = require('path');

const testFile = '/f/tes 9/sistem-praktikum-pwa/src/__tests__/unit/api/dosen.api.test.ts';
let content = fs.readFileSync(testFile, 'utf8');

// Fix countBuilder1 to use .then() instead of .mockResolvedValue()
content = content.replace(
  /\/\/ Mock count for MK1\s+const countBuilder1 = createBuilder\(\);\s+countBuilder1\.select\.mockReturnValue\(countBuilder1\);\s+countBuilder1\.in\.mockResolvedValue\(\{ count: 20, error: null \}\);/,
  `// Mock count for MK1
      const countBuilder1 = createBuilder();
      (countBuilder1 as any).then = vi.fn((onFulfilled) =>
        Promise.resolve({ count: 20, error: null }).then(onFulfilled)
      );`
);

// Fix countBuilder2 to use .then() instead of .mockResolvedValue()
content = content.replace(
  /\/\/ Mock count for MK2\s+const countBuilder2 = createBuilder\(\);\s+countBuilder2\.select\.mockReturnValue\(countBuilder2\);\s+countBuilder2\.in\.mockResolvedValue\(\{ count: 25, error: null \}\);/,
  `// Mock count for MK2
      const countBuilder2 = createBuilder();
      (countBuilder2 as any).then = vi.fn((onFulfilled) =>
        Promise.resolve({ count: 25, error: null }).then(onFulfilled)
      );`
);

fs.writeFileSync(testFile, content, 'utf8');
console.log('Fixed count builders');
