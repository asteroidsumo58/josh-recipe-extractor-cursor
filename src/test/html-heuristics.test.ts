import { describe, it, expect } from 'vitest';
import { parseHtmlHeuristics, extractInstructionsLoose } from '@/lib/parsers/html-heuristics';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('HTML Heuristics - Langbein style pages', () => {
  it('extracts STEP-based instructions under Method and ingredient lines under Ingredients', () => {
    const html = `
      <article>
        <h1>Huntsman’s Chicken Pie</h1>
        <h3>Ingredients</h3>
        <p>2 tbsp butter</p>
        <p>4 rashers bacon, chopped</p>
        <p>2 onions, finely diced</p>
        <h3>Method</h3>
        <p>STEP 1 Preheat oven to 180°C fanbake. Melt butter and cook bacon and onions.</p>
        <p>STEP 2 Add mushrooms and herbs and cook. Mix cornflour and add to pan with wine.</p>
      </article>`;

    const result = parseHtmlHeuristics(html, 'https://www.langbein.com/recipes/huntsman-chicken-pie');
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(result.instructions.length).toBeGreaterThanOrEqual(2);
    expect(result.instructions[0].text.toLowerCase()).toContain('preheat oven');
  });

  it('extractInstructionsLoose picks up STEP paragraphs when ingredient parsing fails', () => {
    const html = `
      <div>
        <h2>Method</h2>
        <p>STEP 1 Heat the pan.</p>
        <p>STEP 2 Add chicken and cook 10 minutes.</p>
      </div>`;
    const steps = extractInstructionsLoose(html);
    expect(steps.length).toBe(2);
    expect(steps[1].text.toLowerCase()).toContain('add chicken');
  });
});

const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Simple Pasta Recipe - Test Site</title>
    <meta name="description" content="A delicious and easy pasta recipe that anyone can make">
    <meta name="author" content="Test Chef">
</head>
<body>
    <h1>Simple Spaghetti Carbonara</h1>
    
    <div class="recipe-meta">
        <span class="servings">Serves 4</span>
        <span class="total-time">30 minutes</span>
        <span class="prep-time">10 minutes</span>
        <span class="cook-time">20 minutes</span>
    </div>
    
    <img src="/recipe-image.jpg" width="400" height="300" alt="Spaghetti Carbonara">
    
    <h2>Ingredients</h2>
    <ul class="ingredients">
        <li>1 pound spaghetti</li>
        <li>4 large eggs</li>
        <li>1 cup grated Parmesan cheese</li>
        <li>8 ounces pancetta, diced</li>
        <li>2 cloves garlic, minced</li>
        <li>Salt and black pepper to taste</li>
        <li>2 tablespoons olive oil</li>
    </ul>
    
    <h2>Instructions</h2>
    <ol class="instructions">
        <li>Bring a large pot of salted water to boil. Cook spaghetti according to package directions until al dente, about 10-12 minutes.</li>
        <li>While pasta cooks, heat olive oil in a large skillet over medium heat. Add pancetta and cook until crispy, about 5 minutes.</li>
        <li>Add garlic to the skillet and cook for another minute until fragrant.</li>
        <li>In a bowl, whisk together eggs and Parmesan cheese. Season with salt and pepper.</li>
        <li>Drain pasta, reserving 1 cup of pasta water. Add hot pasta to the skillet with pancetta.</li>
        <li>Remove from heat and quickly stir in the egg mixture, adding pasta water as needed to create a creamy sauce, about 2-3 minutes.</li>
        <li>Serve immediately with additional Parmesan cheese and black pepper.</li>
    </ol>
</body>
</html>
`;

describe('HTML Heuristics Parser', () => {
  it('should parse a basic recipe from HTML', () => {
    const recipe = parseHtmlHeuristics(testHtml, 'https://example.com/recipe');
    
    expect(recipe).toBeTruthy();
    expect(recipe?.title).toBe('Simple Spaghetti Carbonara');
    expect(recipe?.source).toBe('html-heuristics');
    expect(recipe?.domain).toBe('example.com');
  });
  
  it('should extract ingredients correctly', () => {
    const recipe = parseHtmlHeuristics(testHtml, 'https://example.com/recipe');
    
    expect(recipe?.ingredients).toHaveLength(7);
    expect(recipe?.ingredients[0].raw).toBe('1 pound spaghetti');
    expect(recipe?.ingredients[1].raw).toBe('4 large eggs');
    expect(recipe?.ingredients[2].raw).toBe('1 cup grated Parmesan cheese');
  });
  
  it('should extract instructions with timing', () => {
    const recipe = parseHtmlHeuristics(testHtml, 'https://example.com/recipe');
    
    expect(recipe?.instructions).toHaveLength(7);
    expect(recipe?.instructions[0].step).toBe(1);
    expect(recipe?.instructions[0].text).toContain('Bring a large pot of salted water to boil');
    
    // Check that timing is parsed from instructions
    expect(recipe?.instructions[0].duration?.minutes).toBe(12);
    expect(recipe?.instructions[1].duration?.minutes).toBe(5);
  });
  
  it('should extract metadata', () => {
    const recipe = parseHtmlHeuristics(testHtml, 'https://example.com/recipe');
    
    expect(recipe?.description).toBe('A delicious and easy pasta recipe that anyone can make');
    expect(recipe?.author).toBe('Test Chef');
    expect(recipe?.servings).toBe('Serves 4');
    expect(recipe?.totalTime).toBe('30 minutes');
    expect(recipe?.prepTime).toBe('10 minutes');
    expect(recipe?.cookTime).toBe('20 minutes');
  });
  
  it('should return null for non-recipe HTML', () => {
    const nonRecipeHtml = `
      <html>
        <body>
          <h1>About Us</h1>
          <p>This is just a regular webpage with no recipe content.</p>
        </body>
      </html>
    `;
    
    const recipe = parseHtmlHeuristics(nonRecipeHtml, 'https://example.com/about');
    expect(recipe).toBeNull();
  });
  
  it('should handle missing elements gracefully', () => {
    const minimalHtml = `
      <html>
        <body>
          <h1>Basic Recipe</h1>
          <ul>
            <li>1 cup flour</li>
            <li>2 eggs</li>
            <li>1 cup milk</li>
          </ul>
          <ol>
            <li>Mix ingredients</li>
            <li>Cook for 10 minutes</li>
          </ol>
        </body>
      </html>
    `;
    
    const recipe = parseHtmlHeuristics(minimalHtml, 'https://example.com/basic');
    
    expect(recipe).toBeTruthy();
    expect(recipe?.title).toBe('Basic Recipe');
    expect(recipe?.ingredients).toHaveLength(3);
    expect(recipe?.instructions).toHaveLength(2);
    expect(recipe?.description).toBeUndefined();
    expect(recipe?.author).toBeUndefined();
  });
});
