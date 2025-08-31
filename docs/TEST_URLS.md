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

### 4. RecipeTin Eats - Garlic Sautéed Green Beans ⭐ **PRODUCTION TESTED**
**URL**: https://www.recipetineats.com/garlic-sauteed-green-beans/
- **Expected Parsing**: JSON-LD structured data
- **Servings**: 2 servings
- **Key Features**: Green beans, garlic, simple side dish
- **Test Focus**: **Production deployment validation, runtime error handling**
- **Status**: ✅ **PRODUCTION WORKING** (Successfully tested on live Vercel deployment)
- **Notes**: This URL was used to validate the production deployment and identify/fix runtime issues

## Production Deployment Testing ✅

### Live Application Validation
- **✅ Deployment Success**: Successfully deployed to Vercel
- **✅ Runtime Error Handling**: ErrorBoundary catches and displays client-side errors
- **✅ Type Safety**: All TypeScript compilation issues resolved
- **✅ Import Conflicts**: Client/server type separation implemented
- **✅ Regex Safety**: Special characters in ingredient names properly escaped
- **✅ Recipe Extraction**: Successfully extracts and displays recipes in production

### Issues Identified & Fixed
1. **TypeScript Compilation**: Fixed Zod error access patterns, arithmetic operations, webkitAudioContext
2. **Client-Side Imports**: Separated API types to prevent server/client import conflicts
3. **Runtime Errors**: Added ErrorBoundary for graceful error handling
4. **Regex Safety**: Fixed malformed regex patterns from ingredient names with special characters

## Testing Scenarios

### Parsing Validation
- [x] Recipe title extracted correctly
- [x] All ingredients with quantities preserved
- [x] Cooking instructions in proper order
- [x] Total time and servings displayed
- [x] Hero image loads and displays
- [x] Parse source logged to console

### Scaling Functionality
- [x] Ingredient quantities scale proportionally
- [x] Inline step quantities update correctly
- [x] Fraction formatting works (1.5 → "1 1/2")
- [x] Range scaling maintains format ("2-3" → "4-6")
- [x] Visual indicators show scaling status

### Timer Features
- [x] Auto-detected timers appear for cooking steps
- [x] Manual timers can be created and labeled
- [x] Audio alerts work on timer completion
- [x] Multiple timers run simultaneously
- [x] Timer progress displays correctly

### UI/UX Testing
- [x] Mobile responsive layout works
- [x] Dark mode toggle functions
- [x] Ingredient checkboxes track completion
- [x] Step completion tracking works
- [x] Error states display helpful messages
- [x] Loading states show parsing progress

### Production Testing ✅
- [x] **Live deployment successful** on Vercel
- [x] **Runtime error handling** implemented and tested
- [x] **Edge case handling** for special characters in ingredient names
- [x] **Production build stability** achieved
- [x] **Real recipe extraction** working in production environment

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
- **Production Performance**: ✅ **Validated on live Vercel deployment**
