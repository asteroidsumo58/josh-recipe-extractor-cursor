import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseJsonLd, parseMicrodata } from '@/lib/parsers/structured-data';

describe('Structured Data Parsing', () => {
  let allRecipesHtml: string;
  let downshiftologyHtml: string;
  let foodNetworkHtml: string;

  beforeAll(() => {
    // Load HTML fixtures
    const fixturesPath = join(__dirname, 'fixtures');
    allRecipesHtml = readFileSync(join(fixturesPath, 'allrecipes-mexican-casserole.html'), 'utf-8');
    downshiftologyHtml = readFileSync(join(fixturesPath, 'downshiftology-mediterranean-stir-fry.html'), 'utf-8');
    foodNetworkHtml = readFileSync(join(fixturesPath, 'foodnetwork-cacio-e-uova.html'), 'utf-8');
  });

  describe('JSON-LD Parsing', () => {
    it('should parse AllRecipes JSON-LD correctly', () => {
      const recipe = parseJsonLd(allRecipesHtml, 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      
      expect(recipe).toBeTruthy();
      expect(recipe?.title).toBe('Best Taco Casserole');
      expect(recipe?.servings).toBe('6');
      expect(recipe?.source).toBe('json-ld');
      expect(recipe?.ingredients).toHaveLength(9);
      expect(recipe?.instructions).toHaveLength(7);
      
      // Check specific ingredient parsing
      const groundBeef = recipe?.ingredients.find(ing => ing.ingredient === 'lean ground beef');
      expect(groundBeef).toBeTruthy();
      expect(groundBeef?.quantity).toBe(1);
      expect(groundBeef?.unit).toBe('pound');
      
      // Check instruction with timer
      const cookingStep = recipe?.instructions.find(inst => inst.text.includes('8 to 10 minutes'));
      expect(cookingStep).toBeTruthy();
      expect(cookingStep?.duration?.minutes).toBe(10);
      expect(cookingStep?.duration?.iso8601).toBe('PT10M');
    });

    it('should parse Downshiftology JSON-LD correctly', () => {
      const recipe = parseJsonLd(downshiftologyHtml, 'https://downshiftology.com/recipes/mediterranean-ground-beef-stir-fry/');
      
      expect(recipe).toBeTruthy();
      expect(recipe?.title).toContain('Mediterranean');
      expect(recipe?.source).toBe('json-ld');
      expect(recipe?.ingredients.length).toBeGreaterThan(5);
      expect(recipe?.instructions.length).toBeGreaterThan(3);
      
      // Check that servings is parsed
      expect(recipe?.servings).toBeTruthy();
      
      // Check that images are extracted
      expect(recipe?.images.length).toBeGreaterThan(0);
    });

    it('should parse Food Network mock JSON-LD correctly', () => {
      const recipe = parseJsonLd(foodNetworkHtml, 'https://www.foodnetwork.com/recipes/food-network-kitchen/extra-creamy-cacio-e-uova-with-grated-egg-12646498');
      
      expect(recipe).toBeTruthy();
      expect(recipe?.title).toBe('Extra-Creamy Cacio e Uova with Grated Egg');
      expect(recipe?.servings).toBe('4');
      expect(recipe?.source).toBe('json-ld');
      expect(recipe?.totalTime).toBe('25 minutes');
      expect(recipe?.ingredients).toHaveLength(7);
      expect(recipe?.instructions).toHaveLength(6);
      
      // Check specific ingredient
      const pasta = recipe?.ingredients.find(ing => ing.ingredient === 'spaghetti or tonnarelli pasta');
      expect(pasta).toBeTruthy();
      expect(pasta?.quantity).toBe(1);
      expect(pasta?.unit).toBe('pound');
    });

    it('should return null for HTML without JSON-LD', () => {
      const htmlWithoutJsonLd = '<html><body><h1>No Recipe Here</h1></body></html>';
      const recipe = parseJsonLd(htmlWithoutJsonLd, 'https://example.com');
      
      expect(recipe).toBeNull();
    });

    it('should handle malformed JSON-LD gracefully', () => {
      const htmlWithBadJsonLd = `
        <html>
          <body>
            <script type="application/ld+json">
              { "invalid": "json", "missing": "closing brace"
            </script>
          </body>
        </html>
      `;
      const recipe = parseJsonLd(htmlWithBadJsonLd, 'https://example.com');
      
      expect(recipe).toBeNull();
    });

    it('should extract recipe metadata correctly', () => {
      const recipe = parseJsonLd(allRecipesHtml, 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      
      expect(recipe?.url).toBe('https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      expect(recipe?.domain).toBe('www.allrecipes.com');
      expect(recipe?.parseTime).toBeGreaterThanOrEqual(0);
      expect(typeof recipe?.parseTime).toBe('number');
    });

    it('should handle recipes with missing optional fields', () => {
      const minimalJsonLd = `
        <html>
          <body>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Recipe",
                "name": "Simple Recipe",
                "recipeIngredient": ["1 cup flour"],
                "recipeInstructions": [{"@type": "HowToStep", "text": "Mix ingredients"}]
              }
            </script>
          </body>
        </html>
      `;
      const recipe = parseJsonLd(minimalJsonLd, 'https://example.com');
      
      expect(recipe).toBeTruthy();
      expect(recipe?.title).toBe('Simple Recipe');
      expect(recipe?.servings).toBeUndefined(); // Should handle missing servings
      expect(recipe?.totalTime).toBeUndefined(); // Should handle missing time
      expect(recipe?.images).toEqual([]); // Should handle missing images
    });
  });

  describe('Microdata Parsing', () => {
    it('should return null when no microdata is present', () => {
      const recipe = parseMicrodata(allRecipesHtml, 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      
      // AllRecipes uses JSON-LD, not microdata, so this should return null
      expect(recipe).toBeNull();
    });

    it('should parse microdata when present', () => {
      const htmlWithMicrodata = `
        <html>
          <body>
            <div itemscope itemtype="https://schema.org/Recipe">
              <h1 itemprop="name">Microdata Recipe</h1>
              <span itemprop="recipeYield">4 servings</span>
              <div itemprop="recipeIngredient">1 cup sugar</div>
              <div itemprop="recipeIngredient">2 cups flour</div>
              <div itemprop="recipeInstructions">Mix all ingredients</div>
            </div>
          </body>
        </html>
      `;
      const recipe = parseMicrodata(htmlWithMicrodata, 'https://example.com');
      
      expect(recipe).toBeTruthy();
      expect(recipe?.title).toBe('Microdata Recipe');
      expect(recipe?.servings).toBe('4 servings');
      expect(recipe?.source).toBe('microdata');
      expect(recipe?.ingredients.length).toBeGreaterThan(0);
    });

    it('should handle malformed microdata gracefully', () => {
      const htmlWithBadMicrodata = `
        <html>
          <body>
            <div itemscope itemtype="https://schema.org/Recipe">
              <!-- Missing required fields -->
            </div>
          </body>
        </html>
      `;
      const recipe = parseMicrodata(htmlWithBadMicrodata, 'https://example.com');
      
      // Parser is lenient and returns a minimal recipe object even with missing data
      expect(recipe).toBeTruthy();
      expect(recipe?.title).toBe('Untitled Recipe');
      expect(recipe?.source).toBe('microdata');
      expect(recipe?.ingredients).toEqual([]);
      expect(recipe?.instructions).toEqual([]);
    });
  });

  describe('Recipe Field Validation', () => {
    it('should extract and parse ingredient quantities correctly', () => {
      const recipe = parseJsonLd(allRecipesHtml, 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      
      // Check various ingredient formats
      const ingredients = recipe?.ingredients || [];
      
      // Whole number quantity
      const groundBeef = ingredients.find(ing => ing.ingredient === 'lean ground beef');
      expect(groundBeef?.quantity).toBe(1);
      expect(groundBeef?.unit).toBe('pound');
      
      // Decimal quantity
      const greenOnion = ingredients.find(ing => ing.ingredient === 'chopped green onion');
      expect(greenOnion?.quantity).toBe(0.5);
      expect(greenOnion?.unit).toBe('cup');
      
      // Quantity with preparation
      const beans = ingredients.find(ing => ing.ingredient === '(16 ounce) can chili beans');
      expect(beans?.preparation).toBe('drained');
    });

    it('should extract cooking times and durations', () => {
      const recipe = parseJsonLd(allRecipesHtml, 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      
      expect(recipe?.totalTime).toBe('1 hour 15 minutes');
      expect(recipe?.prepTime).toBe('15 minutes');
      expect(recipe?.cookTime).toBe('1 hour');
      
      // Check instruction-level durations
      const instructions = recipe?.instructions || [];
      const timedInstructions = instructions.filter(inst => inst.duration);
      expect(timedInstructions.length).toBeGreaterThan(0);
      
      const cookingStep = instructions.find(inst => inst.duration?.minutes === 10);
      expect(cookingStep?.duration?.display).toBe('10 minutes');
      expect(cookingStep?.duration?.iso8601).toBe('PT10M');
    });

    it('should extract and validate images', () => {
      const recipe = parseJsonLd(allRecipesHtml, 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      
      expect(recipe?.images.length).toBeGreaterThan(0);
      
      // Check that images are valid URLs
      recipe?.images.forEach(imageUrl => {
        expect(imageUrl).toMatch(/^https?:\/\/.+/);
      });
    });

    it('should handle inline ingredient references in instructions', () => {
      const recipe = parseJsonLd(allRecipesHtml, 'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/');
      
      // Check that instructions have ingredient references
      const instructions = recipe?.instructions || [];
      const instructionsWithIngredients = instructions.filter(inst =>
        inst.ingredients && inst.ingredients.length > 0
      );

      expect(instructionsWithIngredients.length).toBeGreaterThan(0);

      // Check specific instruction with ingredients
      const beefStep = instructions.find(inst =>
        inst.text.includes('ground beef') && inst.ingredients?.some(name => name.includes('ground beef'))
      );
      expect(beefStep).toBeTruthy();
    });
  });
});
