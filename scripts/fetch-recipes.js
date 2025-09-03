#!/usr/bin/env node

// Lightweight fixture fetcher for recipe pages
// Saves HTML snapshots for offline, deterministic tests

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const URLS_ARG = process.argv[2];
const URLS_PATH = URLS_ARG ? path.resolve(process.cwd(), URLS_ARG) : path.resolve(__dirname, 'recipes-urls.json');
const OUT_DIR = path.resolve(ROOT, 'src', 'test', 'fixtures', 'recipes');
const INDEX_PATH = path.join(OUT_DIR, 'index.json');

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

/**
 * Fetch with timeout and helpful headers
 * @param {string} url
 */
async function fetchHtml(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30000);
	try {
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'User-Agent': 'Recipe-Extractor/1.0 (+https://github.com/recipe-extractor) Mozilla/5.0',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				'DNT': '1',
				'Connection': 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
			},
			signal: controller.signal,
		});
		const contentType = res.headers.get('content-type') || '';
		const html = await res.text();
		return { status: res.status, ok: res.ok, contentType, html };
	} finally {
		clearTimeout(timeout);
	}
}

async function main() {
	await ensureDir(OUT_DIR);
	const urls = await readJson(URLS_PATH);

	/** @type {Array<{url:string, file:string, status:number, ok:boolean, contentType:string, bytes:number}>} */
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
				const { status, ok, contentType, html } = await fetchHtml(url);
				await fsp.writeFile(outPath, html, 'utf8');
				indexEntries.push({ url, file: filename, status, ok, contentType, bytes: Buffer.byteLength(html) });
				console.log(`${ok ? '✅' : '⚠️'} [${status}] ${url} -> ${filename} (${html.length} chars)`);
			} catch (err) {
				const msg = err && typeof err === 'object' && 'message' in err ? err.message : String(err);
				indexEntries.push({ url, file: filename, status: 0, ok: false, contentType: '', bytes: 0 });
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
