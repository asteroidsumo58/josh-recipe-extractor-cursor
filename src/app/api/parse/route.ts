import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const ParseRequestSchema = z.object({
  url: z.string().min(1, 'URL is required'),
});

// Response types
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
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid URL format';
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
    
    // Fetch the webpage
    const { html, domain, fetchTime } = await fetchWebpage(url);
    
    // For now, return a placeholder response until we implement parsing
    const totalTime = Date.now() - startTime;
    
    console.log(`🔍 Processing ${domain} - fetch: ${fetchTime}ms, total: ${totalTime}ms`);
    
    // Placeholder response - we'll implement actual parsing in the next steps
    const placeholderRecipe: ParsedRecipe = {
      title: `Recipe from ${domain}`,
      ingredients: ['Parsing not yet implemented'],
      instructions: ['Recipe parsing will be implemented in the next step'],
      totalTime: 'Unknown',
      servings: 'Unknown',
      images: [],
      source: 'html-heuristics',
      parseTime: totalTime,
    };
    
    return NextResponse.json(placeholderRecipe);
    
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
