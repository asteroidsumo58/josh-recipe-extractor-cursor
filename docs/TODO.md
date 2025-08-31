# TODO List

## Completed ✅
- [x] **Step 1**: Scaffold Next.js + TS app with Tailwind, ESLint/Prettier, dark mode, and landing page
- [x] **Step 2**: Implement /api/parse route with server-side fetch and URL validation
- [x] **Step 3**: Extract JSON-LD and microdata parsing with Recipe type normalization
- [x] **Step 4**: Add Cheerio-based HTML parsing fallbacks with robust cleanup
- [x] **Step 5**: Implement ingredient parser and fuzzy matching for inline step quantities
- [x] **Step 6**: Build RecipeForm, Loader, Error, and RecipeView components with responsive layout
- [x] **Step 7**: Add auto-detected and manual timers with duration parsing
- [x] **Step 8**: Implement servings control with ingredient and step quantity scaling

## In Progress 🚧
- [ ] **Step 9**: Add LRU cache and rate limiting with console logging

## Pending 📋
- [ ] **Step 10**: Create HTML fixtures and unit/e2e tests for parsing and UI
- [ ] **Step 11**: Add accessibility, error handling, dark mode polish, and README

## Implementation Tasks (Step 9)
- [ ] Create LRU cache utility with 24h TTL
- [ ] Add cache integration to API route
- [ ] Implement per-IP rate limiting middleware
- [ ] Add cache hit/miss console logging
- [ ] Test cache behavior with repeated requests

## Implementation Tasks (Step 10)
- [ ] Save HTML fixtures for 3 test URLs (no network in tests)
- [ ] Unit tests for JSON-LD extraction logic
- [ ] Unit tests for HTML heuristics parsing
- [ ] Unit tests for ingredient parsing and scaling
- [ ] Unit tests for scaling math and fraction formatting
- [ ] One E2E test with local HTML fixture
- [ ] Configure test scripts and CI setup

## Implementation Tasks (Step 11)
- [ ] Audit and improve accessibility (ARIA, keyboard nav, contrast)
- [ ] Polish error messages and user guidance
- [ ] Dark mode visual consistency check
- [ ] Create comprehensive README with setup/deployment instructions
- [ ] Add performance optimizations
- [ ] Final testing with all canonical URLs

## Bug Fixes & Improvements
- [ ] Fix Zod error handling in API route (parseResult.error.errors access)
- [ ] Add ingredient parser fallback for failed library parsing
- [ ] Improve timer audio compatibility across browsers
- [ ] Add loading states for slow recipe parsing
- [ ] Optimize image loading and fallback handling
