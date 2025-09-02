import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import type { ParsedRecipe } from '@/types/api';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const fixturesDir = join(__dirname, 'fixtures', 'recipes');
const indexPath = join(fixturesDir, 'index.json');
const resultsDir = join(fixturesDir, 'results');

const index = JSON.parse(readFileSync(indexPath, 'utf8')) as {
  generatedAt: string;
  count: number;
  entries: Array<{ url: string; file: string; status: number; ok: boolean; contentType: string; bytes: number }>;
};

function ensureDir(path: string) {
  try {
    mkdirSync(path, { recursive: true });
  } catch {}
}

describe('Automated audit for recipe parsing across snapshots', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    ensureDir(resultsDir);

    global.fetch = async (url: string | URL | Request) => {
      const urlString = url.toString();
      const entry = index.entries.find(e => e.url === urlString);
      if (entry) {
        const html = readFileSync(join(fixturesDir, entry.file), 'utf8');
        return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
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

  it('generates JSON and Markdown reports for all snapshots', async () => {
    const { GET } = await import('@/app/api/parse/route');

    const perRecipe: Array<{
      url: string;
      domain: string;
      file: string;
      status: number;
      ok: boolean;
      result: 'success' | 'failure';
      source?: string;
      title?: string;
      ingredientCount?: number;
      instructionCount?: number;
      hasImages?: boolean;
      hasTimers?: boolean;
      hasInlineIngredientRefs?: boolean;
      message?: string;
    }> = [];

    for (let i = 0; i < index.entries.length; i++) {
      const entry = index.entries[i];
      const headers = new Headers({ 'x-forwarded-for': `10.1.${Math.floor(i / 250)}.${(i % 250) + 1}` });
      const req = new Request(`http://localhost:3000/api/parse?url=${encodeURIComponent(entry.url)}`, { headers });
      const res = await GET(req as unknown as NextRequest);
      const body = await res.json();

      if (res.status === 200) {
        const data = body as ParsedRecipe;
        const hasTimers = (data.instructions || []).some(s => Boolean(s.duration));
        const hasInline = (data.instructions || []).some(s => Array.isArray(s.ingredients) && s.ingredients.length > 0);

        perRecipe.push({
          url: data.url,
          domain: data.domain,
          file: entry.file,
          status: res.status,
          ok: true,
          result: 'success',
          source: data.source,
          title: data.title,
          ingredientCount: data.ingredients.length,
          instructionCount: data.instructions.length,
          hasImages: Array.isArray(data.images) && data.images.length > 0,
          hasTimers,
          hasInlineIngredientRefs: hasInline,
        });

        // Write per-recipe JSON
        const outPath = join(resultsDir, `${entry.file.replace(/\.html$/, '')}.json`);
        writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      } else {
        perRecipe.push({
          url: entry.url,
          domain: new URL(entry.url).hostname.replace(/^www\./, ''),
          file: entry.file,
          status: res.status,
          ok: false,
          result: 'failure',
          message: typeof body?.message === 'string' ? body.message : body?.error || 'unknown_error',
        });
      }
    }

    // Aggregate stats
    const totals = {
      total: perRecipe.length,
      successes: perRecipe.filter(r => r.result === 'success').length,
      failures: perRecipe.filter(r => r.result === 'failure').length,
      bySource: perRecipe
        .filter(r => r.result === 'success')
        .reduce<Record<string, number>>((acc, r) => {
          const key = r.source || 'unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
      byDomain: perRecipe.reduce<Record<string, { success: number; fail: number }>>((acc, r) => {
        const key = r.domain;
        if (!acc[key]) acc[key] = { success: 0, fail: 0 };
        if (r.result === 'success') acc[key].success++;
        else acc[key].fail++;
        return acc;
      }, {}),
      featureCoverage: {
        hasImages: perRecipe.filter(r => r.result === 'success' && r.hasImages).length,
        hasTimers: perRecipe.filter(r => r.result === 'success' && r.hasTimers).length,
        hasInlineIngredientRefs: perRecipe.filter(r => r.result === 'success' && r.hasInlineIngredientRefs).length,
      },
    };

    // Write reports
    const reportJson = { generatedAt: new Date().toISOString(), totals, results: perRecipe };
    writeFileSync(join(fixturesDir, 'report.json'), JSON.stringify(reportJson, null, 2) + '\n', 'utf8');

    // Markdown summary
    const lines: string[] = [];
    lines.push(`# Recipe Parsing Audit`);
    lines.push(`Generated: ${reportJson.generatedAt}`);
    lines.push('');
    lines.push(`- Total: ${totals.total}`);
    lines.push(`- Successes: ${totals.successes}`);
    lines.push(`- Failures: ${totals.failures}`);
    lines.push(`- Source breakdown: ${Object.entries(totals.bySource).map(([k, v]) => `${k}:${v}`).join(', ') || 'none'}`);
    lines.push(`- Feature coverage: images=${totals.featureCoverage.hasImages}, timers=${totals.featureCoverage.hasTimers}, inlineRefs=${totals.featureCoverage.hasInlineIngredientRefs}`);
    lines.push('');
    lines.push(`## By Domain`);
    Object.entries(totals.byDomain)
      .sort((a, b) => (b[1].success + b[1].fail) - (a[1].success + a[1].fail))
      .forEach(([domain, stats]) => {
        lines.push(`- ${domain}: success=${stats.success}, fail=${stats.fail}`);
      });
    lines.push('');
    lines.push(`## Results`);
    lines.push('| Result | Source | Domain | Title | Ingredients | Instructions | Images | Timers | InlineRefs | URL |');
    lines.push('|---|---|---|---|---:|---:|---:|---:|---:|---|');
    perRecipe.forEach(r => {
      const row = [
        r.result,
        r.source || '-',
        r.domain,
        (r.title || '').replace(/\|/g, '/'),
        r.ingredientCount ?? 0,
        r.instructionCount ?? 0,
        r.hasImages ? 1 : 0,
        r.hasTimers ? 1 : 0,
        r.hasInlineIngredientRefs ? 1 : 0,
        r.url
      ];
      lines.push(`| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} | ${row[5]} | ${row[6]} | ${row[7]} | ${row[8]} | ${row[9]} |`);
    });

    writeFileSync(join(fixturesDir, 'report.md'), lines.join('\n') + '\n', 'utf8');

    // Basic assertions so CI fails if everything fails
    expect(totals.successes).toBeGreaterThan(0);
  });
});
