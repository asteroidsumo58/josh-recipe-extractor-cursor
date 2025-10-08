import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import type { ParsedRecipe } from '@/types/api';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Read fixtures index synchronously so tests are discovered at collect time
const fixturesDir = join(__dirname, 'fixtures', 'recipes');
const indexPath = join(fixturesDir, 'index.json');
const index = JSON.parse(readFileSync(indexPath, 'utf8')) as {
  generatedAt: string;
  count: number;
  entries: Array<{ url: string; file: string; status: number; ok: boolean; contentType: string; bytes: number }>;
};

describe('Batch parse 50+ real recipe snapshots', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.fetch = async (url: string | URL | Request) => {
      const urlString = url.toString();
      const entry = index.entries.find(e => e.url === urlString);
      if (entry) {
        const filePath = join(fixturesDir, entry.file);
        if (entry.ok !== false && existsSync(filePath)) {
          const html = readFileSync(filePath, 'utf8');
          return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
        }
        return new Response('Not Found', { status: 404 });
      }
      return new Response('Not Found', { status: 404 });
    };
  });

  beforeEach(async () => {
    const { recipeCache } = await import('@/lib/cache');
    const { rateLimiter } = await import('@/lib/rate-limiter');
    recipeCache.clear();
    rateLimiter.cleanup();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it(
    'parses all snapshots and returns recipes or structured errors',
    { timeout: 30_000 },
    async () => {
      expect(index.entries.length).toBeGreaterThanOrEqual(30);
      const { GET } = await import('@/app/api/parse/route');

      let successCount = 0;
      for (let i = 0; i < index.entries.length; i++) {
        const entry = index.entries[i];
        const headers = new Headers({ 'x-forwarded-for': `10.0.${Math.floor(i / 250)}.${(i % 250) + 1}` });
        const req = new Request(`http://localhost:3000/api/parse?url=${encodeURIComponent(entry.url)}`, { headers });
        const res = await GET(req as unknown as NextRequest);
        const body = await res.json();

        if (res.status === 200) {
          const data = body as ParsedRecipe;
          successCount++;
          expect(typeof data.title).toBe('string');
          expect(Array.isArray(data.ingredients)).toBe(true);
          expect(Array.isArray(data.instructions)).toBe(true);
          expect(typeof data.domain).toBe('string');
          expect(typeof data.url).toBe('string');
        } else {
          expect(body).toHaveProperty('error');
        }
      }

      // Ensure we successfully parsed a reasonable subset despite anti-bot blocks
      expect(successCount).toBeGreaterThanOrEqual(5);
    },
  );
});
