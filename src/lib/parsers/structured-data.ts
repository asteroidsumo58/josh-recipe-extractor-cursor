import * as cheerio from 'cheerio';
import { Recipe, JsonLdRecipe, ParsedIngredient, RecipeInstruction } from '@/types/recipe';
import { parseDuration, cleanText, cleanUrl } from '@/lib/utils';
import { parseIngredient, extractIngredientNames, findIngredientsInStep } from '@/lib/parsers/ingredient-parser';

/**
 * Parse JSON-LD structured data from HTML
 */
export function parseJsonLd(html: string, url: string): Recipe | null {
  const $ = cheerio.load(html);
  const domain = new URL(url).hostname;
  
  // Find all JSON-LD script tags
  const jsonLdScripts = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < jsonLdScripts.length; i++) {
    const scriptContent = $(jsonLdScripts[i]).html();
    if (!scriptContent) continue;
    
    try {
      const data = JSON.parse(scriptContent);
      const recipe = extractRecipeFromJsonLd(data, url, domain);
      
      if (recipe) {
        console.log(`✅ Found JSON-LD recipe: "${recipe.title}" from ${domain}`);
        return recipe;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to parse JSON-LD script ${i + 1}:`, error);
      continue;
    }
  }
  
  return null;
}

/**
 * Extract Recipe from JSON-LD data (handles nested structures and arrays)
 */
function extractRecipeFromJsonLd(data: any, url: string, domain: string): Recipe | null {
  // Handle arrays of objects
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = extractRecipeFromJsonLd(item, url, domain);
      if (recipe) return recipe;
    }
    return null;
  }
  
  // Handle @graph structures
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    for (const item of data['@graph']) {
      const recipe = extractRecipeFromJsonLd(item, url, domain);
      if (recipe) return recipe;
    }
  }
  
  // Check if this is a Recipe object
  if (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
    return normalizeJsonLdRecipe(data as JsonLdRecipe, url, domain);
  }
  
  // Recursively search nested objects
  for (const key in data) {
    if (typeof data[key] === 'object' && data[key] !== null) {
      const recipe = extractRecipeFromJsonLd(data[key], url, domain);
      if (recipe) return recipe;
    }
  }
  
  return null;
}

/**
 * Normalize JSON-LD Recipe data to our Recipe interface
 */
function normalizeJsonLdRecipe(jsonLd: JsonLdRecipe, url: string, domain: string): Recipe {
  const startTime = Date.now();
  
  // Extract basic info
  const title = cleanText(jsonLd.name || 'Untitled Recipe');
  const description = cleanText(jsonLd.description || '');
  
  // Extract author
  let author = '';
  if (jsonLd.author) {
    if (typeof jsonLd.author === 'string') {
      author = jsonLd.author;
    } else if (Array.isArray(jsonLd.author)) {
      author = jsonLd.author[0]?.name || '';
    } else if (jsonLd.author.name) {
      author = jsonLd.author.name;
    }
  }
  
  // Extract images
  const images = extractImages(jsonLd.image, url);
  
  // Extract ingredients
  const ingredients = extractIngredients(jsonLd.recipeIngredient || []);
  
  // Extract instructions (with ingredient mapping)
  const instructions = extractInstructions(jsonLd.recipeInstructions || [], ingredients);
  
  // Extract timing
  const totalTime = jsonLd.totalTime ? parseDuration(jsonLd.totalTime)?.display : undefined;
  const prepTime = jsonLd.prepTime ? parseDuration(jsonLd.prepTime)?.display : undefined;
  const cookTime = jsonLd.cookTime ? parseDuration(jsonLd.cookTime)?.display : undefined;
  
  // Extract yield/servings
  const servings = extractServings(jsonLd.recipeYield);
  
  const parseTime = Date.now() - startTime;
  
  return {
    title,
    description,
    author,
    ingredients,
    instructions,
    totalTime,
    prepTime,
    cookTime,
    servings,
    images,
    url,
    domain,
    source: 'json-ld',
    parseTime,
  };
}

/**
 * Extract images from various JSON-LD image formats
 */
function extractImages(imageData: any, baseUrl: string): string[] {
  if (!imageData) return [];
  
  const images: string[] = [];
  
  // Handle different image formats
  if (typeof imageData === 'string') {
    const cleanedUrl = cleanUrl(imageData, baseUrl);
    if (cleanedUrl) images.push(cleanedUrl);
  } else if (Array.isArray(imageData)) {
    for (const img of imageData) {
      if (typeof img === 'string') {
        const cleanedUrl = cleanUrl(img, baseUrl);
        if (cleanedUrl) images.push(cleanedUrl);
      } else if (img.url) {
        const cleanedUrl = cleanUrl(img.url, baseUrl);
        if (cleanedUrl) images.push(cleanedUrl);
      }
    }
  } else if (imageData.url) {
    const cleanedUrl = cleanUrl(imageData.url, baseUrl);
    if (cleanedUrl) images.push(cleanedUrl);
  }
  
  return images;
}

/**
 * Extract and parse ingredients
 */
function extractIngredients(ingredientData: string[]): ParsedIngredient[] {
  if (!Array.isArray(ingredientData)) return [];
  
  return ingredientData.map((ingredient) => {
    const raw = cleanText(ingredient);
    return parseIngredient(raw);
  });
}

/**
 * Extract and parse instructions with ingredient mapping
 */
function extractInstructions(instructionData: any[], ingredients: ParsedIngredient[]): RecipeInstruction[] {
  if (!Array.isArray(instructionData)) return [];
  
  // Extract ingredient names for fuzzy matching
  const ingredientNames = extractIngredientNames(ingredients);
  
  return instructionData.map((instruction, index) => {
    let text = '';
    
    if (typeof instruction === 'string') {
      text = cleanText(instruction);
    } else if (instruction.text) {
      text = cleanText(instruction.text);
    } else if (instruction.name) {
      text = cleanText(instruction.name);
    }
    
    // Parse duration from instruction text
    const duration = parseDuration(text);
    
    // Find ingredients mentioned in this step
    const stepIngredients = findIngredientsInStep(text, ingredientNames);
    
    return {
      step: index + 1,
      text,
      duration: duration || undefined,
      ingredients: stepIngredients.length > 0 ? stepIngredients : undefined,
    };
  });
}

/**
 * Extract servings/yield information
 */
function extractServings(yieldData: any): string | undefined {
  if (!yieldData) return undefined;
  
  if (typeof yieldData === 'string') {
    return cleanText(yieldData);
  } else if (typeof yieldData === 'number') {
    return yieldData.toString();
  } else if (Array.isArray(yieldData)) {
    return cleanText(yieldData[0]?.toString() || '');
  }
  
  return undefined;
}

/**
 * Parse microdata from HTML (fallback for sites without JSON-LD)
 */
export function parseMicrodata(html: string, url: string): Recipe | null {
  const $ = cheerio.load(html);
  const domain = new URL(url).hostname;
  
  // Look for Recipe microdata
  const recipeElements = $('[itemtype*="schema.org/Recipe"], [itemtype*="Recipe"]');
  
  if (recipeElements.length === 0) {
    return null;
  }
  
  const startTime = Date.now();
  const $recipe = $(recipeElements[0]); // Use first recipe found
  
  // Extract basic info
  const title = cleanText(
    $recipe.find('[itemprop="name"]').first().text() ||
    $recipe.find('h1').first().text() ||
    'Untitled Recipe'
  );
  
  const description = cleanText(
    $recipe.find('[itemprop="description"]').first().text()
  );
  
  const author = cleanText(
    $recipe.find('[itemprop="author"]').first().text()
  );
  
  // Extract images
  const images: string[] = [];
  $recipe.find('[itemprop="image"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('content');
    if (src) {
      const cleanedUrl = cleanUrl(src, url);
      if (cleanedUrl) images.push(cleanedUrl);
    }
  });
  
  // Extract ingredients
  const ingredients: ParsedIngredient[] = [];
  $recipe.find('[itemprop="recipeIngredient"]').each((index, el) => {
    const raw = cleanText($(el).text());
    if (raw) {
      ingredients.push(parseIngredient(raw));
    }
  });
  
  // Extract instructions with ingredient mapping
  const ingredientNames = extractIngredientNames(ingredients);
  const instructions: RecipeInstruction[] = [];
  $recipe.find('[itemprop="recipeInstructions"]').each((index, el) => {
    const text = cleanText($(el).text());
    if (text) {
      const duration = parseDuration(text);
      const stepIngredients = findIngredientsInStep(text, ingredientNames);
      
      instructions.push({
        step: index + 1,
        text,
        duration: duration || undefined,
        ingredients: stepIngredients.length > 0 ? stepIngredients : undefined,
      });
    }
  });
  
  // Extract timing
  const totalTimeEl = $recipe.find('[itemprop="totalTime"]').first();
  const totalTime = totalTimeEl.attr('datetime') || totalTimeEl.text();
  const parsedTotalTime = totalTime ? parseDuration(totalTime)?.display : undefined;
  
  const prepTimeEl = $recipe.find('[itemprop="prepTime"]').first();
  const prepTime = prepTimeEl.attr('datetime') || prepTimeEl.text();
  const parsedPrepTime = prepTime ? parseDuration(prepTime)?.display : undefined;
  
  const cookTimeEl = $recipe.find('[itemprop="cookTime"]').first();
  const cookTime = cookTimeEl.attr('datetime') || cookTimeEl.text();
  const parsedCookTime = cookTime ? parseDuration(cookTime)?.display : undefined;
  
  // Extract servings
  const servings = cleanText(
    $recipe.find('[itemprop="recipeYield"], [itemprop="yield"]').first().text()
  ) || undefined;
  
  const parseTime = Date.now() - startTime;
  
  console.log(`✅ Found microdata recipe: "${title}" from ${domain}`);
  
  return {
    title,
    description,
    author,
    ingredients,
    instructions,
    totalTime: parsedTotalTime,
    prepTime: parsedPrepTime,
    cookTime: parsedCookTime,
    servings,
    images,
    url,
    domain,
    source: 'microdata',
    parseTime,
  };
}
