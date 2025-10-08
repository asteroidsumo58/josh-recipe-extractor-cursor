# Recipe Extractor

Personal Next.js workspace for turning any public recipe URL into a clean set of ingredients, instructions, timers, and scaling controls.

## What You Get
- Structured parsing with fallbacks when JSON-LD is missing
- Ingredient scaling with fraction-friendly output and inline highlighting
- Step-aware timers that survive refreshes and support custom durations
- Basic metrics (parse time, counts, servings) for quick sanity checks

## Quick Start
1. Install dependencies
   ```bash
   npm install
   ```
2. Start the dev server
   ```bash
   npm run dev
   ```
3. Visit [http://localhost:3000](http://localhost:3000) and paste a recipe URL

## Commands
- `npm run lint` – lint the project
- `npm run test:unit` – run the unit test suite
- `npm run test:e2e` – run the end-to-end fixtures against the API
- `npm run test:run` – one-off run of all tests
- `npm run mcp` – start the shadcn MCP server for component management

## Project Notes
- App Router lives under `src/app/`
- Recipe parsing logic is in `src/lib/parsers/`
- Timer state is shared through `src/contexts/TimerContext.tsx`
- HTML fixtures for offline testing sit in `src/test/fixtures/`

## Troubleshooting
- If a URL fails to parse, try the "Print" version of the recipe
- Timers rely on browser audio; confirm the tab has permission to play sound
- Rate limiting defaults to 10 requests per minute. Adjust via env vars in `.env.local` if needed

## License
MIT
