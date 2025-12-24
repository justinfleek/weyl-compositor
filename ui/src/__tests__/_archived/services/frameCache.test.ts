/**
 * FrameCache Tests
 *
 * Tests for the LRU frame caching system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FrameCache,
  getFrameCache,
  type FrameCacheConfig,
  type CacheStats,
} from '@/services/frameCache';
import { createTestImageData } from '../setup';

describe('FrameCache', () => {
  let cache: FrameCache;

  beforeEach(() => {
    cache = new FrameCache({
      maxFrames: 10,
      maxMemoryBytes: 1024 * 1024, // 1MB
      compression: false, // Disable for simpler testing
      preCacheWindow: 3,
      predictivePreCache: false,
    });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('basic operations', () => {
    it('should store and retrieve frames', async () => {
      const imageData = createTestImageData(100, 100, 200);
      const compositionId = 'comp1';
      const stateHash = 'hash1';

      await cache.set(0, compositionId, imageData, stateHash);

      const retrieved = cache.get(0, compositionId, stateHash);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.width).toBe(100);
      expect(retrieved!.height).toBe(100);
      expect(retrieved!.data[0]).toBe(200); // Red channel
    });

    it('should return null for non-existent frames', () => {
      const result = cache.get(999, 'comp1', 'hash1');
      expect(result).toBeNull();
    });

    it('should track cache hits and misses', async () => {
      const imageData = createTestImageData();
      await cache.set(0, 'comp1', imageData, 'hash1');

      // Hit
      cache.get(0, 'comp1', 'hash1');
      // Miss
      cache.get(1, 'comp1', 'hash1');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBe(0.5);
    });

    it('should report correct cached frame count', async () => {
      const imageData = createTestImageData();

      await cache.set(0, 'comp1', imageData, 'hash1');
      await cache.set(1, 'comp1', imageData, 'hash1');
      await cache.set(2, 'comp1', imageData, 'hash1');

      const stats = cache.getStats();
      expect(stats.cachedFrames).toBe(3);
    });

    it('should check frame existence with has()', async () => {
      const imageData = createTestImageData();
      await cache.set(5, 'comp1', imageData, 'hash1');

      expect(cache.has(5, 'comp1')).toBe(true);
      expect(cache.has(6, 'comp1')).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest frames when max reached', async () => {
      const smallCache = new FrameCache({
        maxFrames: 3,
        maxMemoryBytes: 1024 * 1024 * 1024,
        compression: false,
      });

      const imageData = createTestImageData();

      // Fill cache
      await smallCache.set(0, 'comp1', imageData, 'hash1');
      await smallCache.set(1, 'comp1', imageData, 'hash1');
      await smallCache.set(2, 'comp1', imageData, 'hash1');

      // This should evict frame 0
      await smallCache.set(3, 'comp1', imageData, 'hash1');

      expect(smallCache.has(0, 'comp1')).toBe(false);
      expect(smallCache.has(1, 'comp1')).toBe(true);
      expect(smallCache.has(2, 'comp1')).toBe(true);
      expect(smallCache.has(3, 'comp1')).toBe(true);

      smallCache.clear();
    });

    it('should update LRU order on access', async () => {
      const smallCache = new FrameCache({
        maxFrames: 3,
        maxMemoryBytes: 1024 * 1024 * 1024,
        compression: false,
      });

      const imageData = createTestImageData();

      await smallCache.set(0, 'comp1', imageData, 'hash1');
      await smallCache.set(1, 'comp1', imageData, 'hash1');
      await smallCache.set(2, 'comp1', imageData, 'hash1');

      // Access frame 0 to make it most recently used
      smallCache.get(0, 'comp1', 'hash1');

      // Add new frame - should evict frame 1 (now oldest)
      await smallCache.set(3, 'comp1', imageData, 'hash1');

      expect(smallCache.has(0, 'comp1')).toBe(true);  // Kept (recently accessed)
      expect(smallCache.has(1, 'comp1')).toBe(false); // Evicted
      expect(smallCache.has(2, 'comp1')).toBe(true);
      expect(smallCache.has(3, 'comp1')).toBe(true);

      smallCache.clear();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate on state hash change', async () => {
      const imageData = createTestImageData();
      await cache.set(0, 'comp1', imageData, 'hash1');

      // Should return data with matching hash
      expect(cache.get(0, 'comp1', 'hash1')).not.toBeNull();

      // Should return null with different hash (stale)
      expect(cache.get(0, 'comp1', 'hash2')).toBeNull();
    });

    it('should clear composition on invalidate()', async () => {
      const imageData = createTestImageData();
      await cache.set(0, 'comp1', imageData, 'hash1');
      await cache.set(1, 'comp1', imageData, 'hash1');
      await cache.set(0, 'comp2', imageData, 'hash1');

      cache.invalidate('comp1', 'hash2');

      expect(cache.has(0, 'comp1')).toBe(false);
      expect(cache.has(1, 'comp1')).toBe(false);
      expect(cache.has(0, 'comp2')).toBe(true); // Different composition
    });

    it('should clear specific composition with clearComposition()', async () => {
      const imageData = createTestImageData();
      await cache.set(0, 'comp1', imageData, 'hash1');
      await cache.set(1, 'comp1', imageData, 'hash1');
      await cache.set(0, 'comp2', imageData, 'hash1');

      cache.clearComposition('comp1');

      expect(cache.has(0, 'comp1')).toBe(false);
      expect(cache.has(1, 'comp1')).toBe(false);
      expect(cache.has(0, 'comp2')).toBe(true);
    });
  });

  describe('clear()', () => {
    it('should clear all cached frames', async () => {
      const imageData = createTestImageData();
      await cache.set(0, 'comp1', imageData, 'hash1');
      await cache.set(1, 'comp1', imageData, 'hash1');

      cache.clear();

      expect(cache.has(0, 'comp1')).toBe(false);
      expect(cache.has(1, 'comp1')).toBe(false);

      const stats = cache.getStats();
      expect(stats.cachedFrames).toBe(0);
      expect(stats.memoryUsed).toBe(0);
    });

    it('should reset hit/miss statistics', async () => {
      const imageData = createTestImageData();
      await cache.set(0, 'comp1', imageData, 'hash1');
      cache.get(0, 'comp1', 'hash1');
      cache.get(1, 'comp1', 'hash1');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('remove()', () => {
    it('should remove specific frame', async () => {
      const imageData = createTestImageData();
      await cache.set(0, 'comp1', imageData, 'hash1');
      await cache.set(1, 'comp1', imageData, 'hash1');

      cache.remove(0, 'comp1');

      expect(cache.has(0, 'comp1')).toBe(false);
      expect(cache.has(1, 'comp1')).toBe(true);
    });
  });

  describe('memory tracking', () => {
    it('should track memory usage', async () => {
      const imageData = createTestImageData(100, 100); // 100*100*4 = 40000 bytes

      await cache.set(0, 'comp1', imageData, 'hash1');

      const stats = cache.getStats();
      expect(stats.memoryUsed).toBe(40000);
    });

    it('should decrease memory on removal', async () => {
      const imageData = createTestImageData(100, 100);

      await cache.set(0, 'comp1', imageData, 'hash1');
      await cache.set(1, 'comp1', imageData, 'hash1');

      cache.remove(0, 'comp1');

      const stats = cache.getStats();
      expect(stats.memoryUsed).toBe(40000); // Only one frame left
    });

    it('should evict when memory limit exceeded', async () => {
      const tinyCache = new FrameCache({
        maxFrames: 100,
        maxMemoryBytes: 50000, // Just over one 100x100 frame
        compression: false,
      });

      const imageData = createTestImageData(100, 100); // 40000 bytes each

      await tinyCache.set(0, 'comp1', imageData, 'hash1');
      await tinyCache.set(1, 'comp1', imageData, 'hash1'); // Should evict frame 0

      expect(tinyCache.has(0, 'comp1')).toBe(false);
      expect(tinyCache.has(1, 'comp1')).toBe(true);

      tinyCache.clear();
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = cache.getConfig();
      expect(config.maxFrames).toBe(10);
      expect(config.compression).toBe(false);
    });

    it('should update configuration', () => {
      cache.setConfig({ maxFrames: 20 });
      const config = cache.getConfig();
      expect(config.maxFrames).toBe(20);
    });
  });
});

describe('getFrameCache singleton', () => {
  it('should return the same instance', () => {
    const cache1 = getFrameCache();
    const cache2 = getFrameCache();
    expect(cache1).toBe(cache2);
  });
});
