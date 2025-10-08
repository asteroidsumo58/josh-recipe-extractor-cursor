# Firecrawl MCP Integration Guide

This project now integrates the [Firecrawl MCP server](https://github.com/firecrawl/firecrawl-mcp-server) and REST API to improve recipe scraping reliability. Firecrawl executes JavaScript, retries on transient failures, and returns rich metadata that we surface through the API and fixture tooling. Refer to the upstream documentation for detailed capabilities and request options:

- Firecrawl product overview and REST API reference: <https://github.com/firecrawl/firecrawl>
- Firecrawl MCP server quick start (npx invocation, Cursor configuration, HTTP streaming mode): <https://github.com/firecrawl/firecrawl-mcp-server>

## Environment Variables

Add the following to your `.env.local` (or deployment environment) to enable Firecrawl:

| Variable | Description |
| --- | --- |
| `FIRECRAWL_API_KEY` | **Required.** Firecrawl API key (e.g. `fc-...`). |
| `FIRECRAWL_MODE` | Optional. One of `fallback` (default), `prefer`, or `only`. Controls whether Firecrawl runs after a direct fetch fails, before direct fetches, or exclusively. |
| `FIRECRAWL_DISABLED` | Optional flag (`true`/`1`) to disable Firecrawl without clearing the API key. |
| `FIRECRAWL_API_BASE_URL` | Optional override for the Firecrawl API origin (useful when self-hosting). |
| `FIRECRAWL_TIMEOUT_MS` | Optional timeout override (milliseconds) for the MCP-powered fixture fetcher. |

When `FIRECRAWL_API_KEY` is not present or `FIRECRAWL_DISABLED` is set, the application gracefully falls back to the legacy direct HTTP scraper.

## API Route Behaviour

The `/api/parse` route automatically negotiates between direct HTTP fetching and Firecrawl:

1. The fetch order is derived from `FIRECRAWL_MODE` (`fallback`, `prefer`, `only`).
2. Firecrawl responses include metadata (status code, canonical URL) that is surfaced via response headers (`X-Fetch-Source`, `X-Firecrawl-Status`).
3. Failures from one strategy transparently fall back to the other, and the final error message aggregates all failures.

Responses served from cache emit `X-Fetch-Source: cache`.

## Fixture Fetcher (`scripts/fetch-recipes.js`)

The fixture pipeline now shares the same Firecrawl logic:

- Fetch order mirrors the API route, respecting `FIRECRAWL_MODE` and `FIRECRAWL_TIMEOUT_MS`.
- Firecrawl metadata (status code, canonical source URL) is persisted alongside each fixture entry for auditing.
- Console logging clearly distinguishes direct vs. Firecrawl fetches, and aggregates errors when both strategies fail.

Run the fetcher with:

```bash
FIRECRAWL_API_KEY=fc-your-key FIRECRAWL_MODE=fallback node ./scripts/fetch-recipes.js
```

## Testing

Unit tests under `src/test/firecrawl.test.ts` mock the Firecrawl MCP endpoint to verify configuration helpers, error propagation, and success paths. Run the full suite with:

```bash
npm test
```

## MCP Client Usage

To experiment interactively with Firecrawl via MCP-aware editors (Cursor, Windsurf, etc.), follow the upstream [firecrawl-mcp-server quick start](https://github.com/firecrawl/firecrawl-mcp-server#running-with-npx). Example Cursor configuration:

```json
{
  "mcpServers": {
    "firecrawl-mcp": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-your-api-key"
      }
    }
  }
}
```

Restart your MCP client after updating the configuration.
