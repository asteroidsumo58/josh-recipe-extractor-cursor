import { ParsedIngredient } from '@/types/recipe';
import { cleanText } from '@/lib/utils';

// Common units and their variations
const UNITS = {
  // Volume
  'cup': ['cup', 'cups', 'c'],
  'tablespoon': ['tablespoon', 'tablespoons', 'tbsp', 'tbs', 'T'],
  'teaspoon': ['teaspoon', 'teaspoons', 'tsp', 't'],
  'fluid ounce': ['fluid ounce', 'fluid ounces', 'fl oz', 'fl. oz.', 'floz'],
  'pint': ['pint', 'pints', 'pt'],
  'quart': ['quart', 'quarts', 'qt'],
  'gallon': ['gallon', 'gallons', 'gal'],
  'liter': ['liter', 'liters', 'litre', 'litres', 'l'],
  'milliliter': ['milliliter', 'milliliters', 'millilitre', 'millilitres', 'ml', 'mL'],
  
  // Weight
  'pound': ['pound', 'pounds', 'lb', 'lbs', '#'],
  'ounce': ['ounce', 'ounces', 'oz'],
  'gram': ['gram', 'grams', 'g'],
  'kilogram': ['kilogram', 'kilograms', 'kg'],
  
  // Count/Size
  'piece': ['piece', 'pieces', 'pc', 'pcs'],
  'slice': ['slice', 'slices'],
  'clove': ['clove', 'cloves'],
  'head': ['head', 'heads'],
  'bunch': ['bunch', 'bunches'],
  'package': ['package', 'packages', 'pkg', 'pack'],
  'can': ['can', 'cans'],
  'jar': ['jar', 'jars'],
  'bottle': ['bottle', 'bottles'],
  'box': ['box', 'boxes'],
  'bag': ['bag', 'bags'],
  
  // Descriptive
  'large': ['large', 'lg'],
  'medium': ['medium', 'med', 'medium-sized'],
  'small': ['small', 'sm'],
  'whole': ['whole'],
  'half': ['half', '1/2'],
  'quarter': ['quarter', '1/4'],
};

// Create reverse lookup for unit normalization
const UNIT_LOOKUP = new Map<string, string>();
Object.entries(UNITS).forEach(([canonical, variations]) => {
  variations.forEach(variation => {
    UNIT_LOOKUP.set(variation.toLowerCase(), canonical);
  });
});

// Common preparation methods
const PREPARATIONS = [
  'chopped', 'diced', 'minced', 'sliced', 'grated', 'shredded', 'crushed',
  'peeled', 'seeded', 'deveined', 'trimmed', 'cleaned', 'washed',
  'cooked', 'boiled', 'steamed', 'roasted', 'grilled', 'fried',
  'fresh', 'dried', 'frozen', 'canned', 'bottled',
  'finely chopped', 'roughly chopped', 'thinly sliced', 'thickly sliced',
  'julienned', 'cubed', 'quartered', 'halved', 'whole',
];

/**
 * Parse a raw ingredient string into structured components
 */
export function parseIngredient(raw: string): ParsedIngredient {
  const cleanRaw = cleanText(raw);
  
  // Initialize result with raw text
  const result: ParsedIngredient = {
    raw: cleanRaw,
    ingredient: cleanRaw, // Will be refined below
  };
  
  // Check for optional ingredients (parentheses or "optional" keyword)
  if (cleanRaw.includes('(optional)') || cleanRaw.includes('optional')) {
    result.optional = true;
  }
  
  // Parse the ingredient using regex patterns
  const parsed = parseIngredientText(cleanRaw);
  
  if (parsed) {
    Object.assign(result, parsed);
  }
  
  return result;
}

/**
 * Parse ingredient text using regex patterns
 */
