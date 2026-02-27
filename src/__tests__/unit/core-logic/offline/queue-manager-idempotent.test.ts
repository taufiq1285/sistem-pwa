import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockQueueManager,
  mockGenerateRequestId,
  mockAddIdempotencyKey,
  mockExtractIdempotencyKey,
  mockWasRequestProcessed,
  mockMarkRequestProcessed,
  mockCleanupProcessedRequests,
  mockGetIdempotencyStats,
} = vi.hoisted(() => ({
  mockQueueManager: {
    initialize: vi.fn(),
    enqueue: vi.fn(),
    getAllItems: vi.fn(),
    processQueue: vi.fn(),
    retryFailed: vi.fn(),
    clearCompleted: vi.fn(),
    getStats: vi.fn(),
    setProcessor: vi.fn(),
    on: vi.fn(),
    isReady: vi.fn(),
    isProcessingQueue: vi.fn(),
  },
  mockGenerateRequestId: vi.fn(),
  mockAddIdempotencyKey: vi.fn(),
  mockExtractIdempotencyKey: vi.fn(),
  mockWasRequestProcessed: vi.fn(),
  mockMarkRequestProcessed: vi.fn(),
  mockCleanupProcessedRequests: vi.fn(),
  mockGetIdempotencyStats: vi.fn(),
}));

vi.mock("@/lib/offline/queue-manager", () => ({
  queueManager: mockQueueManager,
}));

vi.mock("@/lib/utils/idempotency", () => ({
  generateRequestId: mockGenerateRequestId,
  addIdempotencyKey: mockAddIdempotencyKey,
  extractIdempotencyKey: mockExtractIdempotencyKey,
  wasRequestProcessed: mockWasRequestProcessed,
  markRequestProcessed: mockMarkRequestProcessed,
  cleanupProcessedRequests: mockCleanupProcessedRequests,
  getIdempotencyStats: mockGetIdempotencyStats,
}));

import {
  IdempotentQueueManager,
  migrateToIdempotentQueue,
} from "@/lib/offline/queue-manager-idempotent";

