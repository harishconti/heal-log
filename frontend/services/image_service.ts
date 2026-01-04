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

// Configuration
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
  // Cache settings
  cache: {
    maxEntries: 50,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  },
};

// Simple in-memory cache for images
interface CacheEntry {
  uri: string;
  timestamp: number;
}

class ImageCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number;
  private ttlMs: number;

  constructor(maxEntries: number = 50, ttlMs: number = 300000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.uri;
  }

  set(key: string, uri: string): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      uri,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const imageCache = new ImageCache(
  IMAGE_CONFIG.cache.maxEntries,
  IMAGE_CONFIG.cache.ttlMs
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

export default {
  compressImage,
  generateThumbnail,
  getOptimizedImageUri,
  preloadImages,
  clearImageCache,
  getImageCacheSize,
  getBase64Size,
  shouldCompressImage,
};
