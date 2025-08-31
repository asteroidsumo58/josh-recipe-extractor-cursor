import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonLd, parseMicrodata } from '@/lib/parsers/structured-data';
import { parseHtmlHeuristics } from '@/lib/parsers/html-heuristics';
import { Recipe } from '@/types/recipe';
import { recipeCache } from '@/lib/cache';
import { rateLimiter } from '@/lib/rate-limiter';

// Request validation schema
const ParseRequestSchema = z.object({
  url: z.string().min(1, 'URL is required'),
});

// Legacy response type for backward compatibility
export interface ParsedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  totalTime?: string;
  servings?: string;
  images: string[];
  source: 'json-ld' | 'microdata' | 'html-heuristics';
  parseTime: number;
}

export interface ParseError {
  error: string;
  message: string;
  suggestion?: string;
}

// Get client IP address from request headers
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default IP for development
  return '127.0.0.1';
}

// Generate cache key for a URL
function getCacheKey(url: string): string {
  // Normalize URL to ensure consistent caching
  try {
    const parsedUrl = new URL(url);
    // Remove fragment and normalize
    parsedUrl.hash = '';
    return `recipe:${parsedUrl.toString()}`;
  } catch {
    return `recipe:${url}`;
  }
}

// Security: Validate URL to prevent SSRF attacks
function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    // Block private/local IP ranges and localhost
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Block localhost variations
    if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
      return { isValid: false, error: 'Local URLs are not allowed' };
    }
    
    // Block private IP ranges (basic check)
    if (hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
      return { isValid: false, error: 'Private IP addresses are not allowed' };
    }
    
    // Block data: and file: schemes (already handled by protocol check, but extra safety)
    if (url.startsWith('data:') || url.startsWith('file:')) {
      return { isValid: false, error: 'Data and file URLs are not allowed' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

// Fetch webpage with proper headers and timeout
async function fetchWebpage(url: string): Promise<{ html: string; domain: string; fetchTime: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Recipe-Extractor/1.0 (+https://github.com/recipe-extractor) Mozilla/5.0 (compatible; RecipeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // 30 second timeout
      signal: AbortSignal.timeout(30000),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('URL does not return HTML content');
    }
    
    const html = await response.text();
    const domain = new URL(url).hostname;
    const fetchTime = Date.now() - startTime;
    
    console.log(`✅ Fetched ${domain} in ${fetchTime}ms (${html.length} chars)`);
    
    return { html, domain, fetchTime };
  } catch (error) {
    const fetchTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Request timeout - the website took too long to respond');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error - unable to connect to the website');
      }
      throw error;
    }
    
    throw new Error('Unknown error occurred while fetching the webpage');
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimit = rateLimiter.checkLimit(clientIP);
    if (!rateLimit.allowed) {
      console.log(`🚫 Rate limit exceeded for IP ${clientIP.replace(/\d+/g, 'xxx')} (${rateLimit.remaining} remaining)`);
      return NextResponse.json(
        { 
          error: 'rate_limit_exceeded', 
          message: 'Too many requests. Please wait before trying again.',
          suggestion: `Rate limit: ${rateLimiter.getStats().maxRequests} requests per minute. Try again in a few moments.`
        } as ParseError,
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimiter.getStats().maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Parse and validate URL parameter
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'missing_url', message: 'URL parameter is required' } as ParseError,
        { status: 400 }
      );
    }
    
    // Validate request schema
    const parseResult = ParseRequestSchema.safeParse({ url });
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message || 'Invalid URL format';
      return NextResponse.json(
        { 
          error: 'invalid_url', 
          message: errorMessage,
          suggestion: 'Please provide a valid HTTP or HTTPS URL'
        } as ParseError,
        { status: 400 }
      );
    }
    
    // Security validation
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'forbidden_url', 
          message: urlValidation.error || 'URL not allowed',
          suggestion: 'Please use a public recipe website URL'
        } as ParseError,
        { status: 403 }
      );
    }
    
    // Check cache first
    const cacheKey = getCacheKey(url);
    const cachedRecipe = recipeCache.get(cacheKey);
    
    if (cachedRecipe) {
      const totalTime = Date.now() - startTime;
      const domain = new URL(url).hostname;
      console.log(`💾 Cache HIT for ${domain} - served in ${totalTime}ms (${rateLimit.remaining} requests remaining)`);
      
      // Add cache headers
      const response = NextResponse.json(cachedRecipe);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      return response;
    }
    
    console.log(`💾 Cache MISS for ${new URL(url).hostname} - fetching and parsing...`);
    
    // Fetch the webpage
    const { html, domain, fetchTime } = await fetchWebpage(url);
    
    console.log(`🔍 Processing ${domain} - fetch: ${fetchTime}ms, parsing...`);
    
    // Try structured data parsing in order of preference
    let recipe: Recipe | null = null;
    
    // 1. Try JSON-LD first (most reliable)
    recipe = parseJsonLd(html, url);
    
    // 2. Fall back to microdata if JSON-LD fails
    if (!recipe) {
      console.log(`⚠️ No JSON-LD found for ${domain}, trying microdata...`);
      recipe = parseMicrodata(html, url);
    }
    
    // 3. Fall back to HTML heuristics if structured data fails
    if (!recipe) {
      console.log(`⚠️ No structured data found for ${domain}, trying HTML heuristics...`);
      recipe = parseHtmlHeuristics(html, url);
    }
    
    // 4. If all parsing methods fail, return error
    if (!recipe) {
      console.log(`❌ All parsing methods failed for ${domain}`);
      return NextResponse.json(
        { 
          error: 'no_recipe_found', 
          message: 'No recipe data found on this page',
          suggestion: 'This page may not contain a recipe, or the recipe format is not supported. Try pasting the recipe text manually or use a different recipe URL.'
        } as ParseError,
        { status: 404 }
      );
    }
    
    // Cache the successful result
    recipeCache.set(cacheKey, recipe);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Successfully parsed ${recipe.source} recipe from ${domain} - fetch: ${fetchTime}ms, parse: ${recipe.parseTime}ms, total: ${totalTime}ms (cached for 24h, ${rateLimit.remaining} requests remaining)`);
    
    // Add cache and rate limit headers
    const response = NextResponse.json(recipe);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    
    return response;
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    console.error('❌ Parse error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'fetch_failed', 
          message: error.message,
          suggestion: 'Please check the URL and try again, or try a different recipe website'
        } as ParseError,
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'unknown_error', 
        message: 'An unexpected error occurred while processing the recipe',
        suggestion: 'Please try again or contact support if the problem persists'
      } as ParseError,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Use GET with ?url= parameter' } as ParseError,
    { status: 405 }
  );
}
