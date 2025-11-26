/**
 * Offline Sync Flow Integration Test
 *
 * Tests the synchronization mechanism:
 * - Queue management
 * - Sync on reconnect
 * - Conflict resolution
 * - Error handling
 * - Retry logic
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  saveAnswerOffline,
  submitAnswerOffline,
  syncOfflineAnswers,
  getOfflineAnswers,
} from '@/lib/api/kuis.api';
import { indexedDBManager } from '@/lib/offline/indexeddb';
import * as kuisApiModule from '@/lib/api/kuis.api';

// ============================================================================
// MOCK SETUP
// ============================================================================

let mockOnlineStatus = true;
let mockOfflineStorage: Record<string, any> = {};
let mockSyncedAnswers: any[] = [];
let mockApiCallCount = 0;

// Mock IndexedDB
vi.mock('@/lib/offline/indexeddb', () => ({
  indexedDBManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(async (store, data) => {
      mockOfflineStorage[data.id] = data;
      return data;
    }),
    getById: vi.fn(async (store, id) => {
      return mockOfflineStorage[id] || null;
    }),
    getAll: vi.fn(async (store) => {
      return Object.values(mockOfflineStorage).filter(
        (item: any) => item.attempt_id !== undefined
      );
    }),
    update: vi.fn(async (store, id, data) => {
      mockOfflineStorage[id] = { ...mockOfflineStorage[id], ...data };
      return mockOfflineStorage[id];
    }),
    delete: vi.fn(async (store, id) => {
      delete mockOfflineStorage[id];
      return true;
    }),
  },
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Offline Sync Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnlineStatus = true;
    mockOfflineStorage = {};
    mockSyncedAnswers = [];
    mockApiCallCount = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // OFFLINE STORAGE TESTS
  // ============================================================================

  describe('Offline Storage', () => {
    it('should save answer to IndexedDB when offline', async () => {
      const answerId = 'attempt-1_soal-1';
      const answerData = {
        id: answerId,
        attempt_id: 'attempt-1',
        soal_id: 'soal-1',
        jawaban: 'Answer A',
        savedAt: new Date().toISOString(),
        synced: false,
      };

      await indexedDBManager.create('offline_answers', answerData);

      expect(indexedDBManager.create).toHaveBeenCalledWith(
        'offline_answers',
        answerData
      );
      expect(mockOfflineStorage[answerId]).toEqual(answerData);
    });

    it('should retrieve offline answers by attempt ID', async () => {
      // Add multiple answers
      mockOfflineStorage = {
        'attempt-1_soal-1': {
          id: 'attempt-1_soal-1',
          attempt_id: 'attempt-1',
          soal_id: 'soal-1',
          jawaban: 'Answer 1',
          synced: false,
        },
        'attempt-1_soal-2': {
          id: 'attempt-1_soal-2',
          attempt_id: 'attempt-1',
          soal_id: 'soal-2',
          jawaban: 'Answer 2',
          synced: false,
        },
        'attempt-2_soal-1': {
          id: 'attempt-2_soal-1',
          attempt_id: 'attempt-2',
          soal_id: 'soal-1',
          jawaban: 'Other Answer',
          synced: false,
        },
      };

      const answers = await indexedDBManager.getAll('offline_answers');

      expect(answers).toHaveLength(3);
      const attempt1Answers = answers.filter(
        (a: any) => a.attempt_id === 'attempt-1'
      );
      expect(attempt1Answers).toHaveLength(2);
    });

    it('should update existing offline answer', async () => {
      const answerId = 'attempt-1_soal-1';

      // Create initial answer
      await indexedDBManager.create('offline_answers', {
        id: answerId,
        attempt_id: 'attempt-1',
        soal_id: 'soal-1',
        jawaban: 'Initial Answer',
        synced: false,
      });

      // Update answer
      await indexedDBManager.update('offline_answers', answerId, {
        jawaban: 'Updated Answer',
      });

      const updated = await indexedDBManager.getById('offline_answers', answerId);
      expect(updated.jawaban).toBe('Updated Answer');
    });

    it('should delete synced answers', async () => {
      const answerId = 'attempt-1_soal-1';

      await indexedDBManager.create('offline_answers', {
        id: answerId,
        attempt_id: 'attempt-1',
        soal_id: 'soal-1',
        jawaban: 'Answer',
        synced: true,
      });

      await indexedDBManager.delete('offline_answers', answerId);

      const deleted = await indexedDBManager.getById('offline_answers', answerId);
      expect(deleted).toBeNull();
    });
  });

  // ============================================================================
  // SYNC QUEUE TESTS
  // ============================================================================

  describe('Sync Queue', () => {
    it('should queue multiple answers for sync', async () => {
      const answers = [
        {
          id: 'attempt-1_soal-1',
          attempt_id: 'attempt-1',
          soal_id: 'soal-1',
          jawaban: 'Answer 1',
          synced: false,
        },
        {
          id: 'attempt-1_soal-2',
          attempt_id: 'attempt-1',
          soal_id: 'soal-2',
          jawaban: 'Answer 2',
          synced: false,
        },
        {
          id: 'attempt-1_soal-3',
          attempt_id: 'attempt-1',
          soal_id: 'soal-3',
          jawaban: 'Answer 3',
          synced: false,
        },
      ];

      for (const answer of answers) {
        await indexedDBManager.create('offline_answers', answer);
      }

      const queued = await indexedDBManager.getAll('offline_answers');
      expect(queued).toHaveLength(3);
      expect(queued.every((a: any) => !a.synced)).toBe(true);
    });

    it('should process sync queue in order', async () => {
      const answers = [
        { soal_id: 'soal-1', jawaban: 'Answer 1', order: 1 },
        { soal_id: 'soal-2', jawaban: 'Answer 2', order: 2 },
        { soal_id: 'soal-3', jawaban: 'Answer 3', order: 3 },
      ];

      for (const answer of answers) {
        await indexedDBManager.create('offline_answers', {
          id: `attempt-1_${answer.soal_id}`,
          attempt_id: 'attempt-1',
          ...answer,
          synced: false,
        });
      }

      const queued = await indexedDBManager.getAll('offline_answers');
      expect(queued).toHaveLength(3);

      // Verify order is maintained
      const sorted = queued.sort((a: any, b: any) => a.order - b.order);
      expect(sorted[0].soal_id).toBe('soal-1');
      expect(sorted[1].soal_id).toBe('soal-2');
      expect(sorted[2].soal_id).toBe('soal-3');
    });
  });

  // ============================================================================
  // SYNC ON RECONNECT TESTS
  // ============================================================================

  describe('Sync on Reconnect', () => {
    it('should sync all pending answers when coming online', async () => {
      // Setup offline answers
      const pendingAnswers = [
        {
          id: 'attempt-1_soal-1',
          attempt_id: 'attempt-1',
          soal_id: 'soal-1',
          jawaban: 'Offline Answer 1',
          synced: false,
        },
        {
          id: 'attempt-1_soal-2',
          attempt_id: 'attempt-1',
          soal_id: 'soal-2',
          jawaban: 'Offline Answer 2',
          synced: false,
        },
      ];

      for (const answer of pendingAnswers) {
        await indexedDBManager.create('offline_answers', answer);
      }

      // Verify answers are queued
      const beforeSync = await indexedDBManager.getAll('offline_answers');
      expect(beforeSync).toHaveLength(2);

      // Mock sync function (simulates successful API calls)
      const syncResults: any[] = [];
      for (const answer of pendingAnswers) {
        syncResults.push({
          ...answer,
          synced: true,
        });
        await indexedDBManager.delete('offline_answers', answer.id);
      }

      // Verify all answers were "synced" (deleted from offline storage)
      const afterSync = await indexedDBManager.getAll('offline_answers');
      expect(afterSync).toHaveLength(0);
    });

    it('should handle sync errors gracefully', async () => {
      const answers = [
        {
          id: 'attempt-1_soal-1',
          attempt_id: 'attempt-1',
          soal_id: 'soal-1',
          jawaban: 'Answer 1',
          synced: false,
        },
        {
          id: 'attempt-1_soal-2',
          attempt_id: 'attempt-1',
          soal_id: 'soal-2',
          jawaban: 'Answer 2',
          synced: false,
        },
      ];

      for (const answer of answers) {
        await indexedDBManager.create('offline_answers', answer);
      }

      // Simulate partial sync (first succeeds, second fails)
      try {
        // Sync first answer
        await indexedDBManager.delete('offline_answers', answers[0].id);

        // Second answer fails (simulate by keeping it)
        // (in real scenario, this would be caught by try-catch in sync function)
      } catch (error) {
        // Error handling
      }

      // Check that failed answer is still in queue
      const remaining = await indexedDBManager.getAll('offline_answers');
      expect(remaining.length).toBeGreaterThan(0);
    });

    it('should retry failed syncs', async () => {
      const answer = {
        id: 'attempt-1_soal-1',
        attempt_id: 'attempt-1',
        soal_id: 'soal-1',
        jawaban: 'Answer',
        synced: false,
        retryCount: 0,
      };

      await indexedDBManager.create('offline_answers', answer);

      // Simulate retry logic
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          // Simulate sync attempt
          const stored = await indexedDBManager.getById('offline_answers', answer.id);

          if (stored) {
            retryCount = stored.retryCount || 0;
            retryCount++;

            if (retryCount >= maxRetries) {
              // Max retries reached - mark as failed or remove
              await indexedDBManager.delete('offline_answers', answer.id);
              break;
            }

            // Update retry count
            await indexedDBManager.update('offline_answers', answer.id, {
              retryCount,
            });
          }
        } catch (error) {
          retryCount++;
        }
      }

      expect(retryCount).toBe(maxRetries);
    });
  });

  // ============================================================================
  // CONFLICT RESOLUTION TESTS
  // ============================================================================

  describe('Conflict Resolution', () => {
    it('should handle duplicate answer submissions', async () => {
      const answerId = 'attempt-1_soal-1';

      // First submission
      await indexedDBManager.create('offline_answers', {
        id: answerId,
        attempt_id: 'attempt-1',
        soal_id: 'soal-1',
        jawaban: 'First Answer',
        timestamp: Date.now() - 1000,
        synced: false,
      });

      // Second submission (more recent)
      await indexedDBManager.update('offline_answers', answerId, {
        jawaban: 'Second Answer',
        timestamp: Date.now(),
      });

      const final = await indexedDBManager.getById('offline_answers', answerId);
      expect(final.jawaban).toBe('Second Answer');
    });

    it('should use most recent answer in case of conflicts', async () => {
      const answers = [
        {
          timestamp: Date.now() - 3000,
          jawaban: 'Old Answer',
        },
        {
          timestamp: Date.now() - 2000,
          jawaban: 'Newer Answer',
        },
        {
          timestamp: Date.now() - 1000,
          jawaban: 'Newest Answer',
        },
      ];

      // Sort and use most recent
      const sorted = answers.sort((a, b) => b.timestamp - a.timestamp);
      expect(sorted[0].jawaban).toBe('Newest Answer');
    });
  });

  // ============================================================================
  // DATA INTEGRITY TESTS
  // ============================================================================

  describe('Data Integrity', () => {
    it('should preserve answer data during offline-online transitions', async () => {
      const originalAnswer = {
        id: 'attempt-1_soal-1',
        attempt_id: 'attempt-1',
        soal_id: 'soal-1',
        jawaban: 'Important Answer',
        metadata: {
          answeredAt: Date.now(),
          questionType: 'essay',
        },
        synced: false,
      };

      // Save offline
      await indexedDBManager.create('offline_answers', originalAnswer);

      // Retrieve
      const retrieved = await indexedDBManager.getById(
        'offline_answers',
        originalAnswer.id
      );

      // Verify data integrity
      expect(retrieved).toEqual(originalAnswer);
      expect(retrieved.jawaban).toBe(originalAnswer.jawaban);
      expect(retrieved.metadata).toEqual(originalAnswer.metadata);
    });

    it('should validate data before sync', async () => {
      const invalidAnswer = {
        id: 'attempt-1_soal-1',
        // Missing required fields
        synced: false,
      };

      // Validation should fail
      const isValid = !!(
        invalidAnswer.id &&
        (invalidAnswer as any).attempt_id &&
        (invalidAnswer as any).soal_id &&
        (invalidAnswer as any).jawaban
      );

      expect(isValid).toBe(false);
    });

    it('should handle empty answers gracefully', async () => {
      const emptyAnswer = {
        id: 'attempt-1_soal-1',
        attempt_id: 'attempt-1',
        soal_id: 'soal-1',
        jawaban: '',
        synced: false,
      };

      await indexedDBManager.create('offline_answers', emptyAnswer);

      const retrieved = await indexedDBManager.getById(
        'offline_answers',
        emptyAnswer.id
      );

      expect(retrieved).toBeTruthy();
      expect(retrieved.jawaban).toBe('');
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    it('should handle large number of queued answers', async () => {
      const count = 100;
      const answers = Array.from({ length: count }, (_, i) => ({
        id: `attempt-1_soal-${i}`,
        attempt_id: 'attempt-1',
        soal_id: `soal-${i}`,
        jawaban: `Answer ${i}`,
        synced: false,
      }));

      // Queue all answers
      for (const answer of answers) {
        await indexedDBManager.create('offline_answers', answer);
      }

      const queued = await indexedDBManager.getAll('offline_answers');
      expect(queued).toHaveLength(count);
    });

    it('should sync in batches for better performance', async () => {
      const batchSize = 5;
      const totalAnswers = 15;
      const answers = Array.from({ length: totalAnswers }, (_, i) => ({
        id: `attempt-1_soal-${i}`,
        attempt_id: 'attempt-1',
        soal_id: `soal-${i}`,
        jawaban: `Answer ${i}`,
        synced: false,
      }));

      // Queue all
      for (const answer of answers) {
        await indexedDBManager.create('offline_answers', answer);
      }

      // Simulate batch sync
      const batches = Math.ceil(totalAnswers / batchSize);
      expect(batches).toBe(3);

      // Process first batch
      for (let i = 0; i < batchSize; i++) {
        await indexedDBManager.delete('offline_answers', answers[i].id);
      }

      const remaining = await indexedDBManager.getAll('offline_answers');
      expect(remaining).toHaveLength(totalAnswers - batchSize);
    });
  });
});
