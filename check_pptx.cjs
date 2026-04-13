const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');

// Try to use a child process with powershell or just node's built-in zlib.
// Actually, extracting a zip in Node.js without external dependencies is messy.
// Let's use PowerShell's tar command if available, Windows 10+ has tar.
const { execSync } = require('child_process');

try {
  fs.mkdirSync('tmp_pptx2', { recursive: true });
  execSync('tar -xf "docs/TEMPLATE 107.pptx" -C tmp_pptx2');
  console.log('Extracted successfully using tar.');
  
  // Now read the slides
  const slidesPath = 'tmp_pptx2/ppt/slides';
  const files = fs.readdirSync(slidesPath);
  files.forEach(f => {
    if (f.endsWith('.xml')) {
      const content = fs.readFileSync(`${slidesPath}/${f}`, 'utf8');
      // Extract text from a:t tags
      const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
      let text = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        text.push(match[1]);
      }
      if (text.length > 0) {
        console.log(`\n--- ${f} ---`);
        console.log(text.join(' '));
      }
    }
  });

} catch (e) {
  console.error(e);
}
