import { describe, it, expect } from 'vitest';
import { 
  parseIngredient, 
  extractIngredientNames, 
  findIngredientsInStep, 
  scaleIngredient,
  formatIngredientForStep 
} from '@/lib/parsers/ingredient-parser';

describe('Ingredient Parser', () => {
  describe('parseIngredient', () => {
    it('should parse quantity, unit, and ingredient', () => {
      const result = parseIngredient('2 cups all-purpose flour');
      
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('cup');
      expect(result.ingredient).toBe('all-purpose flour');
    });
    
    it('should handle fractions', () => {
      const result = parseIngredient('1/2 cup butter');
      
      expect(result.quantity).toBe('1/2');
      expect(result.unit).toBe('cup');
      expect(result.ingredient).toBe('butter');
    });
    
    it('should handle mixed fractions', () => {
      const result = parseIngredient('2 1/4 cups sugar');
      
      expect(result.quantity).toBe('2 1/4');
      expect(result.unit).toBe('cup');
      expect(result.ingredient).toBe('sugar');
    });
    
    it('should handle ranges', () => {
      const result = parseIngredient('2-3 large eggs');
      
      expect(result.quantity).toBe('2-3');
      expect(result.unit).toBe('large');
      expect(result.ingredient).toBe('eggs');
    });
    
    it('should handle preparations', () => {
      const result = parseIngredient('1 onion, diced');
      
      expect(result.quantity).toBe(1);
      expect(result.ingredient).toBe('onion');
      expect(result.preparation).toBe('diced');
    });
    
    it('should handle complex ingredients', () => {
      const result = parseIngredient('1 (14.5 oz) can diced tomatoes, drained');
      
      expect(result.quantity).toBe(1);
      expect(result.ingredient).toBe('(14.5 oz) can diced tomatoes');
      expect(result.preparation).toBe('drained');
    });
    
    it('should handle optional ingredients', () => {
      const result = parseIngredient('1 tsp vanilla extract (optional)');
      
      expect(result.quantity).toBe(1);
      expect(result.unit).toBe('teaspoon');
      expect(result.ingredient).toBe('vanilla extract');
      expect(result.optional).toBe(true);
    });
    
    it('should handle ingredients without quantities', () => {
      const result = parseIngredient('Salt and pepper to taste');
      
      expect(result.ingredient).toBe('Salt and pepper to taste');
      expect(result.quantity).toBeUndefined();
      expect(result.unit).toBeUndefined();
    });
  });
  
  describe('extractIngredientNames', () => {
    it('should extract clean ingredient names', () => {
      const ingredients = [
        { raw: '2 cups flour', ingredient: 'all-purpose flour', quantity: 2, unit: 'cup' },
        { raw: '1 large egg', ingredient: 'egg', quantity: 1, unit: 'large' },
        { raw: '1/2 cup milk', ingredient: 'whole milk', quantity: '1/2', unit: 'cup' },
      ];
      
      const names = extractIngredientNames(ingredients);
      
      expect(names).toEqual(['all-purpose flour', 'egg', 'whole milk']);
    });
  });
  
  describe('findIngredientsInStep', () => {
    it('should find ingredients mentioned in cooking steps', () => {
      const ingredientNames = ['ground beef', 'onion', 'garlic', 'tomatoes'];
      const stepText = 'Heat oil in a pan and cook the ground beef with diced onion until browned.';
      
      const found = findIngredientsInStep(stepText, ingredientNames);
      
      expect(found).toContain('ground beef');
      expect(found).toContain('onion');
      expect(found).not.toContain('garlic');
      expect(found).not.toContain('tomatoes');
    });
    
    it('should handle partial matches', () => {
      const ingredientNames = ['fresh basil leaves', 'olive oil'];
      const stepText = 'Drizzle with olive oil and garnish with basil.';
      
      const found = findIngredientsInStep(stepText, ingredientNames);
      
      expect(found).toContain('olive oil');
      expect(found).toContain('fresh basil leaves');
    });
  });
  
  describe('scaleIngredient', () => {
    it('should scale numeric quantities', () => {
      const ingredient = { raw: '2 cups flour', ingredient: 'flour', quantity: 2, unit: 'cup' };
      const scaled = scaleIngredient(ingredient, 1.5);
      
      expect(scaled.quantity).toBe(3);
    });
    
    it('should scale fractional quantities', () => {
      const ingredient = { raw: '1/2 cup butter', ingredient: 'butter', quantity: '1/2', unit: 'cup' };
      const scaled = scaleIngredient(ingredient, 2);
      
      expect(scaled.quantity).toBe('1');
    });
    
    it('should scale range quantities', () => {
      const ingredient = { raw: '2-3 eggs', ingredient: 'eggs', quantity: '2-3', unit: 'large' };
      const scaled = scaleIngredient(ingredient, 1.5);
      
      expect(scaled.quantity).toBe('3-4.5');
    });
  });
  
  describe('formatIngredientForStep', () => {
    it('should format ingredient for display in steps', () => {
      const ingredient = { raw: '2 cups flour', ingredient: 'flour', quantity: 2, unit: 'cup' };
      const formatted = formatIngredientForStep(ingredient);
      
      expect(formatted).toBe('2 cup flour');
    });
    
    it('should handle ingredients without quantities', () => {
      const ingredient = { raw: 'salt to taste', ingredient: 'salt' };
      const formatted = formatIngredientForStep(ingredient);
      
      expect(formatted).toBe('salt');
    });
  });
});
