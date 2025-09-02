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
- [x] **Step 9**: Add LRU cache and rate limiting with console logging
- [x] **Step 10**: Create HTML fixtures and unit/e2e tests for parsing and UI
- [x] **Step 11**: Add accessibility, error handling, dark mode polish, and README
- [x] **Step 12**: Deploy to Vercel and fix production issues
- [x] **Step 13**: Add 50+ recipe snapshots and batch E2E tests
- [x] **Step 14**: Add automated audit (JSON/Markdown) and one-command pipeline
- [x] **Step 15**: Improve ingredient name extraction and inline reference matching
- [x] **Step 16**: Adjustable custom timers (HH:MM:SS) and ~10s completion alert

## Top Priority 🔥
1. **Fix remaining runtime issues** - Address any remaining edge cases in recipe parsing
2. **Add ingredient parser fallback** - Handle cases where library parsing fails
3. **Improve timer audio compatibility** - Cross-browser audio notification support
4. **Add loading states** - Better UX for slow recipe parsing operations
5. **Optimize image handling** - Loading states and fallback for broken images
6. **HTML heuristics** - Improve fallback selectors for sites without structured data
7. **Timer UX** - Optional presets (45/50/60) and per-timer mute

## Future Enhancements 💡
- [ ] Manual recipe entry for sites without structured data
- [ ] Recipe export functionality (PDF, text, etc.)
- [ ] Nutritional information parsing and display
- [ ] Shopping list generation from ingredients
- [ ] Recipe collections and favorites system
- [ ] Social sharing capabilities
- [ ] Meal planning integration
- [ ] Voice control for hands-free cooking
- [ ] Recipe rating and review system
- [ ] Ingredient substitution suggestions

## Implementation Tasks (Step 9) ✅
- [x] Create LRU cache utility with 24h TTL
- [x] Add cache integration to API route
- [x] Implement per-IP rate limiting middleware
- [x] Add cache hit/miss console logging
- [x] Test cache behavior with repeated requests

## Implementation Tasks (Step 10) ✅
- [x] Save HTML fixtures for 3 test URLs (no network in tests)
- [x] Unit tests for JSON-LD extraction logic
- [x] Unit tests for HTML heuristics parsing
- [x] Unit tests for ingredient parsing and scaling
- [x] Unit tests for scaling math and fraction formatting
- [x] One E2E test with local HTML fixture
- [x] Configure test scripts and CI setup

## Implementation Tasks (Step 11) ✅
- [x] Audit and improve accessibility (ARIA, keyboard nav, contrast)
- [x] Polish error messages and user guidance
- [x] Dark mode visual consistency check
- [x] Create comprehensive README with setup/deployment instructions
- [x] Add performance optimizations
- [x] Final testing with all canonical URLs

## Implementation Tasks (Step 12) ✅
- [x] Deploy to Vercel platform
- [x] Fix TypeScript compilation errors (Zod, arithmetic operations, webkitAudioContext)
- [x] Fix client-side import conflicts (separate API types)
- [x] Add ErrorBoundary for runtime error handling
- [x] Fix regex escaping for ingredient names with special characters
- [x] Successfully deploy live application
- [x] Test recipe extraction with real URLs

## Theme Implementation ✅
- [x] **Theme System**: Implemented comprehensive dark/light mode toggle
- [x] **Dark Mode Default**: Set dark mode as the default theme for new users
- [x] **Theme Context**: Created React Context API for global theme state management
- [x] **Theme Toggle Component**: Built smooth animated toggle with sun/moon icons
- [x] **CSS Custom Properties**: Comprehensive theme variables for both light and dark modes
- [x] **Hydration Fix**: Resolved Next.js hydration mismatch issues with suppressHydrationWarning
- [x] **Theme Persistence**: localStorage integration for theme preference persistence
- [x] **Debug System**: Comprehensive debugging tools with ThemeDebugPanel for development
- [x] **Accessibility**: Proper ARIA labels and keyboard navigation support
- [x] **Error Handling**: Robust error logging and fallback mechanisms

## Recent UI Polish (Mar 2025) ✅
- [x] Updated "Extract Recipe" button: darker blue, white text; remains blue when disabled
- [x] Heading styles explorer added and finalized (Warm gradient kept)
- [x] Background texture: subtle dotted pattern with staggered rows; theme-aware (white in dark, black in light)
- [x] Removed CSS Debug Panel from UI (kept console diagnostics)
- [x] Inline step timers with circular countdown; widened left pane and fixed overflow
- [x] Consolidated theme toggle to global header (removed duplicate in RecipeView)
- [x] Improved inline ingredient matching (salt/pepper normalization, vulgar fractions support)

## Production Ready ✅
**Recipe Extractor v1.2** - Fully functional and deployed with comprehensive features:
- ✅ Smart recipe parsing (JSON-LD, Microdata, HTML heuristics)
- ✅ Dynamic recipe scaling with intelligent quantity adjustment
- ✅ Built-in kitchen timers with auto-detection
- ✅ Progress tracking (ingredient/step checkboxes)
- ✅ **Dark/Light Mode Toggle** with smooth transitions and persistence
- ✅ Mobile-optimized responsive design
- ✅ Full accessibility compliance (WCAG 2.1 AA)
- ✅ Comprehensive test suite (62+ tests, 70% coverage)
- ✅ Performance optimizations (caching, memoization)
- ✅ Professional documentation and deployment guides
- ✅ **LIVE DEPLOYMENT** - Successfully deployed to Vercel
- ✅ Production error handling and runtime safety
