'use client';

import { useState, useMemo } from 'react';
import { Recipe, ParsedIngredient, RecipeInstruction } from '@/types/recipe';
import { scaleIngredient } from '@/lib/parsers/ingredient-parser';

export interface ScaledRecipe extends Omit<Recipe, 'ingredients' | 'instructions'> {
  ingredients: ParsedIngredient[];
  instructions: RecipeInstruction[];
  originalServings: string | undefined;
  currentServings: number;
  scalingMultiplier: number;
}

export interface UseRecipeScalingReturn {
  scaledRecipe: ScaledRecipe;
  currentServings: number;
  originalServings: number;
  scalingMultiplier: number;
  setServings: (servings: number) => void;
  resetToOriginal: () => void;
  scaleToHalf: () => void;
  scaleToDouble: () => void;
  canScaleDown: boolean;
  canScaleUp: boolean;
}

export function useRecipeScaling(originalRecipe: Recipe): UseRecipeScalingReturn {
  // Extract original servings number
  const originalServingsNumber = useMemo(() => {
    if (!originalRecipe.servings) return 4; // Default fallback
    
    // Try to extract number from servings string
    const match = originalRecipe.servings.match(/(\d+)/);
    return match ? parseInt(match[1]) : 4;
  }, [originalRecipe.servings]);

  const [currentServings, setCurrentServings] = useState(originalServingsNumber);

  const scalingMultiplier = currentServings / originalServingsNumber;

  // Scale ingredients
  const scaledIngredients = useMemo(() => {
    return originalRecipe.ingredients.map(ingredient => 
      scaleIngredient(ingredient, scalingMultiplier)
    );
  }, [originalRecipe.ingredients, scalingMultiplier]);

  // Scale inline ingredient quantities in instructions
  const scaledInstructions = useMemo(() => {
    return originalRecipe.instructions.map(instruction => {
      if (!instruction.ingredients || instruction.ingredients.length === 0) {
        return instruction;
      }

      // Create a map of ingredient names to their scaled versions
      const ingredientMap = new Map<string, ParsedIngredient>();
      
      instruction.ingredients.forEach(ingredientName => {
        const originalIngredient = originalRecipe.ingredients.find(ing => 
          ing.ingredient.toLowerCase().includes(ingredientName.toLowerCase()) ||
          ingredientName.toLowerCase().includes(ing.ingredient.toLowerCase())
        );
        
        if (originalIngredient) {
          const scaledIngredient = scaleIngredient(originalIngredient, scalingMultiplier);
          ingredientMap.set(ingredientName, scaledIngredient);
        }
      });

      // Replace quantities in instruction text
      let scaledText = instruction.text;
      
      // Look for quantity patterns in the text and scale them
      scaledText = scaleQuantitiesInText(scaledText, scalingMultiplier);

      return {
        ...instruction,
        text: scaledText,
      };
    });
  }, [originalRecipe.instructions, originalRecipe.ingredients, scalingMultiplier]);

  const scaledRecipe: ScaledRecipe = {
    ...originalRecipe,
    ingredients: scaledIngredients,
    instructions: scaledInstructions,
    originalServings: originalRecipe.servings,
    currentServings,
    scalingMultiplier,
  };

  const setServings = (servings: number) => {
    if (servings > 0 && servings <= 50) { // Reasonable limits
      setCurrentServings(servings);
    }
  };

  const resetToOriginal = () => setCurrentServings(originalServingsNumber);
  const scaleToHalf = () => setCurrentServings(Math.max(1, Math.round(originalServingsNumber * 0.5)));
  const scaleToDouble = () => setCurrentServings(originalServingsNumber * 2);

  const canScaleDown = currentServings > 1;
  const canScaleUp = currentServings < 50;

  return {
    scaledRecipe,
    currentServings,
    originalServings: originalServingsNumber,
    scalingMultiplier,
    setServings,
    resetToOriginal,
    scaleToHalf,
    scaleToDouble,
    canScaleDown,
    canScaleUp,
  };
}

