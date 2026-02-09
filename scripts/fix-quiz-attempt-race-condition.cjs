/**
 * Fix: QuizAttempt race condition
 * Prevent duplicate startAttempt calls caused by React StrictMode
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/features/kuis/attempt/QuizAttempt.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add isInitializing ref after state declarations
const searchPattern1 = `const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();`;

const replacement1 = `const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();

  // ✅ Prevent duplicate calls in React StrictMode
  const isInitializingRef = useRef(false);`;

// 2. Add protection in useEffect
const searchPattern2 = `/**
   * Load quiz and start/resume attempt
   */
  useEffect(() => {
    loadQuizAndStartAttempt();
  }, [kuisId, mahasiswaId]);`;

const replacement2 = `/**
   * Load quiz and start/resume attempt
   */
  useEffect(() => {
    // ✅ Prevent duplicate calls (React StrictMode protection)
    if (isInitializingRef.current) {
      console.log("⚠️ Already initializing, skipping duplicate call");
      return;
    }

    isInitializingRef.current = true;
    loadQuizAndStartAttempt().finally(() => {
      isInitializingRef.current = false;
    });
  }, [kuisId, mahasiswaId]);`;

// Apply fixes
let fixed = 0;

if (content.includes('const navigate = useNavigate();')) {
  content = content.replace(searchPattern1, replacement1);
  console.log('✅ Added isInitializingRef');
  fixed++;
}

if (content.includes('Load quiz and start/resume attempt')) {
  content = content.replace(searchPattern2, replacement2);
  console.log('✅ Added protection in useEffect');
  fixed++;
}

if (fixed > 0) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`\n✅ Applied ${fixed} fixes to QuizAttempt.tsx`);
  console.log('📝 This prevents duplicate startAttempt calls in development mode');
} else {
  console.log('⚠️ No fixes applied - patterns not found or already fixed');
}
