import { Duration } from '@/types/recipe';

/**
 * Concatenate class names (compatible with shadcn/ui components)
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Parse duration strings into standardized Duration objects
 * Handles various formats: "20 minutes", "1 hour", "1h 30m", "PT20M" (ISO 8601)
 */
export function parseDuration(text: string): Duration | null {
  if (!text) return null;
  
  const cleanText = text.toLowerCase().trim();
  
  // Handle ISO 8601 duration format (PT20M, PT1H30M)
  const iso8601Match = cleanText.match(/^pt(?:(\d+)h)?(?:(\d+)m)?$/);
  if (iso8601Match) {
    const hours = parseInt(iso8601Match[1] || '0');
    const minutes = parseInt(iso8601Match[2] || '0');
    const totalMinutes = hours * 60 + minutes;
    
    return {
      minutes: totalMinutes,
      display: formatDuration(totalMinutes),
      iso8601: text.toUpperCase(),
    };
  }
  
  // Parse common text formats
  let totalMinutes = 0;
  
  // Hours: "1 hour", "2 hrs", "1h"
  const hourMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
  }
  
  // Minutes: "30 minutes", "15 mins", "30m"
  const minuteMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/);
  if (minuteMatch) {
    totalMinutes += parseFloat(minuteMatch[1]);
  }
  
  // Seconds (convert to minutes): "30 seconds", "45 secs", "30s"
  const secondMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/);
  if (secondMatch) {
    totalMinutes += parseFloat(secondMatch[1]) / 60;
  }
  
  if (totalMinutes > 0) {
    return {
      minutes: Math.round(totalMinutes),
      display: formatDuration(Math.round(totalMinutes)),
      iso8601: `PT${Math.round(totalMinutes)}M`,
    };
  }
  
  return null;
}

/**
 * Format minutes into human-readable duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Clean and normalize text content
 */
export function cleanText(text: string): string {
  if (!text) return '';
  
  // First, normalize whitespace and remove control chars
  let result = text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim();

  // Decode ampersands first to handle double-escaped entities like &amp;#039;
  result = result.replace(/&amp;/g, '&');

  // Decode numeric entities (decimal and hex)
  result = result
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));

  // Decode common named entities
  result = result
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

  return result.trim();
}

/**
 * Extract numbers from text (for servings, quantities, etc.)
 */
export function extractNumber(text: string): number | null {
  if (!text) return null;
  
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Check if a URL is likely an image
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
  return imageExtensions.test(url);
}

/**
 * Normalize ingredient name for fuzzy matching
 */
export function normalizeIngredientName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 */
export function calculateSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(a, b);
  return (maxLength - distance) / maxLength;
}

/**
 * Find the best matching ingredient name in a list
 */
export function findBestIngredientMatch(
  target: string, 
  ingredients: string[], 
  threshold = 0.6
): { ingredient: string; score: number } | null {
  const normalizedTarget = normalizeIngredientName(target);
  let bestMatch = null as string | null;
  let bestScore = 0;
  
  for (const ingredient of ingredients) {
    const normalizedIngredient = normalizeIngredientName(ingredient);
    const score = calculateSimilarity(normalizedTarget, normalizedIngredient);
    
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = ingredient;
    }
  }
  
  return bestMatch ? { ingredient: bestMatch, score: bestScore } : null;
}

/**
 * Validate and clean URL
 */
export function cleanUrl(url: string, baseUrl?: string): string | null {
  if (!url) return null;
  
  try {
    // Handle relative URLs
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (url.startsWith('/') && baseUrl) {
      const base = new URL(baseUrl);
      url = base.origin + url;
    } else if (!url.startsWith('http')) {
      if (baseUrl) {
        url = new URL(url, baseUrl).href;
      } else {
        return null;
      }
    }
    
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Debounce function for rate limiting
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