/**
 * Scale quantities found in instruction text
 */
function scaleQuantitiesInText(text: string, multiplier: number): string {
  // Pattern to match quantities like "2 cups", "1/2 pound", "3-4 minutes"
  const quantityPattern = /(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(cups?|tablespoons?|teaspoons?|pounds?|ounces?|grams?|kilograms?|liters?|milliliters?|tbsp|tsp|lb|lbs|oz|g|kg|ml|l)\b/gi;
  
  return text.replace(quantityPattern, (match, quantityStr, unit) => {
    try {
      const scaledQuantity = scaleQuantityString(quantityStr.trim(), multiplier);
      return `${scaledQuantity} ${unit}`;
    } catch {
      // If scaling fails, return original
      return match;
    }
  });
}

/**
 * Scale a quantity string (handles fractions, ranges, decimals)
 */
function scaleQuantityString(quantityStr: string, multiplier: number): string {
  // Handle ranges (e.g., "2-3", "1 to 2")
  const rangeMatch = quantityStr.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]) * multiplier;
    const max = parseFloat(rangeMatch[2]) * multiplier;
    return `${formatScaledNumber(min)}-${formatScaledNumber(max)}`;
  }
  
  // Handle fractions (e.g., "1/2", "2 1/4")
  const fractionMatch = quantityStr.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1] || '0');
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    const decimal = (whole + (numerator / denominator)) * multiplier;
    return formatScaledFraction(decimal);
  }
  
  // Handle decimals
  const decimal = parseFloat(quantityStr);
  if (!isNaN(decimal)) {
    return formatScaledNumber(decimal * multiplier);
  }
  
  // Return original if we can't parse it
  return quantityStr;
}

/**
 * Format a scaled number for display
 */
function formatScaledNumber(num: number): string {
  // Round to reasonable precision
  if (num < 0.1) {
    return num.toFixed(2).replace(/\.?0+$/, '');
  } else if (num < 1) {
    return num.toFixed(1).replace(/\.?0+$/, '');
  } else if (num < 10) {
    return num.toFixed(1).replace(/\.?0+$/, '');
  } else {
    return Math.round(num).toString();
  }
}

/**
 * Convert decimal to fraction for display
 */
function formatScaledFraction(decimal: number): string {
  const whole = Math.floor(decimal);
  const fractional = decimal - whole;
  
  if (fractional < 0.05) {
    return whole > 0 ? whole.toString() : '0';
  }
  
  // Common fractions with tolerance
  const fractions: [number, string][] = [
    [1/8, '1/8'], [1/6, '1/6'], [1/4, '1/4'], [1/3, '1/3'], 
    [3/8, '3/8'], [1/2, '1/2'], [5/8, '5/8'], [2/3, '2/3'], 
    [3/4, '3/4'], [5/6, '5/6'], [7/8, '7/8']
  ];
  
  for (const [value, display] of fractions) {
    if (Math.abs(fractional - value) < 0.05) {
      return whole > 0 ? `${whole} ${display}` : display;
    }
  }
  
  // If no common fraction matches, use decimal
  return formatScaledNumber(decimal);
}

/**
 * Get suggested serving sizes based on original servings
 */
export function getSuggestedServings(originalServings: number): number[] {
  const suggestions = [
    Math.max(1, Math.round(originalServings * 0.5)), // Half
    originalServings, // Original
    originalServings * 2, // Double
  ];
  
  // Add some common serving sizes
  const commonSizes = [1, 2, 4, 6, 8, 12];
  commonSizes.forEach(size => {
    if (!suggestions.includes(size) && size <= originalServings * 3) {
      suggestions.push(size);
    }
  });
  
  return suggestions.sort((a, b) => a - b).slice(0, 6); // Limit to 6 suggestions
}
