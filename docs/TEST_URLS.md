# Canonical Test URLs

These URLs are used for development, testing, and acceptance criteria validation.

## Primary Test Cases

### 1. AllRecipes - Easy Mexican Casserole
**URL**: https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/
- **Expected Parsing**: JSON-LD structured data
- **Servings**: 6 servings
- **Key Features**: Ground beef, salsa, cheese layers
- **Test Focus**: Basic parsing, ingredient scaling, timer detection
- **Status**: ✅ Working (JSON-LD extraction successful)

### 2. Food Network - Cacio e Uova
**URL**: https://www.foodnetwork.com/recipes/food-network-kitchen/extra-creamy-cacio-e-uova-with-grated-egg-12646498
- **Expected Parsing**: JSON-LD or HTML heuristics
- **Servings**: 4-6 servings
- **Key Features**: Pasta dish with eggs and cheese
- **Test Focus**: Complex ingredient parsing, cooking techniques
- **Status**: ⚠️ Blocked (HTTP 403 - anti-bot protection)

### 3. Downshiftology - Mediterranean Stir Fry
**URL**: https://downshiftology.com/recipes/mediterranean-ground-beef-stir-fry/
- **Expected Parsing**: JSON-LD structured data
- **Servings**: 4 servings
- **Key Features**: Ground beef, vegetables, Mediterranean flavors
- **Test Focus**: Ingredient variety, cooking times, scaling
- **Status**: ✅ Working (JSON-LD extraction successful)

## Testing Scenarios

### Parsing Validation
- [ ] Recipe title extracted correctly
- [ ] All ingredients with quantities preserved
- [ ] Cooking instructions in proper order
- [ ] Total time and servings displayed
- [ ] Hero image loads and displays
- [ ] Parse source logged to console

### Scaling Functionality
- [ ] Ingredient quantities scale proportionally
- [ ] Inline step quantities update correctly
- [ ] Fraction formatting works (1.5 → "1 1/2")
- [ ] Range scaling maintains format ("2-3" → "4-6")
- [ ] Visual indicators show scaling status

### Timer Features
- [ ] Auto-detected timers appear for cooking steps
- [ ] Manual timers can be created and labeled
- [ ] Audio alerts work on timer completion
- [ ] Multiple timers run simultaneously
- [ ] Timer progress displays correctly

### UI/UX Testing
- [ ] Mobile responsive layout works
- [ ] Dark mode toggle functions
- [ ] Ingredient checkboxes track completion
- [ ] Step completion tracking works
- [ ] Error states display helpful messages
- [ ] Loading states show parsing progress

## Fallback Test Cases

### HTML Heuristics Testing
For sites that block automated requests or lack structured data:
- Create local HTML fixtures from these URLs
- Test parsing without network requests
- Validate fallback selector accuracy
- Ensure graceful degradation

### Error Handling
- Invalid URLs (malformed, non-existent)
- Network timeouts and connection errors
- Sites with no recipe content
- Paywalled or restricted content
- Malformed HTML or missing data

## Performance Benchmarks
- **Parse Time**: < 2 seconds average
- **Cache Hit**: < 100ms response
- **Image Load**: Progressive loading with fallbacks
- **Mobile Performance**: Usable on 3G connections
