# Key Decisions & Constraints

## Architecture Choices
- [x] Next.js App Router (not Pages Router) for modern React patterns
- [x] Server-side parsing via API routes to avoid CORS issues
- [x] TypeScript throughout for type safety and developer experience
- [x] Tailwind CSS v4 for styling with automatic dark mode
- [x] Modular parser architecture for maintainability

## Parsing Strategy
- [x] JSON-LD structured data as primary parsing method
- [x] Microdata/RDFa as secondary fallback
- [x] Cheerio HTML heuristics as final fallback
- [x] No site-specific adapters (generic parsing only)
- [x] Fuzzy ingredient matching for inline step quantities
- [x] Console logging only (no external analytics)

## Security & Ethics
- [x] Respect robots.txt and site terms of service
- [x] SSRF protection against localhost/private IP access
- [x] Polite User-Agent string identification
- [x] Rate limiting per IP address
- [x] No paywall bypass attempts
- [x] No proxy/scraping workarounds

## Feature Scope (MVP)
- [x] Core recipe fields: title, ingredients, yield, time, steps, images
- [x] Ingredient checkboxes and step completion tracking
- [x] Recipe scaling with intelligent quantity adjustment
- [x] Auto-detected timers from cooking steps
- [x] Three configurable manual timers
- [x] Mobile-responsive design for kitchen use
- [x] Dark mode support

## Non-Goals (Deferred)
- [ ] Recipe export/save functionality (future feature)
- [ ] User accounts or persistent storage
- [ ] Social sharing features
- [ ] Recipe collections or favorites
- [ ] Nutritional information parsing
- [ ] Shopping list generation
- [ ] Meal planning features

## Technical Constraints
- [x] In-memory caching only (no external cache)
- [x] 24-hour cache TTL for parsed recipes
- [x] 1-50 servings scaling range limit
- [x] Client-side state management (no global state library)
- [x] Vercel deployment target
- [x] No external APIs beyond recipe site fetching

## Testing Strategy
- [x] Vitest for unit testing with 60+ comprehensive test cases
- [x] HTML fixtures to avoid network calls in tests
- [x] E2E API integration tests with mocked HTML responses
- [x] Test coverage for parsing, scaling, and ingredient logic
- [x] GitHub Actions CI/CD with multi-Node.js version testing
- [x] Coverage thresholds set to 70% across all metrics

## Accessibility & UX
- [x] WCAG 2.1 AA compliance with full ARIA support
- [x] Semantic HTML with proper landmarks and roles
- [x] Keyboard navigation and focus management
- [x] Screen reader support with live regions
- [x] Comprehensive error messages with actionable guidance
- [x] Mobile-first responsive design with large tap targets

## Performance Optimizations
- [x] React.memo for expensive components (RecipeView, ServingsControl)
- [x] useCallback for event handlers to prevent re-renders
- [x] Next.js automatic code splitting and image optimization
- [x] LRU caching with 24h TTL for recipe data
- [x] Rate limiting (10 requests/minute) for service stability
