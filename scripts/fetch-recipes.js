#!/usr/bin/env node

// Lightweight fixture fetcher for recipe pages
// Saves HTML snapshots for offline, deterministic tests

const fsp = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
const URLS_ARG = ARGS.find((arg) => !arg.startsWith('--'));
const URLS_PATH = URLS_ARG ? path.resolve(process.cwd(), URLS_ARG) : path.resolve(__dirname, 'recipes-urls.json');
const OUT_DIR = path.resolve(ROOT, 'src', 'test', 'fixtures', 'recipes');
const INDEX_PATH = path.join(OUT_DIR, 'index.json');

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY ? process.env.FIRECRAWL_API_KEY.trim() : '';
const FIRECRAWL_DISABLED = (process.env.FIRECRAWL_DISABLED || '').toLowerCase();
const FIRECRAWL_MODE = (process.env.FIRECRAWL_MODE || 'fallback').toLowerCase();
const FIRECRAWL_BASE_URL = (process.env.FIRECRAWL_API_BASE_URL || process.env.FIRECRAWL_API_BASE || 'https://api.firecrawl.dev').replace(/\/$/, '');
const FIRECRAWL_ENABLED = Boolean(FIRECRAWL_API_KEY) && FIRECRAWL_DISABLED !== '1' && FIRECRAWL_DISABLED !== 'true';
const FIRECRAWL_TIMEOUT_MS = Number.parseInt(process.env.FIRECRAWL_TIMEOUT_MS || '90000', 10) || 90000;

/** @param {string} input */
function sanitizeFilename(input) {
  // Keep domain and significant parts, replace non-safe chars
  try {
    const u = new URL(input);
    const domain = u.hostname.replace(/^www\./, '');
    const slug = (u.pathname || '/').replace(/\/+$/, '').replace(/^\/+/, '').replace(/\//g, '_');
    const base = [domain, slug || 'root'].join('__');
    return base.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 180) + '.html';
  } catch {
    return input.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 180) + '.html';
  }
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function readJson(p) {
  const raw = await fsp.readFile(p, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(p, data) {
  await fsp.writeFile(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeoutId),
  };
}

async function fetchDirect(url) {
  const { signal, cancel } = createTimeoutSignal(30_000);
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
      signal,
    });

    const fetchTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('URL does not return HTML content');
    }

    const html = await response.text();
    return { html, fetchTime, status: response.status, contentType, source: 'direct' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - the website took too long to respond');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error - unable to connect to the website');
      }
      throw error;
    }

    throw new Error('Unknown error occurred while fetching the webpage');
  } finally {
    cancel();
  }
}

async function fetchWithFirecrawl(url) {
  if (!FIRECRAWL_ENABLED) {
    throw new Error('Firecrawl is not configured');
  }

  const { signal, cancel } = createTimeoutSignal(FIRECRAWL_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/v2/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ['html'],
      }),
      signal,
    });

    const fetchTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Firecrawl HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || payload.success === false) {
      const msg = (payload && (payload.error || payload.message)) || 'Firecrawl request failed';
      throw new Error(msg);
    }

    const html = payload?.data?.html;
    if (!html) {
      throw new Error('Firecrawl response missing HTML content');
    }

    return {
      html,
      fetchTime,
      status: payload?.data?.metadata?.statusCode || 200,
      contentType: 'text/html (firecrawl)',
      source: 'firecrawl',
      metadata: payload?.data?.metadata || null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Firecrawl request timed out');
    }
    throw error;
  } finally {
    cancel();
  }
}

function resolveFetchOrder() {
  if (!FIRECRAWL_ENABLED) {
    return ['direct'];
  }

  switch (FIRECRAWL_MODE) {
    case 'only':
      return ['firecrawl'];
    case 'prefer':
      return ['firecrawl', 'direct'];
    case 'off':
      return ['direct'];
    case 'fallback':
    default:
      return ['direct', 'firecrawl'];
  }
}

async function fetchHtml(url) {
  const attempts = resolveFetchOrder();
  const errors = [];

  for (const attempt of attempts) {
    try {
      if (attempt === 'firecrawl') {
        const result = await fetchWithFirecrawl(url);
        console.log(`🔥 [${result.status}] ${url} via firecrawl (${result.html.length} chars)`);
        return result;
      }

      const result = await fetchDirect(url);
      console.log(`✅ [${result.status}] ${url} via direct (${result.html.length} chars)`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ ${attempt} fetch failed for ${url}: ${message}`);
      errors.push(`${attempt}: ${message}`);
    }
  }

  const detail = errors.join('; ');
  throw new Error(detail ? `All fetch attempts failed (${detail})` : 'Unable to fetch webpage');
}

async function main() {
  await ensureDir(OUT_DIR);
  const urls = await readJson(URLS_PATH);

  /** @type {Array<{url:string, file:string, status:number, ok:boolean, contentType:string, bytes:number, fetchSource?:string, firecrawl?:{statusCode?:number|null, sourceURL?:string|null}}>} */
  const indexEntries = [];

  const concurrency = 5;
  let active = 0;
  let i = 0;

  async function worker() {
    while (i < urls.length) {
      const myIndex = i++;
      const url = urls[myIndex];
      active++;
      const filename = sanitizeFilename(url);
      const outPath = path.join(OUT_DIR, filename);
      try {
        const { html, status, contentType, source, metadata } = await fetchHtml(url);
        await fsp.writeFile(outPath, html, 'utf8');
        const entry = {
          url,
          file: filename,
          status,
          ok: true,
          contentType,
          bytes: Buffer.byteLength(html),
          fetchSource: source,
        };
        if (source === 'firecrawl' && metadata) {
          entry.firecrawl = {
            statusCode: metadata.statusCode ?? null,
            sourceURL: metadata.sourceURL ?? null,
          };
        }
        indexEntries.push(entry);
      } catch (err) {
        const msg = err && typeof err === 'object' && 'message' in err ? err.message : String(err);
        indexEntries.push({ url, file: filename, status: 0, ok: false, contentType: '', bytes: 0, fetchSource: 'error', error: msg });
        console.warn(`❌ [ERR] ${url} -> ${filename}: ${msg}`);
      }
      active--;
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  await writeJson(INDEX_PATH, { generatedAt: new Date().toISOString(), count: indexEntries.length, entries: indexEntries });
  console.log(`\nWrote index: ${INDEX_PATH} (${indexEntries.length} entries)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
