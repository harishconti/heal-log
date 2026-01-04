/**
 * CachedImage Component
 *
 * An optimized image component for displaying patient photos in lists.
 * Features:
 * - Memory caching for fast re-renders
 * - Placeholder during loading
 * - Lazy loading support
 * - Error handling with fallback
 */

import React, { memo, useState, useEffect, useMemo } from 'react';
import {
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOptimizedImageUri } from '@/services/image_service';

interface CachedImageProps {
  base64?: string | null;
  cacheKey: string;
  size?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholderColor?: string;
  placeholderIconColor?: string;
  showLoading?: boolean;
}

/**
 * Optimized image component with caching for patient photos
 */
function CachedImageComponent({
  base64,
  cacheKey,
  size = 50,
  style,
  containerStyle,
  placeholderColor = '#f0f0f0',
  placeholderIconColor = '#666',
  showLoading = false,
}: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get cached or create new URI
  const imageUri = useMemo(() => {
    if (!base64) return null;
    return getOptimizedImageUri(base64, cacheKey);
  }, [base64, cacheKey]);

  // Reset states when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [base64, cacheKey]);

  const containerStyles: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    ...containerStyle,
  };

  const imageStyles: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...style,
  };

  // Show placeholder if no image or error
  if (!imageUri || hasError) {
    return (
      <View style={[styles.placeholder, containerStyles, { backgroundColor: placeholderColor }]}>
        <Ionicons name="person" size={size * 0.5} color={placeholderIconColor} />
      </View>
    );
  }

  return (
    <View style={containerStyles}>
      <Image
        source={{ uri: imageUri }}
        style={imageStyles}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        // Performance optimizations
        resizeMode="cover"
        fadeDuration={0} // Disable fade for faster display
      />
      {showLoading && isLoading && (
        <View style={[styles.loadingOverlay, containerStyles]}>
          <ActivityIndicator size="small" color="#2ecc71" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});

// Memoize to prevent unnecessary re-renders
export const CachedImage = memo(CachedImageComponent, (prevProps, nextProps) => {
  return (
    prevProps.base64 === nextProps.base64 &&
    prevProps.cacheKey === nextProps.cacheKey &&
    prevProps.size === nextProps.size
  );
});

export default CachedImage;
