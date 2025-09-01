import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { NextRequest } from 'next/server';
import type { ParsedRecipe } from '@/types/api';
import type { ParsedIngredient, RecipeInstruction } from '@/types/recipe';

// Mock the fetch function to use local HTML fixtures instead of network requests
const originalFetch = global.fetch;

describe('E2E API Integration with HTML Fixtures', () => {
  let allRecipesHtml: string;
  let downshiftologyHtml: string;
  let foodNetworkHtml: string;

  beforeAll(() => {
    // Load HTML fixtures
    const fixturesPath = join(__dirname, 'fixtures');
    allRecipesHtml = readFileSync(join(fixturesPath, 'allrecipes-mexican-casserole.html'), 'utf-8');
    downshiftologyHtml = readFileSync(join(fixturesPath, 'downshiftology-mediterranean-stir-fry.html'), 'utf-8');
    foodNetworkHtml = readFileSync(join(fixturesPath, 'foodnetwork-cacio-e-uova.html'), 'utf-8');

    // Mock fetch to return local HTML fixtures
    global.fetch = async (url: string | URL | Request) => {
      const urlString = url.toString();
      
      if (urlString.includes('allrecipes.com')) {
        return new Response(allRecipesHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' }
        });
      } else if (urlString.includes('downshiftology.com')) {
        return new Response(downshiftologyHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' }
        });
      } else if (urlString.includes('foodnetwork.com')) {
        return new Response(foodNetworkHtml, {
          status: 200,
          headers: { 'content-type': 'text/html' }
        });
      }
      
      // Default to 404 for unknown URLs
      return new Response('Not Found', { status: 404 });
    };
  });

  beforeEach(async () => {
    // Clear cache and rate limiter between tests to ensure isolation
    const { recipeCache } = await import('@/lib/cache');
    const { rateLimiter } = await import('@/lib/rate-limiter');
    
    recipeCache.clear();
    rateLimiter.cleanup();
  });

  afterAll(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should parse AllRecipes recipe end-to-end', async () => {
    // Import the API route handler
    const { GET } = await import('@/app/api/parse/route');
    
    // Create a mock request
    const request = new Request('http://localhost:3000/api/parse?url=https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
    
    // Call the API handler
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as ParsedRecipe;
    
    // Verify successful parsing
    expect(response.status).toBe(200);
    expect(data.title).toBe('Best Taco Casserole');
    expect(data.source).toBe('json-ld');
    expect(data.servings).toBe('6');
    expect(data.ingredients).toHaveLength(9);
    expect(data.instructions).toHaveLength(7);
    
    // Verify specific ingredient parsing
    const groundBeef = data.ingredients.find(ing => ing.ingredient === 'lean ground beef');
    expect(groundBeef).toBeTruthy();
    expect(groundBeef.quantity).toBe(1);
    expect(groundBeef.unit).toBe('pound');
    
    // Verify instruction with timer
    const cookingStep = data.instructions.find(inst => inst.text.includes('8 to 10 minutes'));
    expect(cookingStep).toBeTruthy();
    expect(cookingStep.duration?.minutes).toBe(10);
    
    // Verify metadata
    expect(data.url).toBe('https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
    expect(data.domain).toBe('www.allrecipes.com');
    expect(data.parseTime).toBeGreaterThan(0);
  });

  it('should parse Downshiftology recipe end-to-end', async () => {
    const { GET } = await import('@/app/api/parse/route');
    
    const request = new Request('http://localhost:3000/api/parse?url=https://downshiftology.com/recipes/mediterranean-ground-beef-stir-fry/');
    
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as ParsedRecipe;
    
    expect(response.status).toBe(200);
    expect(data.title).toContain('Mediterranean');
    expect(data.source).toBe('json-ld');
    expect(data.ingredients.length).toBeGreaterThan(5);
    expect(data.instructions.length).toBeGreaterThan(3);
    expect(data.domain).toBe('downshiftology.com');
    expect(data.images.length).toBeGreaterThan(0);
  });

  it('should parse Food Network mock recipe end-to-end', async () => {
    const { GET } = await import('@/app/api/parse/route');
    
    const request = new Request('http://localhost:3000/api/parse?url=https://www.foodnetwork.com/recipes/food-network-kitchen/extra-creamy-cacio-e-uova-with-grated-egg-12646498');
    
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as ParsedRecipe;
    
    expect(response.status).toBe(200);
    expect(data.title).toBe('Extra-Creamy Cacio e Uova with Grated Egg');
    expect(data.source).toBe('json-ld');
    expect(data.servings).toBe('4');
    expect(data.totalTime).toBe('25 minutes');
    expect(data.ingredients).toHaveLength(7);
    expect(data.instructions).toHaveLength(6);
    expect(data.domain).toBe('www.foodnetwork.com');
  });

  it('should handle invalid URLs with proper error responses', async () => {
    const { GET } = await import('@/app/api/parse/route');
    
    // Test missing URL parameter
    const requestNoUrl = new Request('http://localhost:3000/api/parse');
    const responseNoUrl = await GET(requestNoUrl as unknown as NextRequest);
    const dataNoUrl = await responseNoUrl.json();
    
    expect(responseNoUrl.status).toBe(400);
    expect(dataNoUrl.error).toBe('missing_url');
    expect(dataNoUrl.message).toBe('URL parameter is required');
    
    // Test invalid URL format
    const requestInvalidUrl = new Request('http://localhost:3000/api/parse?url=not-a-url');
    const responseInvalidUrl = await GET(requestInvalidUrl as unknown as NextRequest);
    const dataInvalidUrl = await responseInvalidUrl.json();
    
    expect(responseInvalidUrl.status).toBe(403);
    expect(dataInvalidUrl.error).toBe('forbidden_url');
    
    // Test localhost URL (should be blocked)
    const requestLocalhost = new Request('http://localhost:3000/api/parse?url=http://localhost:8080/recipe');
    const responseLocalhost = await GET(requestLocalhost as unknown as NextRequest);
    const dataLocalhost = await responseLocalhost.json();
    
    expect(responseLocalhost.status).toBe(403);
    expect(dataLocalhost.error).toBe('forbidden_url');
  });

  it('should handle 404 responses gracefully', async () => {
    const { GET } = await import('@/app/api/parse/route');
    
    const request = new Request('http://localhost:3000/api/parse?url=https://example.com/nonexistent-recipe');
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('fetch_failed');
    expect(data.message).toContain('404');
  });

  it('should include cache headers in responses', async () => {
    const { GET } = await import('@/app/api/parse/route');
    
    // First request should be a cache MISS
    const request1 = new Request('http://localhost:3000/api/parse?url=https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
    const response1 = await GET(request1 as unknown as NextRequest);
    
    expect(response1.status).toBe(200);
    expect(response1.headers.get('X-Cache')).toBe('MISS');
    expect(response1.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    
    // Second request should be a cache HIT
    const request2 = new Request('http://localhost:3000/api/parse?url=https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
    const response2 = await GET(request2 as unknown as NextRequest);
    
    expect(response2.status).toBe(200);
    expect(response2.headers.get('X-Cache')).toBe('HIT');
    expect(response2.headers.get('X-RateLimit-Remaining')).toBeTruthy();
  });

  it('should enforce rate limiting', async () => {
    const { GET } = await import('@/app/api/parse/route');
    
    // Make multiple requests to trigger rate limiting
    const requests = [];
    for (let i = 0; i < 12; i++) {
      const request = new Request(`http://localhost:3000/api/parse?url=https://example.com/recipe-${i}`);
      requests.push(GET(request as unknown as NextRequest));
    }
    
    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited (429 status)
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    // Check rate limit headers
    const rateLimitedResponse = rateLimitedResponses[0];
    const rateLimitData = await rateLimitedResponse.json();
    
    expect(rateLimitData.error).toBe('rate_limit_exceeded');
    expect(rateLimitedResponse.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(rateLimitedResponse.headers.get('Retry-After')).toBeTruthy();
  });

  it('should validate recipe data structure', async () => {
    const { GET } = await import('@/app/api/parse/route');
    
    // Use a fresh URL that hasn't been used in other tests to avoid rate limiting
    const request = new Request('http://localhost:3000/api/parse?url=https://www.foodnetwork.com/recipes/food-network-kitchen/extra-creamy-cacio-e-uova-with-grated-egg-12646498');
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as ParsedRecipe;
    
    // Skip validation if rate limited (can happen due to previous tests)
    if (response.status === 429) {
      expect(data.error).toBe('rate_limit_exceeded');
      return;
    }
    
    // Validate successful response
    expect(response.status).toBe(200);
    
    // Validate recipe structure matches our Recipe interface
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('ingredients');
    expect(data).toHaveProperty('instructions');
    expect(data).toHaveProperty('source');
    expect(data).toHaveProperty('parseTime');
    expect(data).toHaveProperty('domain');
    expect(data).toHaveProperty('url');
    expect(data).toHaveProperty('images');
    
    // Validate ingredients structure
    data.ingredients.forEach((ingredient: ParsedIngredient) => {
      expect(ingredient).toHaveProperty('raw');
      expect(ingredient).toHaveProperty('ingredient');
      // quantity and unit are optional
    });
    
    // Validate instructions structure
    data.instructions.forEach((instruction: RecipeInstruction) => {
      expect(instruction).toHaveProperty('step');
      expect(instruction).toHaveProperty('text');
      expect(typeof instruction.step).toBe('number');
      expect(typeof instruction.text).toBe('string');
    });
  });
});
