const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/providers/AuthProvider.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the logout function properly
const oldLogout = `      if (performLogout) {
        console.log('🔵 Calling auth API logout...');
        performLogout(); // ✅ OPTIMIZED: Don't await - run in background

        if (!response?.success) {
          console.warn('⚠️ Logout API error:', response?.error);
        } else {
          console.log('✅ Auth API logout success');
        }
      }

      console.log('🔵 Clearing state & storage...');
      updateAuthState(null, null);
      clearCachedAuth();
      localStorage.clear();
      sessionStorage.clear();

      console.log('✅ logout: COMPLETE');

      // Force redirect
      window.location.href = '/login';`;

const newLogout = `      // ✅ OPTIMIZED: Clear state FIRST for instant logout
      console.log('🔵 Clearing state & storage FIRST...');
      updateAuthState(null, null);
      clearCachedAuth();
      localStorage.clear();
      sessionStorage.clear();
      setLoading(false);

      // ✅ Then call API logout in background (non-blocking)
      if (performLogout) {
        console.log('🔵 Calling auth API logout (background)...');
        performLogout().catch((error) => {
          console.warn('⚠️ Logout API error (non-critical):', error);
        });
      }

      console.log('✅ logout: COMPLETE (instant!)');

      // Redirect immediately
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);`;

content = content.replace(oldLogout, newLogout);
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed logout function properly!');
console.log('\nChanges:');
console.log('  - Clear state FIRST (instant)');
console.log('  - API call runs in background');
console.log('  - Removed response variable (was causing error)');
console.log('  - Redirect happens immediately');
