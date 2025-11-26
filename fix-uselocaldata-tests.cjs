const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, 'src/__tests__/unit/hooks/useLocalData.test.ts');

// Read the file
let content = fs.readFileSync(testFile, 'utf8');

// Remove the global vi.useFakeTimers()
content = content.replace(/\/\/ Mock timers for refresh interval tests\nvi\.useFakeTimers\(\);\n\n/g, '');

// Also remove any vi.clearAllTimers() in beforeEach and afterEach since we're not using fake timers globally
content = content.replace(/vi\.clearAllTimers\(\);\n    /g, '');
content = content.replace(/    vi\.clearAllTimers\(\);\n/g, '');

// Write the file back
fs.writeFileSync(testFile, content, 'utf8');

console.log('Fixed useLocalData test file');
