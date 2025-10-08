import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { NextRequest } from 'next/server';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next/Image to a plain img for jsdom
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Drop 'fill' boolean to avoid invalid DOM attribute warning in jsdom
    // Also ignore 'sizes' which is safe to pass through
    const { src, alt, fill: _fill, ...rest } = props || {};
    return React.createElement('img', { src, alt, ...rest });
  },
}));

import RecipeView from '@/components/RecipeView';
import { TimerProvider } from '@/contexts/TimerContext';

const fixturesDir = join(__dirname, 'fixtures', 'recipes');
const indexPath = join(fixturesDir, 'index.json');
const resultsDir = join(fixturesDir, 'results');

describe('Self-test over provided URL set: parse API + UI render', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    try { mkdirSync(resultsDir, { recursive: true }); } catch {}

    if (typeof window.matchMedia !== 'function') {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        })),
      });
    }

    if (typeof window.IntersectionObserver !== 'function') {
      class MockIntersectionObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
      }

      Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        value: MockIntersectionObserver,
      });
      Object.defineProperty(window, 'IntersectionObserverEntry', {
        writable: true,
        value: class {},
      });
    }

    if (typeof window.ResizeObserver !== 'function') {
      class MockResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }

      Object.defineProperty(window, 'ResizeObserver', {
        writable: true,
        value: MockResizeObserver,
      });
    }

    // Mock network to serve fixture HTML by URL
    global.fetch = async (url: string | URL | Request) => {
      const index = JSON.parse(readFileSync(indexPath, 'utf8')) as {
        entries: Array<{ url: string; file: string; ok?: boolean }>;
      };
      const urlString = url.toString();
      const entry = index.entries.find(e => e.url === urlString);
      if (entry) {
        const path = join(fixturesDir, entry.file);
        if (entry.ok !== false && existsSync(path)) {
          const html = readFileSync(path, 'utf8');
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

  it('parses and renders UI for successful recipes; records a report', async () => {
    const index = JSON.parse(readFileSync(indexPath, 'utf8')) as {
      generatedAt: string;
      count: number;
      entries: Array<{ url: string; file: string; status: number; ok: boolean; contentType: string; bytes: number }>
    };

    const { GET } = await import('@/app/api/parse/route');

    const results: Array<{
      url: string;
      file: string;
      status: number;
      ok: boolean;
      parserSource?: string | null;
      parserSteps?: number | null;
      title?: string;
      uiRendered?: boolean;
      message?: string;
    }> = [];

    for (let i = 0; i < index.entries.length; i++) {
      const entry = index.entries[i];
      const headers = new Headers({ 'x-forwarded-for': `10.2.${Math.floor(i / 250)}.${(i % 250) + 1}` });
      const req = new Request(`http://localhost:3000/api/parse?url=${encodeURIComponent(entry.url)}`, { headers });
      const res = await GET(req as unknown as NextRequest);

      const parserSource = res.headers.get('X-Parser-Source');
      const parserStepsHeader = res.headers.get('X-Parser-Steps');
      const parserSteps = parserStepsHeader ? Number(parserStepsHeader) : null;

      if (res.status === 200) {
        const data = await res.json();
        // Basic UI render smoke test
        const { unmount } = render(
          <TimerProvider>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <RecipeView recipe={data as any} onBack={() => {}} />
          </TimerProvider>
        );

        // Assert core sections appear (allow duplicates in DOM)
        expect(screen.getByText(data.title)).toBeTruthy();
        expect(screen.getAllByRole('heading', { name: /ingredients/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('heading', { name: /instructions/i }).length).toBeGreaterThan(0);

        results.push({
          url: entry.url,
          file: entry.file,
          status: res.status,
          ok: true,
          parserSource,
          parserSteps,
          title: data.title,
          uiRendered: true,
        });
        // Cleanup render to avoid stray effects between iterations
        unmount();
      } else {
        const body = await res.json();
        results.push({
          url: entry.url,
          file: entry.file,
          status: res.status,
          ok: false,
          parserSource,
          parserSteps,
          message: typeof body?.message === 'string' ? body.message : body?.error || 'unknown_error',
        });
      }
    }

    // Persist report artifacts
    writeFileSync(join(resultsDir, 'selftest-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2) + '\n', 'utf8');

    const lines: string[] = [];
    lines.push(`# Self-test Report`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    const successes = results.filter(r => r.ok).length;
    const failures = results.length - successes;
    lines.push(`- Total: ${results.length}`);
    lines.push(`- Successes: ${successes}`);
    lines.push(`- Failures: ${failures}`);
    lines.push('');
    lines.push('| Result | Source | Steps | Title | URL |');
    lines.push('|---|---|---:|---|---|');
    results.forEach(r => {
      lines.push(`| ${r.ok ? 'success' : 'failure'} | ${r.parserSource || '-'} | ${r.parserSteps ?? 0} | ${(r.title || '').replace(/\|/g, '/')} | ${r.url} |`);
    });
    writeFileSync(join(resultsDir, 'selftest-report.md'), lines.join('\n') + '\n', 'utf8');

    // Ensure at least some successes
    expect(successes).toBeGreaterThanOrEqual(1);
  }, 20000);
});


