import type { Recipe } from '@/types/recipe';

/**
 * LRU Cache with TTL (Time To Live) support
 * Used for caching parsed recipe data with 24-hour expiration
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 24 * 60 * 60 * 1000) { // 24 hours default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache if it exists and hasn't expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  /**
   * Set value in cache with optional TTL override
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl ?? this.defaultTTL;

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If at max capacity, remove least recently used (first entry)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: entryTTL
    });
  }

  /**
   * Check if key exists and hasn't expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    size: number;
    maxSize: number;
    defaultTTL: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      entries
    };
  }
}

// Global cache instance for recipe parsing
export const recipeCache = new LRUCache<Recipe>(100, 24 * 60 * 60 * 1000); // 100 entries, 24h TTL
