import * as cheerio from 'cheerio';
import { Recipe, ParsedIngredient, RecipeInstruction } from '@/types/recipe';
import { parseDuration, cleanText, cleanUrl, extractNumber } from '@/lib/utils';
import { parseIngredient, extractIngredientNames, findIngredientsInStep } from '@/lib/parsers/ingredient-parser';

/**
 * Parse recipe data using HTML heuristics (fallback when no structured data)
 */
export function parseHtmlHeuristics(html: string, url: string): Recipe | null {
  const $ = cheerio.load(html);
  const domain = new URL(url).hostname;
  const startTime = Date.now();
  
  console.log(`🔍 Attempting HTML heuristic parsing for ${domain}...`);
  
  // Remove unwanted elements that might interfere with parsing
  $('script, style, nav, header, footer, .ad, .advertisement, .social, .share, .comment').remove();
  
  // Extract title
  const title = extractTitle($);
  if (!title) {
    console.log(`❌ No title found for ${domain}`);
    return null;
  }
  
  // Extract ingredients
  const ingredients = extractIngredients($);
  if (ingredients.length === 0) {
    console.log(`❌ No ingredients found for ${domain}`);
    return null;
  }
  
  // Extract instructions (with ingredient mapping)
  const instructions = extractInstructions($, ingredients);
  if (instructions.length === 0) {
    console.log(`❌ No instructions found for ${domain}`);
    return null;
  }
  
  // Extract other recipe data
  const description = extractDescription($);
  const author = extractAuthor($);
  const images = extractImages($, url);
  const servings = extractServings($);
  const totalTime = extractTotalTime($);
  const prepTime = extractPrepTime($);
  const cookTime = extractCookTime($);
  
  const parseTime = Date.now() - startTime;
  
  console.log(`✅ HTML heuristic parsing successful for ${domain}: "${title}" (${ingredients.length} ingredients, ${instructions.length} steps)`);
  
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
    source: 'html-heuristics',
    parseTime,
  };
}

/**
 * Extract recipe title using common selectors
 */
function extractTitle($: cheerio.CheerioAPI): string | null {
  const selectors = [
    'h1.recipe-title',
    'h1.entry-title',
    'h1[class*="recipe"]',
    'h1[class*="title"]',
    '.recipe-header h1',
    '.recipe-title',
    '.entry-title',
    'h1',
    'title',
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.text());
      if (text && text.length > 3 && text.length < 200) {
        return text;
      }
    }
  }
  
  return null;
}

/**
 * Extract recipe description
 */
function extractDescription($: cheerio.CheerioAPI): string | undefined {
  const selectors = [
    '.recipe-description',
    '.recipe-summary',
    '.entry-summary',
    '.recipe-intro',
    '[class*="description"]',
    'meta[name="description"]',
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.attr('content') || element.text());
      if (text && text.length > 10 && text.length < 1000) {
        return text;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract recipe author
 */
function extractAuthor($: cheerio.CheerioAPI): string | undefined {
  const selectors = [
    '.recipe-author',
    '.author-name',
    '.by-author',
    '[class*="author"]',
    'meta[name="author"]',
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.attr('content') || element.text());
      if (text && text.length > 1 && text.length < 100) {
        return text;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract ingredients using common patterns
 */
function extractIngredients($: cheerio.CheerioAPI): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];
  
  // Common ingredient selectors
  const selectors = [
    '.recipe-ingredients li',
    '.ingredients li',
    '.recipe-ingredient',
    '[class*="ingredient"] li',
    'ul[class*="ingredient"] li',
    '.ingredient-list li',
    // Fallback: look for lists that might contain ingredients
    'ul li',
  ];
  
  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 2) { // Need at least 3 ingredients to be confident
      elements.each((index, element) => {
        const text = cleanText($(element).text());
        if (isLikelyIngredient(text)) {
          ingredients.push(parseIngredient(text));
        }
      });
      
      if (ingredients.length > 2) {
        break; // Found a good ingredient list
      } else {
        ingredients.length = 0; // Reset if not enough ingredients
      }
    }
  }
  // Fallback: Look for an "Ingredients" header and parse following paragraphs/list items
  if (ingredients.length === 0) {
    const headerSelectors = 'h2, h3, h4, h5';
    const headers = $(headerSelectors).filter((_, el) => {
      const text = cleanText($(el).text());
      return /^ingredients$/i.test(text);
    });

    headers.each((_, header) => {
      let current = $(header).next();
      while (current.length && current[0].tagName && !/^h[2-5]$/i.test(current[0].tagName)) {
        // Collect explicit list items
        current.find('li').each((_, li) => {
          const text = cleanText($(li).text());
          if (isLikelyIngredient(text)) {
            ingredients.push(parseIngredient(text));
          }
        });

        // Collect paragraph-based lines
        if (current.is('p') || current.find('p').length) {
          const paragraphs = current.is('p') ? current : current.find('p');
          paragraphs.each((_, p) => {
            const text = cleanText($(p).text());
            if (isLikelyIngredient(text)) {
              ingredients.push(parseIngredient(text));
            }
          });
        }

        // Collect <br>-separated lines
        const html = current.html() || '';
        if (html.includes('<br')) {
          const parts = cleanText(current.text()).split(/\s*\n+\s*/);
          parts.forEach(line => {
            const text = cleanText(line);
            if (isLikelyIngredient(text)) {
              ingredients.push(parseIngredient(text));
            }
          });
        }

        current = current.next();
      }
    });
  }

  return ingredients;
}

