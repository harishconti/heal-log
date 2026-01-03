/**
 * Text sanitization utilities for preventing XSS attacks
 */

/**
 * Escapes HTML special characters in a string to prevent XSS
 * @param text - The text to sanitize
 * @returns Sanitized text safe for rendering
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitizes user-provided content for safe display
 * Removes potentially dangerous patterns while preserving legitimate content
 * @param content - The content to sanitize
 * @returns Sanitized content safe for display
 */
export function sanitizeContent(content: string | null | undefined): string {
  if (!content) {
    return '';
  }

  // First escape HTML entities
  let sanitized = escapeHtml(content);

  // Remove any javascript: or data: URLs that might have been encoded
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  // Remove any onclick, onerror, etc. event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Validates and sanitizes a URL
 * @param url - The URL to validate
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  // Only allow http, https, and mailto protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:'];

  try {
    const parsed = new URL(url);
    if (allowedProtocols.includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // URL parsing failed, check if it's a relative URL
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url; // Allow relative URLs starting with single slash
    }
  }

  return '';
}
