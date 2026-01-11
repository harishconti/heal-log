/**
 * Image Service - Performance optimizations for image handling
 *
 * Features:
 * - Image compression with configurable quality
 * - Memory-based caching for displayed images
 * - Thumbnail generation for lists
 * - Progressive loading support
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Configuration - Optimized for performance
const IMAGE_CONFIG = {
  // Full size image settings
  fullSize: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.7,
  },
  // Thumbnail settings for list views
  thumbnail: {
    maxWidth: 150,
    maxHeight: 150,
    quality: 0.5,
  },
  // Cache settings - Extended TTL for better performance
  cache: {
    maxEntries: 100, // Increased from 50 to handle more patients
    ttlMs: 30 * 60 * 1000, // Extended from 5 to 30 minutes
    cleanupIntervalMs: 5 * 60 * 1000, // Cleanup every 5 minutes
  },
};

// Optimized in-memory cache with LRU eviction
interface CacheEntry {
  uri: string;
  timestamp: number;
  lastAccessed: number;
  size: number; // Approximate size in bytes
}

class ImageCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number;
  private ttlMs: number;
  private cleanupIntervalMs: number;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private totalSize: number = 0;
  private maxSizeBytes: number = 50 * 1024 * 1024; // 50MB max cache size

  constructor(
    maxEntries: number = 100,
    ttlMs: number = 1800000,
    cleanupIntervalMs: number = 300000
  ) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.cleanupIntervalMs = cleanupIntervalMs;
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttlMs) {
        keysToDelete.push(key);
        this.totalSize -= entry.size;
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (__DEV__ && keysToDelete.length > 0) {
      console.log(`[ImageCache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    // Check if expired
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      return null;
    }

    // Update last accessed time for LRU tracking
    entry.lastAccessed = now;
    return entry.uri;
  }

  set(key: string, uri: string): void {
    // Estimate size (base64 string length * 0.75 for actual bytes)
    const estimatedSize = Math.floor((uri.length - uri.indexOf(',') - 1) * 0.75);

    // LRU eviction if at capacity
    while (
      (this.cache.size >= this.maxEntries || this.totalSize + estimatedSize > this.maxSizeBytes) &&
      this.cache.size > 0
    ) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      uri,
      timestamp: now,
      lastAccessed: now,
      size: estimatedSize,
    });
    this.totalSize += estimatedSize;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.totalSize -= entry.size;
      }
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  get size(): number {
    return this.cache.size;
  }

  get memorySizeBytes(): number {
    return this.totalSize;
  }

  get memorySizeMB(): string {
    return (this.totalSize / (1024 * 1024)).toFixed(2);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Global cache instance with optimized settings
const imageCache = new ImageCache(
  IMAGE_CONFIG.cache.maxEntries,
  IMAGE_CONFIG.cache.ttlMs,
  IMAGE_CONFIG.cache.cleanupIntervalMs
);

/**
 * Compress an image from URI
 * @param uri - Source image URI
 * @param options - Optional compression settings
 * @returns Base64 encoded compressed image
 */
export async function compressImage(
  uri: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<string> {
  const config = {
    maxWidth: options?.maxWidth ?? IMAGE_CONFIG.fullSize.maxWidth,
    maxHeight: options?.maxHeight ?? IMAGE_CONFIG.fullSize.maxHeight,
    quality: options?.quality ?? IMAGE_CONFIG.fullSize.quality,
  };

  try {
    // Resize and compress the image
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: config.maxWidth,
            height: config.maxHeight,
          },
        },
      ],
      {
        compress: config.quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    return manipResult.base64 || '';
  } catch (error) {
    console.error('[ImageService] Compression failed:', error);
    throw error;
  }
}

/**
 * Generate a thumbnail from an image URI
 * @param uri - Source image URI
 * @returns Base64 encoded thumbnail
 */
export async function generateThumbnail(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: IMAGE_CONFIG.thumbnail.maxWidth,
    maxHeight: IMAGE_CONFIG.thumbnail.maxHeight,
    quality: IMAGE_CONFIG.thumbnail.quality,
  });
}

/**
 * Get optimized image URI with caching
 * For base64 images, creates a cached data URI
 * @param base64 - Base64 image string
 * @param cacheKey - Unique cache key (e.g., patient ID)
 * @returns Cached or fresh data URI
 */
export function getOptimizedImageUri(
  base64: string | null | undefined,
  cacheKey: string
): string | null {
  if (!base64) return null;

  // Check cache first
  const cached = imageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Create data URI
  const uri = `data:image/jpeg;base64,${base64}`;

  // Cache the URI
  imageCache.set(cacheKey, uri);

  return uri;
}

/**
 * Preload images for a list of items
 * @param items - Array of items with photo property
 * @param getKey - Function to get cache key from item
 * @param getBase64 - Function to get base64 from item
 */
export function preloadImages<T>(
  items: T[],
  getKey: (item: T) => string,
  getBase64: (item: T) => string | null | undefined
): void {
  // Only preload first 10 items to avoid memory issues
  const itemsToPreload = items.slice(0, 10);

  for (const item of itemsToPreload) {
    const base64 = getBase64(item);
    if (base64) {
      getOptimizedImageUri(base64, getKey(item));
    }
  }
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Get current cache size
 */
export function getImageCacheSize(): number {
  return imageCache.size;
}

/**
 * Calculate approximate size of base64 image in bytes
 * @param base64 - Base64 string
 * @returns Size in bytes
 */
export function getBase64Size(base64: string): number {
  // Base64 encodes 3 bytes into 4 characters
  // Account for padding
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Check if image exceeds recommended size
 * @param base64 - Base64 string
 * @param maxSizeKB - Maximum size in KB (default 500KB)
 * @returns Whether image should be compressed
 */
export function shouldCompressImage(base64: string, maxSizeKB: number = 500): boolean {
  const sizeBytes = getBase64Size(base64);
  const sizeKB = sizeBytes / 1024;
  return sizeKB > maxSizeKB;
}

/**
 * Get cache statistics for monitoring
 */
export function getImageCacheStats() {
  return {
    entries: imageCache.size,
    memorySizeMB: imageCache.memorySizeMB,
    memorySizeBytes: imageCache.memorySizeBytes,
  };
}

export default {
  compressImage,
  generateThumbnail,
  getOptimizedImageUri,
  preloadImages,
  clearImageCache,
  getImageCacheSize,
  getImageCacheStats,
  getBase64Size,
  shouldCompressImage,
};