describe("queue-manager-idempotent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockQueueManager.enqueue.mockResolvedValue({
      id: "q-1",
      entity: "kuis",
      operation: "create",
      data: { foo: "bar", _requestId: "req-1" },
      timestamp: Date.now(),
      status: "pending",
      retryCount: 0,
    });

    mockQueueManager.getAllItems.mockResolvedValue([]);
    mockQueueManager.processQueue.mockResolvedValue({
      processed: 1,
      succeeded: 1,
      failed: 0,
      errors: [],
    });
    mockQueueManager.retryFailed.mockResolvedValue(2);
    mockQueueManager.clearCompleted.mockResolvedValue(3);
    mockQueueManager.getStats.mockResolvedValue({
      total: 1,
      pending: 1,
      syncing: 0,
      completed: 0,
      failed: 0,
    });
    mockQueueManager.on.mockReturnValue(() => undefined);
    mockQueueManager.isReady.mockReturnValue(true);
    mockQueueManager.isProcessingQueue.mockReturnValue(false);

    mockGenerateRequestId.mockReturnValue("req-generated");
    mockAddIdempotencyKey.mockImplementation((data) => ({
      ...data,
      _requestId: "req-added",
    }));
    mockExtractIdempotencyKey.mockImplementation(
      (data: any) => data?._requestId,
    );
    mockWasRequestProcessed.mockReturnValue(false);
    mockCleanupProcessedRequests.mockReturnValue(0);
    mockGetIdempotencyStats.mockReturnValue({ total: 4 });
  });

  it("initialize mendelegasikan queue init dan auto-cleanup", async () => {
    const manager = new IdempotentQueueManager({
      autoCleanup: true,
      cleanupMaxAge: 12345,
    });

    await manager.initialize();

    expect(mockQueueManager.initialize).toHaveBeenCalledTimes(1);
    expect(mockCleanupProcessedRequests).toHaveBeenCalledWith(12345);
  });

  it("enqueue saat idempotency disabled langsung delegate", async () => {
    const manager = new IdempotentQueueManager({ enableIdempotency: false });
    const data = { judul: "Kuis 1" };

    await manager.enqueue("kuis" as any, "create" as any, data);

    expect(mockQueueManager.enqueue).toHaveBeenCalledWith(
      "kuis",
      "create",
      data,
    );
    expect(mockGenerateRequestId).not.toHaveBeenCalled();
  });

  it("enqueue menambahkan idempotency key ketika belum ada", async () => {
    const manager = new IdempotentQueueManager();

    mockExtractIdempotencyKey.mockReturnValueOnce(undefined);

    const result = await manager.enqueue("kuis" as any, "create" as any, {
      judul: "Kuis 2",
    });

    expect(mockGenerateRequestId).toHaveBeenCalledWith("kuis", "create");
    expect(mockAddIdempotencyKey).toHaveBeenCalled();
    expect(mockQueueManager.enqueue).toHaveBeenCalledWith("kuis", "create", {
      judul: "Kuis 2",
      _requestId: "req-added",
    });
    expect(result.id).toBe("q-1");
  });

  it("enqueue dedup: return existing queue item jika request sudah processed dan item masih ada", async () => {
    const manager = new IdempotentQueueManager();

    mockExtractIdempotencyKey.mockReturnValue("req-dup");
    mockWasRequestProcessed.mockReturnValue(true);
    mockQueueManager.getAllItems.mockResolvedValue([
      {
        id: "existing-1",
        data: { _requestId: "req-dup" },
        timestamp: Date.now(),
      },
    ]);

    const result = await manager.enqueue("kuis" as any, "create" as any, {
      _requestId: "req-dup",
    });

    expect(result.id).toBe("existing-1");
    expect(mockQueueManager.enqueue).not.toHaveBeenCalled();
  });

  it("enqueue dedup: return virtual completed item jika request sudah processed tapi tidak ada di queue", async () => {
    const manager = new IdempotentQueueManager();

    mockExtractIdempotencyKey.mockReturnValue("req-sudah");
    mockWasRequestProcessed.mockReturnValue(true);
    mockQueueManager.getAllItems.mockResolvedValue([]);

    const result = await manager.enqueue("kuis" as any, "create" as any, {
      _requestId: "req-sudah",
      nama: "x",
    });

    expect(result.status).toBe("completed");
    expect(String(result.id)).toMatch(/^virtual-/);
    expect(mockQueueManager.enqueue).not.toHaveBeenCalled();
  });

  it("processQueue menandai request completed yang recent", async () => {
    const manager = new IdempotentQueueManager();
    const now = Date.now();

    mockQueueManager.processQueue.mockResolvedValue({
      processed: 2,
      succeeded: 2,
      failed: 0,
      errors: [],
    });

    mockQueueManager.getAllItems.mockResolvedValue([
      { data: { _requestId: "req-recent" }, timestamp: now - 1_000 },
      { data: { _requestId: "req-old" }, timestamp: now - 70_000 },
      { data: {}, timestamp: now - 1_000 },
    ]);

    const result = await manager.processQueue();

    expect(result.succeeded).toBe(2);
    expect(mockQueueManager.getAllItems).toHaveBeenCalledWith("completed");
    expect(mockMarkRequestProcessed).toHaveBeenCalledTimes(1);
    expect(mockMarkRequestProcessed).toHaveBeenCalledWith("req-recent");
  });

  it("delegate methods retry/clear/stats/setProcessor/on/isReady/isProcessingQueue", async () => {
    const manager = new IdempotentQueueManager();
    const processor = vi.fn();

    await expect(manager.retryFailed()).resolves.toBe(2);
    await expect(manager.clearCompleted()).resolves.toBe(3);
    await expect(manager.getStats()).resolves.toEqual({
      total: 1,
      pending: 1,
      syncing: 0,
      completed: 0,
      failed: 0,
    });

    manager.setProcessor(processor as any);
    expect(mockQueueManager.setProcessor).toHaveBeenCalledWith(processor);

    const unsub = manager.on(() => undefined);
    expect(typeof unsub).toBe("function");

    expect(manager.isReady()).toBe(true);
    expect(manager.isProcessingQueue()).toBe(false);
  });

  it("findDuplicates dan removeDuplicates menghitung duplicate berbasis requestId pada item", async () => {
    const manager = new IdempotentQueueManager();

    mockQueueManager.getAllItems.mockResolvedValue([
      { id: "a", requestId: "dup-1", timestamp: 1 },
      { id: "b", requestId: "dup-1", timestamp: 2 },
      { id: "c", requestId: "dup-2", timestamp: 3 },
      { id: "d", requestId: "dup-2", timestamp: 4 },
      { id: "e", requestId: "single", timestamp: 5 },
    ]);

    const duplicates = await manager.findDuplicates();
    expect(duplicates).toHaveLength(2);

    const removed = await manager.removeDuplicates();
    expect(removed).toBe(2);
  });

  it("getIdempotencyStats menggabungkan stats queue + duplicate + processed", async () => {
    const manager = new IdempotentQueueManager();

    mockQueueManager.getStats.mockResolvedValue({
      total: 5,
      pending: 2,
      syncing: 0,
      completed: 2,
      failed: 1,
    });
    mockQueueManager.getAllItems.mockResolvedValue([
      { id: "a", requestId: "dup-1", timestamp: 1 },
      { id: "b", requestId: "dup-1", timestamp: 2 },
      { id: "c", requestId: "single", timestamp: 3 },
    ]);
    mockGetIdempotencyStats.mockReturnValue({ total: 7 });

    const stats = await manager.getIdempotencyStats();

    expect(stats.queueStats.total).toBe(5);
    expect(stats.processedCount).toBe(7);
    expect(stats.duplicatesInQueue).toBe(1);
    expect(stats.idempotencyEnabled).toBe(true);
  });

  it("migrateToIdempotentQueue menghitung item yang belum punya requestId", async () => {
    mockQueueManager.getAllItems.mockResolvedValue([
      {
        id: "item-1",
        entity: "kuis",
        operation: "create",
        data: {},
      },
      {
        id: "item-2",
        entity: "kuis",
        operation: "update",
        data: { _requestId: "exists" },
      },
    ]);

    mockExtractIdempotencyKey
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce("exists");

    const migrated = await migrateToIdempotentQueue();

    expect(migrated).toBe(1);
    expect(mockGenerateRequestId).toHaveBeenCalledWith("kuis", "create");
  });
});