function parseIngredientText(text: string): Partial<ParsedIngredient> | null {
  // Remove optional markers for parsing
  const cleanText = text.replace(/\(optional\)|optional/gi, '').trim();
  
  // Pattern 1: Quantity + Unit + Ingredient + Preparation
  // Example: "2 cups all-purpose flour, sifted"
  const pattern1 = /^([0-9\/\-\.\s]+)\s*([a-zA-Z\s\.]+?)\s+(.+?)(?:,\s*(.+))?$/;
  const match1 = cleanText.match(pattern1);
  
  if (match1) {
    const [, quantityStr, unitStr, ingredientStr, preparationStr] = match1;
    
    const quantity = parseQuantity(quantityStr.trim());
    const unit = normalizeUnit(unitStr.trim());
    
    // Only proceed if we found a valid unit
    if (unit) {
      return {
        quantity,
        unit,
        ingredient: ingredientStr.trim(),
        preparation: preparationStr?.trim(),
      };
    }
  }
  
  // Pattern 2: Quantity + Ingredient (no explicit unit)
  // Example: "3 large eggs" or "1 medium onion"
  const pattern2 = /^([0-9\/\-\.\s]+)\s+(.+)$/;
  const match2 = cleanText.match(pattern2);
  
  if (match2) {
    const [, quantityStr, rest] = match2;
    const quantity = parseQuantity(quantityStr.trim());
    
    // Check if the rest starts with a size descriptor
    const sizeMatch = rest.match(/^(large|medium|small|whole|half|quarter)\s+(.+?)(?:,\s*(.+))?$/i);
    if (sizeMatch) {
      const [, size, ingredientStr, preparationStr] = sizeMatch;
      return {
        quantity,
        unit: size.toLowerCase(),
        ingredient: ingredientStr.trim(),
        preparation: preparationStr?.trim(),
      };
    }
    
    // Otherwise, treat the rest as ingredient + preparation
    const parts = rest.split(',');
    return {
      quantity,
      ingredient: parts[0].trim(),
      preparation: parts[1]?.trim(),
    };
  }
  
  // Pattern 3: Just ingredient with preparation
  // Example: "Salt and pepper to taste"
  const preparationMatch = cleanText.match(/^(.+?)(?:,\s*(.+))?$/);
  if (preparationMatch) {
    const [, ingredientStr, preparationStr] = preparationMatch;
    
    // Check if preparation is actually a preparation method
    if (preparationStr && PREPARATIONS.some(prep => 
      preparationStr.toLowerCase().includes(prep.toLowerCase())
    )) {
      return {
        ingredient: ingredientStr.trim(),
        preparation: preparationStr.trim(),
      };
    }
  }
  
  // Fallback: treat entire text as ingredient
  return {
    ingredient: cleanText,
  };
}

/**
 * Parse quantity string (handles fractions, ranges, decimals)
 */
