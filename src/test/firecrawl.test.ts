import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithFirecrawl, FirecrawlError, getFirecrawlMode, isFirecrawlEnabled } from '@/lib/firecrawl';

const ENV_KEYS = [
  'FIRECRAWL_API_KEY',
  'FIRECRAWL_MODE',
  'FIRECRAWL_DISABLED',
  'FIRECRAWL_API_BASE_URL',
  'FIRECRAWL_API_BASE',
];

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

beforeEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
  vi.unstubAllGlobals();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
  vi.unstubAllGlobals();
});

describe('Firecrawl configuration helpers', () => {
  it('detects when Firecrawl is disabled without an API key', () => {
    delete process.env.FIRECRAWL_API_KEY;
    expect(isFirecrawlEnabled()).toBe(false);
    expect(getFirecrawlMode()).toBe('off');
  });

  it('defaults to fallback mode when a key is present', () => {
    process.env.FIRECRAWL_API_KEY = 'test-key';
    delete process.env.FIRECRAWL_MODE;
    expect(isFirecrawlEnabled()).toBe(true);
    expect(getFirecrawlMode()).toBe('fallback');
  });

  it('honors prefer and only modes', () => {
    process.env.FIRECRAWL_API_KEY = 'test-key';

    process.env.FIRECRAWL_MODE = 'prefer';
    expect(getFirecrawlMode()).toBe('prefer');

    process.env.FIRECRAWL_MODE = 'only';
    expect(getFirecrawlMode()).toBe('only');
  });

  it('disables Firecrawl when explicitly turned off', () => {
    process.env.FIRECRAWL_API_KEY = 'test-key';
    process.env.FIRECRAWL_DISABLED = 'true';
    expect(isFirecrawlEnabled()).toBe(false);
    expect(getFirecrawlMode()).toBe('off');
  });
});

describe('fetchWithFirecrawl', () => {
  it('throws when the API key is missing', async () => {
    delete process.env.FIRECRAWL_API_KEY;
    await expect(fetchWithFirecrawl('https://example.com')).rejects.toBeInstanceOf(FirecrawlError);
  });

  it('returns HTML content on success', async () => {
    process.env.FIRECRAWL_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          html: '<html><body>hi</body></html>',
          metadata: { statusCode: 200 },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const result = await fetchWithFirecrawl('https://example.com');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.firecrawl.dev/v2/scrape',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.html).toContain('hi');
    expect(result.metadata?.statusCode).toBe(200);
    expect(result.fetchTime).toBeGreaterThanOrEqual(0);
  });

  it('surfaces HTTP errors from the Firecrawl API', async () => {
    process.env.FIRECRAWL_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ message: 'rate limited' }),
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    await expect(fetchWithFirecrawl('https://example.com')).rejects.toMatchObject({
      code: 'http_error',
      status: 429,
    });
  });
});
