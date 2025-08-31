/**
 * API-related type definitions
 * Separated from server-side code to avoid client-side import issues
 */

export interface ParseError {
  error: string;
  message: string;
  suggestion?: string;
}

export interface ParsedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  totalTime?: string;
  servings?: string;
  images: string[];
  source: 'json-ld' | 'microdata' | 'html-heuristics';
  parseTime: number;
}