function parseQuantity(quantityStr: string): number | string {
  const clean = quantityStr.trim();
  
  // Handle ranges (e.g., "2-3", "1 to 2")
  const rangeMatch = clean.match(/^(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}`;
  }
  
  // Handle fractions (e.g., "1/2", "2 1/4")
  const fractionMatch = clean.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1] || '0');
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    const decimal = whole + (numerator / denominator);
    
    // Return as string to preserve original formatting for display
    return fractionMatch[1] ? `${fractionMatch[1]} ${fractionMatch[2]}/${fractionMatch[3]}` : `${fractionMatch[2]}/${fractionMatch[3]}`;
  }
  
  // Handle decimals
  const decimal = parseFloat(clean);
  if (!isNaN(decimal)) {
    return decimal;
  }
  
  // Return as string if we can't parse it
  return clean;
}

/**
 * Normalize unit to canonical form
 */
function normalizeUnit(unitStr: string): string | undefined {
  const clean = unitStr.toLowerCase().trim();
  
  // Direct lookup
  const canonical = UNIT_LOOKUP.get(clean);
  if (canonical) {
    return canonical;
  }
  
  // Try without periods
  const withoutPeriods = clean.replace(/\./g, '');
  const canonicalNoPeriods = UNIT_LOOKUP.get(withoutPeriods);
  if (canonicalNoPeriods) {
    return canonicalNoPeriods;
  }
  
  // Check if it's a size descriptor
  if (['large', 'medium', 'small', 'whole', 'half', 'quarter'].includes(clean)) {
    return clean;
  }
  
  return undefined;
}

/**
 * Extract ingredient names for fuzzy matching
 */
export function extractIngredientNames(ingredients: ParsedIngredient[]): string[] {
  // Build a regex for known unit variations
  const unitPatterns = Array.from(UNIT_LOOKUP.keys())
    .sort((a, b) => b.length - a.length) // longer first to avoid partials
    .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const unitRegex = new RegExp(`\\b(${unitPatterns})\\b`, 'gi');

  // Unicode vulgar fraction characters (common ones)
  const vulgarFractions = /[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g;

  return ingredients.map(ing => {
    // Use the parsed ingredient name, or fall back to raw text
    let name = ing.ingredient || ing.raw;

    // Drop leading quantities (numbers, ranges, ascii fractions) and vulgar fractions
    name = name
      .replace(vulgarFractions, ' ') // replace with space to keep word boundaries
      .replace(/\b\d+[\d\s\/.\-]*\b/g, ' ') // numbers, ranges, ascii fractions
      .replace(unitRegex, ' ') // units
      .replace(/\b(to|–|-)\b/gi, ' '); // range connectors

    // Remove common descriptors and preparations
    name = name.replace(/\b(fresh|freshly|dried|frozen|canned|organic|raw|cooked|ground|coarsely|coarse|finely|cracked)\b/gi, ' ');
    name = name.replace(/\b(all-purpose|whole wheat|self-rising)\b/gi, ' ');

    // Normalize special cases so step text like "salt, pepper" matches
    name = name.replace(/\b(kosher|sea|table|iodized)\s+salt\b/gi, 'salt');
    name = name.replace(/\bblack\s+pepper\b/gi, 'pepper');

    // Clean punctuation and spaces
    name = name.replace(/[^a-zA-Z\s]/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    
    return name;
  });
}

/**
 * Find ingredients mentioned in a cooking step
 */
export function findIngredientsInStep(
  stepText: string, 
  ingredientNames: string[], 
  threshold = 0.6
): string[] {
  const foundIngredients: string[] = [];
  const stepWords = stepText.toLowerCase().split(/\s+/);
  
  for (const ingredientName of ingredientNames) {
    const ingredientWords = ingredientName.toLowerCase().split(/\s+/);
    
    // Check for exact matches first
    if (stepText.toLowerCase().includes(ingredientName.toLowerCase())) {
      foundIngredients.push(ingredientName);
      continue;
    }
    
    // Check for partial matches (at least half the ingredient words)
    let matchedWords = 0;
    for (const ingredientWord of ingredientWords) {
      if (ingredientWord.length > 2 && stepWords.some(stepWord => 
        stepWord.includes(ingredientWord) || ingredientWord.includes(stepWord)
      )) {
        matchedWords++;
      }
    }
    
    const matchRatio = matchedWords / ingredientWords.length;
    if (matchRatio >= threshold) {
      foundIngredients.push(ingredientName);
    }
  }
  
  return foundIngredients;
}

/**
 * Format ingredient for display in cooking steps
 */
export function formatIngredientForStep(ingredient: ParsedIngredient): string {
  const parts: string[] = [];
  
  if (ingredient.quantity) {
    parts.push(ingredient.quantity.toString());
  }
  
  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }
  
  parts.push(ingredient.ingredient);
  
  return parts.join(' ');
}

/**
 * Scale ingredient quantity by a multiplier
 */
export function scaleIngredient(ingredient: ParsedIngredient, multiplier: number): ParsedIngredient {
  const scaled = { ...ingredient };
  
  if (typeof ingredient.quantity === 'number') {
    scaled.quantity = ingredient.quantity * multiplier;
  } else if (typeof ingredient.quantity === 'string') {
    // Handle ranges
    const rangeMatch = ingredient.quantity.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]) * multiplier;
      const max = parseFloat(rangeMatch[2]) * multiplier;
      scaled.quantity = `${formatNumber(min)}-${formatNumber(max)}`;
    } else {
      // Handle fractions
      const fractionMatch = ingredient.quantity.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
      if (fractionMatch) {
        const whole = parseInt(fractionMatch[1] || '0');
        const numerator = parseInt(fractionMatch[2]);
        const denominator = parseInt(fractionMatch[3]);
        const decimal = (whole + (numerator / denominator)) * multiplier;
        scaled.quantity = formatFraction(decimal);
      }
    }
  }
  
  return scaled;
}

/**
 * Format number for display (remove unnecessary decimals)
 */
function formatNumber(num: number): string {
  return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Convert decimal to fraction for display
 */
function formatFraction(decimal: number): string {
  const whole = Math.floor(decimal);
  const fractional = decimal - whole;
  
  if (fractional === 0) {
    return whole.toString();
  }
  
  // Common fractions
  const fractions: [number, string][] = [
    [1/4, '1/4'], [1/3, '1/3'], [1/2, '1/2'], [2/3, '2/3'], [3/4, '3/4']
  ];
  
  for (const [value, display] of fractions) {
    if (Math.abs(fractional - value) < 0.05) {
      return whole > 0 ? `${whole} ${display}` : display;
    }
  }
  
  // Fall back to decimal
  return formatNumber(decimal);
}
