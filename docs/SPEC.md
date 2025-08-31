# MVP Specification

## Core User Flow
1. User enters recipe URL in input field
2. System validates URL and fetches webpage content
3. Parser extracts recipe data using structured data or HTML heuristics
4. Recipe displays with interactive features (scaling, timers, checkboxes)
5. User can adjust servings, start timers, and track cooking progress

## Required Recipe Fields
- **Title**: Recipe name/heading
- **Ingredients**: List with original author units and wording preserved
- **Yield/Servings**: Number of portions the recipe makes
- **Total Time**: Complete cooking duration
- **Steps/Instructions**: Numbered cooking directions
- **Images**: At least one hero image when available

## Parsing Requirements
- **Primary**: JSON-LD structured data (schema.org/Recipe)
- **Secondary**: Microdata/RDFa markup
- **Fallback**: Cheerio HTML selectors with common patterns
- **Error Handling**: Graceful degradation with user-friendly messages
- **Logging**: Console output showing parse source, timing, and fallbacks

## UI/UX Behaviors

### Input & Loading
- Single URL input field with "Extract" button
- Loading spinner with parsing stage indicators
- Error messages with retry options and manual paste fallback

### Recipe Display
- Responsive layout (desktop + mobile)
- Hero image with Next.js optimization
- Recipe metadata cards (time, servings, etc.)
- Ingredient list with interactive checkboxes
- Step-by-step instructions with completion tracking

### Scaling System
- Servings control with +/- buttons and quick presets
- Custom serving input (1-50 range)
- Real-time quantity updates in ingredients and steps
- Visual indicators when recipe is scaled
- Smart fraction formatting (1.5 → "1 1/2")

### Timer Features
- Auto-detected timers from step durations
- "Start timer" buttons next to relevant steps
- Three manual timers with custom labels
- Audio alerts and browser notifications
- Visual progress bars and countdown displays

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Sufficient color contrast ratios
- Large touch targets for mobile use
- Focus management for interactive elements

## Technical Requirements

### Performance
- Server-side parsing to avoid CORS
- Image optimization via Next.js
- LRU cache with 24h TTL
- Rate limiting (10 requests/minute per IP)

### Error Handling
- Network timeout protection (30s)
- Invalid URL validation
- HTTP error responses (403, 404, etc.)
- Malformed HTML graceful handling
- SSRF protection against local addresses

### Data Validation
- Zod schemas for runtime type checking
- Sanitized HTML content rendering
- URL format validation
- Quantity parsing with error recovery

## Acceptance Criteria

### Test URLs (must work)
1. **AllRecipes**: https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/
2. **Food Network**: https://www.foodnetwork.com/recipes/food-network-kitchen/extra-creamy-cacio-e-uova-with-grated-egg-12646498
3. **Downshiftology**: https://downshiftology.com/recipes/mediterranean-ground-beef-stir-fry/

### Success Criteria (per URL)
- [x] All core recipe fields extracted and displayed
- [x] Ingredient quantities appear inline within cooking steps
- [x] Auto-detected timers appear for steps with durations
- [x] Servings scaling updates both ingredient list and inline quantities
- [x] Recipe loads within 3 seconds on average
- [x] Mobile layout remains usable on phones and tablets
- [x] Dark mode toggle works correctly
- [x] Error states provide helpful user guidance