/**
 * Check if text looks like an ingredient
 */
function isLikelyIngredient(text: string): boolean {
  if (!text || text.length < 3 || text.length > 200) return false;
  
  // Skip if it looks like navigation, ads, or other non-ingredient content
  const skipPatterns = [
    /^(print|save|share|rate|review|comment|subscribe|follow)/i,
    /^(home|about|contact|privacy|terms)/i,
    /^(advertisement|sponsored|affiliate)/i,
    /^(step \d+|instruction)/i,
  ];
  
  for (const pattern of skipPatterns) {
    if (pattern.test(text)) return false;
  }
  
  // Look for ingredient-like patterns
  const ingredientPatterns = [
    /\d+.*(?:cup|tablespoon|teaspoon|pound|ounce|gram|liter|ml|tsp|tbsp|lb|oz|g|kg)/i,
    /\d+.*(?:large|medium|small|whole|half|quarter)/i,
    /(?:salt|pepper|oil|butter|flour|sugar|egg|milk|water|onion|garlic)/i,
  ];
  
  return ingredientPatterns.some(pattern => pattern.test(text));
}

/**
 * Extract instructions using common patterns with ingredient mapping
 */
function extractInstructions($: cheerio.CheerioAPI, ingredients: ParsedIngredient[]): RecipeInstruction[] {
  const instructions: RecipeInstruction[] = [];
  
  // Extract ingredient names for fuzzy matching
  const ingredientNames = extractIngredientNames(ingredients);
  
  // Common instruction selectors
  const selectors = [
    '.recipe-instructions li',
    '.instructions li',
    '.recipe-instruction',
    '.directions li',
    '.method li',
    '[class*="instruction"] li',
    'ol[class*="instruction"] li',
    '.instruction-list li',
    // Paragraph-based instructions (common on some blogs)
    '.instructions p',
    '.method p',
    '[class*="instruction"] p',
    '[class*="method"] p',
    '[itemprop="recipeInstructions"] p',
    // Fallback: look for ordered lists
    'ol li',
  ];
  
  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 1) { // Need at least 2 steps
      elements.each((index, element) => {
        const text = cleanText($(element).text());
        if (isLikelyInstruction(text)) {
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
      
      if (instructions.length > 1) {
        break; // Found a good instruction list
      } else {
        instructions.length = 0; // Reset if not enough instructions
      }
    }
  }
  
  // Fallback strategy #2: Look for Method/Instructions headers followed by paragraphs
  if (instructions.length === 0) {
    const headerSelectors = 'h2, h3, h4, h5';
    const headers = $(headerSelectors).filter((_, el) => {
      const text = cleanText($(el).text());
      return /^(method|methods|instructions|direction|directions)$/i.test(text);
    });

    headers.each((_, header) => {
      // Traverse siblings until the next header, collecting paragraphs and list items
      let current = $(header).next();
      while (current.length && current[0].tagName && !/^h[2-5]$/i.test(current[0].tagName)) {
        // Collect list items inside this block if present
        current.find('li').each((index, li) => {
          const text = cleanText($(li).text());
          if (isLikelyInstruction(text)) {
            const duration = parseDuration(text);
            const stepIngredients = findIngredientsInStep(text, ingredientNames);
            instructions.push({
              step: instructions.length + 1,
              text,
              duration: duration || undefined,
              ingredients: stepIngredients.length > 0 ? stepIngredients : undefined,
            });
          }
        });

        // Collect paragraphs in this block (common on some sites)
        if (current.is('p') || current.find('p').length) {
          const paragraphs = current.is('p') ? current : current.find('p');
          paragraphs.each((_, p) => {
            const text = cleanText($(p).text());
            // Prioritize paragraphs starting with STEP n or that look instructional
            if (/^step\s*\d+/i.test(text) || isLikelyInstruction(text)) {
              const duration = parseDuration(text);
              const stepIngredients = findIngredientsInStep(text, ingredientNames);
              instructions.push({
                step: instructions.length + 1,
                text,
                duration: duration || undefined,
                ingredients: stepIngredients.length > 0 ? stepIngredients : undefined,
              });
            }
          });
        }

        current = current.next();
      }
    });
  }

  // As a last resort, scan all STEP paragraphs on the page
  if (instructions.length === 0) {
    const stepParas = $('p').filter((_, el) => {
      const text = cleanText($(el).text());
      return /^step\s*\d+/i.test(text);
    });

    if (stepParas.length > 1) {
      stepParas.each((_, p) => {
        const text = cleanText($(p).text());
        const duration = parseDuration(text);
        const stepIngredients = findIngredientsInStep(text, ingredientNames);
        instructions.push({
          step: instructions.length + 1,
          text,
          duration: duration || undefined,
          ingredients: stepIngredients.length > 0 ? stepIngredients : undefined,
        });
      });
    }
  }

  return instructions;
}

/**
 * Exported helper to extract instructions from raw HTML without requiring ingredient parsing.
 * This helps when sites label sections as "Method" with "STEP n" paragraphs.
 */
export function extractInstructionsLoose(html: string): RecipeInstruction[] {
  const $ = cheerio.load(html);
  return extractInstructions($, []);
}

/**
 * Check if text looks like a cooking instruction
 */
function isLikelyInstruction(text: string): boolean {
  if (!text || text.length < 10 || text.length > 1000) return false;
  
  // Skip if it looks like navigation or other non-instruction content
  const skipPatterns = [
    /^(print|save|share|rate|review|comment|subscribe|follow)/i,
    /^(home|about|contact|privacy|terms)/i,
    /^(advertisement|sponsored|affiliate)/i,
    /^(ingredient|nutrition|calories)/i,
  ];
  
  for (const pattern of skipPatterns) {
    if (pattern.test(text)) return false;
  }
  
  // Look for instruction-like patterns
  const instructionPatterns = [
    /(?:heat|cook|bake|boil|simmer|fry|sauté|mix|stir|add|combine|place|put|set)/i,
    /(?:preheat|prepare|chop|dice|slice|cut|season|serve)/i,
    /(?:oven|pan|pot|bowl|skillet|saucepan)/i,
    /(?:minutes?|hours?|degrees?|°[CF])/i,
  ];
  
  return instructionPatterns.some(pattern => pattern.test(text));
}

/**
 * Extract images from the page
 */
function extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];
  const seenUrls = new Set<string>();
  
  // Common image selectors
  const selectors = [
    '.recipe-image img',
    '.recipe-photo img',
    '.featured-image img',
    '.entry-image img',
    '[class*="recipe"] img',
    'img[class*="recipe"]',
    // Fallback: any large images
    'img',
  ];
  
  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy-src');
      if (src) {
        const cleanedUrl = cleanUrl(src, baseUrl);
        if (cleanedUrl && !seenUrls.has(cleanedUrl)) {
          // Skip small images (likely icons or ads)
          const width = parseInt($(element).attr('width') || '0');
          const height = parseInt($(element).attr('height') || '0');
          
          if ((width === 0 && height === 0) || (width >= 200 && height >= 150)) {
            images.push(cleanedUrl);
            seenUrls.add(cleanedUrl);
          }
        }
      }
    });
    
    if (images.length >= 3) break; // Don't need too many images
  }
  
  return images;
}

/**
 * Extract servings/yield information
 */
function extractServings($: cheerio.CheerioAPI): string | undefined {
  const selectors = [
    '.recipe-yield',
    '.servings',
    '.serves',
    '[class*="yield"]',
    '[class*="serving"]',
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.text());
      const number = extractNumber(text);
      if (number && number > 0 && number < 100) {
        return text;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract total time
 */
function extractTotalTime($: cheerio.CheerioAPI): string | undefined {
  const selectors = [
    '.total-time',
    '.recipe-time',
    '[class*="total"]',
    '.time',
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.text());
      const duration = parseDuration(text);
      if (duration) {
        return duration.display;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract prep time
 */
function extractPrepTime($: cheerio.CheerioAPI): string | undefined {
  const selectors = [
    '.prep-time',
    '[class*="prep"]',
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.text());
      const duration = parseDuration(text);
      if (duration) {
        return duration.display;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract cook time
 */
function extractCookTime($: cheerio.CheerioAPI): string | undefined {
  const selectors = [
    '.cook-time',
    '[class*="cook"]',
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = cleanText(element.text());
      const duration = parseDuration(text);
      if (duration) {
        return duration.display;
      }
    }
  }
  
  return undefined;
}
