const fs = require('fs');
const path = require('path');

/**
 * Optimize logout performance
 * Make logout instant by not waiting for API responses
 */

const authProviderPath = path.join(__dirname, 'src/providers/AuthProvider.tsx');
let content = fs.readFileSync(authProviderPath, 'utf8');

// Find and replace logout function to make it faster
const oldLogout = `  const logout = useCallback(async () => {
    console.log('🔵 logout: START');
    setLoading(true);

    try {
      const authApiWithLogout = authApi as typeof authApi & {
        logout?: () => Promise<{ success: boolean; error?: string }>;
        signOut?: () => Promise<{ success: boolean; error?: string }>;
      };

      const performLogout = authApiWithLogout.logout || authApiWithLogout.signOut;

      if (performLogout) {
        console.log('🔵 Calling auth API logout...');
        const response = await performLogout();

        if (!response?.success) {
          console.warn('⚠️ Logout API error:', response?.error);
        } else {
          console.log('✅ Auth API logout success');
        }
      }

      console.log('🔵 Clearing state & storage...');
      updateAuthState(null, null);
      clearCachedAuth();`;

const newLogout = `  const logout = useCallback(async () => {
    console.log('🔵 logout: START - Fast mode');

    // ✅ OPTIMIZATION: Clear state immediately for instant UI update
    console.log('🔵 Clearing state & storage immediately...');
    updateAuthState(null, null);
    clearCachedAuth();
    setLoading(false); // Set loading false immediately

    try {
      const authApiWithLogout = authApi as typeof authApi & {
        logout?: () => Promise<{ success: boolean; error?: string }>;
        signOut?: () => Promise<{ success: boolean; error?: string }>;
      };

      const performLogout = authApiWithLogout.logout || authApiWithLogout.signOut;

      if (performLogout) {
        console.log('🔵 Calling auth API logout (async, non-blocking)...');
        // Don't await - let it run in background
        performLogout().then((response) => {
          if (!response?.success) {
            console.warn('⚠️ Logout API error:', response?.error);
          } else {
            console.log('✅ Auth API logout success (background)');
          }
        }).catch((error) => {
          console.warn('⚠️ Logout API error:', error);
        });
      }`;

if (content.includes(oldLogout)) {
  content = content.replace(oldLogout, newLogout);
  fs.writeFileSync(authProviderPath, content, 'utf8');
  console.log('✅ Optimized logout function in AuthProvider.tsx');
  console.log('\nChanges:');
  console.log('  - Clear state immediately (no waiting)');
  console.log('  - API logout runs in background (non-blocking)');
  console.log('  - UI updates instantly');
} else {
  console.log('⚠️  Logout function pattern not found or already optimized');
}

// Also optimize auth.ts to skip getUserProfile on logout
const authPath = path.join(__dirname, 'src/lib/supabase/auth.ts');
let authContent = fs.readFileSync(authPath, 'utf8');

// Optimize getUserProfile to fail fast when user not found
const oldTimeout = `    // Increased timeout to 10 seconds with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);`;

const newTimeout = `    // ✅ OPTIMIZED: Reduced timeout to 3 seconds for faster logout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);`;

if (authContent.includes(oldTimeout)) {
  authContent = authContent.replace(oldTimeout, newTimeout);
  fs.writeFileSync(authPath, authContent, 'utf8');
  console.log('✅ Reduced getUserProfile timeout from 10s to 3s');
} else {
  console.log('⚠️  Timeout pattern not found or already optimized');
}

console.log('\n✅ Logout optimization complete!');
console.log('Expected improvement: Logout should be instant now (<100ms)');
