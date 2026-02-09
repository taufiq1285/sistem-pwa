/**
 * Fix: cacheAttemptOffline - handle duplicate key
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/api/kuis.api.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const oldFunction = `/**
 * Cache attempt to IndexedDB
 */
export async function cacheAttemptOffline(attempt: AttemptKuis): Promise<void> {
  try {
    await indexedDBManager.create(OFFLINE_STORES.ATTEMPTS, {
      id: attempt.id,
      data: attempt,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to cache attempt offline:", error);
    throw error;
  }
}`;

const newFunction = `/**
 * Cache attempt to IndexedDB
 */
export async function cacheAttemptOffline(attempt: AttemptKuis): Promise<void> {
  try {
    // Check if already cached
    const existing = await indexedDBManager.getById(OFFLINE_STORES.ATTEMPTS, attempt.id);

    if (existing) {
      // Update existing cache
      await indexedDBManager.update(OFFLINE_STORES.ATTEMPTS, attempt.id, {
        id: attempt.id,
        data: attempt,
        cachedAt: new Date().toISOString(),
      });
    } else {
      // Create new cache
      await indexedDBManager.create(OFFLINE_STORES.ATTEMPTS, {
        id: attempt.id,
        data: attempt,
        cachedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to cache attempt offline:", error);
    // Don't throw - caching is not critical
  }
}`;

if (content.includes('Cache attempt to IndexedDB')) {
  content = content.replace(oldFunction, newFunction);
  console.log('✅ Fixed cacheAttemptOffline function');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ File updated successfully!');
} else {
  console.log('⚠️ cacheAttemptOffline not found');
}
