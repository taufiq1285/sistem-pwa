/**
 * Fix: IndexedDB "Key already exists" error
 * Perbaiki fungsi caching untuk handle update jika data sudah ada
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kuis.api.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix cacheQuizOffline function
const oldCacheQuizOffline = `/**
 * Cache quiz to IndexedDB for offline access
 */
export async function cacheQuizOffline(quiz: Kuis): Promise<void> {
  try {
    await indexedDBManager.create(OFFLINE_STORES.QUIZ, {
      id: quiz.id,
      data: quiz,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to cache quiz offline:", error);
    throw error;
  }
}`;

const newCacheQuizOffline = `/**
 * Cache quiz to IndexedDB for offline access
 */
export async function cacheQuizOffline(quiz: Kuis): Promise<void> {
  try {
    // Check if already cached
    const existing = await indexedDBManager.getById(OFFLINE_STORES.QUIZ, quiz.id);

    if (existing) {
      // Update existing cache
      await indexedDBManager.update(OFFLINE_STORES.QUIZ, quiz.id, {
        id: quiz.id,
        data: quiz,
        cachedAt: new Date().toISOString(),
      });
    } else {
      // Create new cache
      await indexedDBManager.create(OFFLINE_STORES.QUIZ, {
        id: quiz.id,
        data: quiz,
        cachedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to cache quiz offline:", error);
    // Don't throw - caching is not critical
  }
}`;

// Fix cacheQuestionsOffline function
const oldCacheQuestionsOffline = `/**
 * Cache questions to IndexedDB for offline access
 */
export async function cacheQuestionsOffline(
  kuisId: string,
  questions: Soal[],
): Promise<void> {
  try {
    await indexedDBManager.create(OFFLINE_STORES.QUESTIONS, {
      id: kuisId,
      data: questions,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to cache questions offline:", error);
    throw error;
  }
}`;

const newCacheQuestionsOffline = `/**
 * Cache questions to IndexedDB for offline access
 */
export async function cacheQuestionsOffline(
  kuisId: string,
  questions: Soal[],
): Promise<void> {
  try {
    // Check if already cached
    const existing = await indexedDBManager.getById(OFFLINE_STORES.QUESTIONS, kuisId);

    if (existing) {
      // Update existing cache
      await indexedDBManager.update(OFFLINE_STORES.QUESTIONS, kuisId, {
        id: kuisId,
        data: questions,
        cachedAt: new Date().toISOString(),
      });
    } else {
      // Create new cache
      await indexedDBManager.create(OFFLINE_STORES.QUESTIONS, {
        id: kuisId,
        data: questions,
        cachedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to cache questions offline:", error);
    // Don't throw - caching is not critical
  }
}`;

// Apply fixes
if (content.includes(oldCacheQuizOffline)) {
  content = content.replace(oldCacheQuizOffline, newCacheQuizOffline);
  console.log('✅ Fixed cacheQuizOffline function');
} else {
  console.log('⚠️ cacheQuizOffline already fixed or not found');
}

if (content.includes(oldCacheQuestionsOffline)) {
  content = content.replace(oldCacheQuestionsOffline, newCacheQuestionsOffline);
  console.log('✅ Fixed cacheQuestionsOffline function');
} else {
  console.log('⚠️ cacheQuestionsOffline already fixed or not found');
}

// Write back
fs.writeFileSync(filePath, content, 'utf-8');
console.log('\n✅ File updated successfully!');
console.log('📝 File:', filePath);
