export type FirecrawlMode = 'off' | 'fallback' | 'prefer' | 'only';

export interface FirecrawlScrapeOptions {
  /** Optional override for the Firecrawl API base URL */
  baseUrl?: string;
  /** Optional AbortSignal to cancel the request */
  signal?: AbortSignal;
  /** Timeout in milliseconds (defaults to 60s) */
  timeoutMs?: number;
  /** Response formats requested from Firecrawl */
  formats?: Array<'html' | 'markdown' | string>;
}

export interface FirecrawlMetadata {
  title?: string;
  description?: string;
  language?: string;
  keywords?: string | string[];
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  ogLocaleAlternate?: string[];
  ogSiteName?: string;
  sourceURL?: string;
  statusCode?: number;
  [key: string]: unknown;
}

interface FirecrawlSuccessResponse {
  success: true;
  data?: {
    html?: string;
    markdown?: string;
    metadata?: FirecrawlMetadata;
  };
  message?: string;
}

interface FirecrawlErrorResponse {
  success: false;
  error?: string;
  message?: string;
  data?: {
    metadata?: FirecrawlMetadata;
  };
}

export type FirecrawlResponse = FirecrawlSuccessResponse | FirecrawlErrorResponse;

export interface FirecrawlScrapeResult {
  html: string;
  metadata?: FirecrawlMetadata;
  fetchTime: number;
  raw: FirecrawlResponse;
}

export type FirecrawlErrorCode =
  | 'missing_api_key'
  | 'http_error'
  | 'timeout'
  | 'network_error'
  | 'api_error'
  | 'invalid_response';

export class FirecrawlError extends Error {
  readonly code: FirecrawlErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(message: string, code: FirecrawlErrorCode, status?: number, cause?: unknown) {
    super(message);
    this.name = 'FirecrawlError';
    this.code = code;
    this.status = status;
    this.cause = cause;
    if (cause instanceof Error && cause.stack) {
      // Preserve stack trace if available
      this.stack = cause.stack;
    }
  }
}

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_FORMATS: FirecrawlScrapeOptions['formats'] = ['html'];

function getBaseUrl(override?: string): string {
  if (override) {
    return override.replace(/\/$/, '');
  }
  const envBase = process.env.FIRECRAWL_API_BASE_URL || process.env.FIRECRAWL_API_BASE;
  if (envBase) {
    return envBase.replace(/\/$/, '');
  }
  return 'https://api.firecrawl.dev';
}

function createSignal(timeoutMs: number, externalSignal?: AbortSignal): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

export function isFirecrawlEnabled(): boolean {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) {
    return false;
  }
  const disabled = process.env.FIRECRAWL_DISABLED?.toLowerCase();
  return disabled !== '1' && disabled !== 'true';
}

export function getFirecrawlMode(): FirecrawlMode {
  if (!isFirecrawlEnabled()) {
    return 'off';
  }

  const raw = process.env.FIRECRAWL_MODE?.toLowerCase().trim();
  switch (raw) {
    case 'prefer':
      return 'prefer';
    case 'only':
      return 'only';
    case 'off':
      return 'off';
    case 'fallback':
    default:
      return 'fallback';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFirecrawlResponse(raw: unknown): FirecrawlResponse {
  if (!isRecord(raw)) {
    throw new FirecrawlError('Invalid response from Firecrawl', 'invalid_response');
  }

  const base = raw as Record<string, unknown>;
  const success = Boolean(base.success);
  const message = typeof base.message === 'string' ? base.message : undefined;

  if (success) {
    const data = isRecord(base.data) ? (base.data as Record<string, unknown>) : {};
    const html = typeof data.html === 'string' ? data.html : undefined;
    const markdown = typeof data.markdown === 'string' ? data.markdown : undefined;
    const metadata = isRecord(data.metadata) ? (data.metadata as FirecrawlMetadata) : undefined;

    return {
      success: true,
      data: { html, markdown, metadata },
      message,
    };
  }

  const data = isRecord(base.data) ? (base.data as Record<string, unknown>) : undefined;
  const metadata = data && isRecord(data.metadata) ? (data.metadata as FirecrawlMetadata) : undefined;
  const error = typeof base.error === 'string' ? base.error : undefined;

  return {
    success: false,
    error,
    message,
    data: metadata ? { metadata } : undefined,
  };
}

export async function fetchWithFirecrawl(url: string, options: FirecrawlScrapeOptions = {}): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) {
    throw new FirecrawlError('Firecrawl API key is not configured', 'missing_api_key');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { signal, clear } = createSignal(timeoutMs, options.signal);
  const baseUrl = getBaseUrl(options.baseUrl);
  const startTime = Date.now();

  try {
    const response = await fetch(`${baseUrl}/v2/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: options.formats ?? DEFAULT_FORMATS,
      }),
      signal,
    });

    const fetchTime = Date.now() - startTime;

    if (!response.ok) {
      throw new FirecrawlError(
        `Firecrawl request failed with status ${response.status}`,
        response.status === 408 ? 'timeout' : 'http_error',
        response.status,
      );
    }

    const payload = toFirecrawlResponse(await response.json());
    if (!payload.success) {
      const message = payload.error || payload.message || 'Firecrawl reported an error';
      throw new FirecrawlError(message, 'api_error', undefined, payload);
    }

    const html = payload.data?.html;
    if (!html) {
      throw new FirecrawlError('Firecrawl response did not contain HTML content', 'invalid_response');
    }

    return {
      html,
      metadata: payload.data?.metadata,
      fetchTime,
      raw: payload,
    };
  } catch (error) {
    if (error instanceof FirecrawlError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new FirecrawlError('Firecrawl request timed out', 'timeout');
    }

    const message = error instanceof Error ? error.message : 'Unknown error during Firecrawl request';
    throw new FirecrawlError(message, 'network_error', undefined, error instanceof Error ? error : undefined);
  } finally {
    clear();
  }
}
