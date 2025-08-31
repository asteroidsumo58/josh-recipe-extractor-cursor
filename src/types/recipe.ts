import { z } from 'zod';

// Core recipe data structure
export interface Recipe {
  title: string;
  ingredients: ParsedIngredient[];
  instructions: RecipeInstruction[];
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  yield?: string;
  images: string[];
  description?: string;
  author?: string;
  url?: string;
  source: 'json-ld' | 'microdata' | 'html-heuristics';
  parseTime: number;
  domain: string;
}

// Parsed ingredient with quantity, unit, and name
export interface ParsedIngredient {
  raw: string; // Original text
  quantity?: number | string; // Could be "2-3" for ranges
  unit?: string;
  ingredient: string;
  preparation?: string; // "chopped", "diced", etc.
  optional?: boolean;
}

// Recipe instruction with optional timing and ingredient references
export interface RecipeInstruction {
  step: number;
  text: string;
  duration?: Duration; // Parsed time if found
  ingredients?: string[]; // Ingredients referenced in this step
  temperature?: string;
}

// Duration parsing for timers
export interface Duration {
  minutes: number;
  display: string; // "20 minutes", "1 hour 30 minutes"
  iso8601?: string; // PT20M, PT1H30M
}

// Zod schemas for validation
export const DurationSchema = z.object({
  minutes: z.number().positive(),
  display: z.string(),
  iso8601: z.string().optional(),
});

export const ParsedIngredientSchema = z.object({
  raw: z.string(),
  quantity: z.union([z.number(), z.string()]).optional(),
  unit: z.string().optional(),
  ingredient: z.string(),
  preparation: z.string().optional(),
  optional: z.boolean().optional(),
});

export const RecipeInstructionSchema = z.object({
  step: z.number().positive(),
  text: z.string(),
  duration: DurationSchema.optional(),
  ingredients: z.array(z.string()).optional(),
  temperature: z.string().optional(),
});

export const RecipeSchema = z.object({
  title: z.string(),
  ingredients: z.array(ParsedIngredientSchema),
  instructions: z.array(RecipeInstructionSchema),
  totalTime: z.string().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  servings: z.string().optional(),
  yield: z.string().optional(),
  images: z.array(z.string()),
  description: z.string().optional(),
  author: z.string().optional(),
  url: z.string().optional(),
  source: z.enum(['json-ld', 'microdata', 'html-heuristics']),
  parseTime: z.number(),
  domain: z.string(),
});

// API response types
export interface ParseResponse {
  recipe: Recipe;
}

export interface ParseError {
  error: string;
  message: string;
  suggestion?: string;
}

// JSON-LD Recipe schema types (schema.org)
export interface JsonLdRecipe {
  '@type': 'Recipe';
  name?: string;
  description?: string;
  author?: JsonLdPerson | JsonLdPerson[] | string;
  image?: string | string[] | JsonLdImage | JsonLdImage[];
  recipeIngredient?: string[];
  recipeInstructions?: (string | JsonLdInstruction)[];
  totalTime?: string; // ISO 8601 duration
  prepTime?: string;
  cookTime?: string;
  recipeYield?: string | number;
  nutrition?: JsonLdNutrition;
  aggregateRating?: JsonLdRating;
  video?: JsonLdVideo;
  keywords?: string | string[];
  recipeCategory?: string | string[];
  recipeCuisine?: string | string[];
  datePublished?: string;
  url?: string;
}

export interface JsonLdPerson {
  '@type': 'Person';
  name: string;
}

export interface JsonLdImage {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

export interface JsonLdInstruction {
  '@type': 'HowToStep';
  text?: string;
  name?: string;
  image?: string | JsonLdImage;
  url?: string;
}

export interface JsonLdNutrition {
  '@type': 'NutritionInformation';
  calories?: string | number;
  servingSize?: string;
}

export interface JsonLdRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
}

export interface JsonLdVideo {
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
}
