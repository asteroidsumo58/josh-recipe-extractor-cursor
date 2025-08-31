'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Recipe, ParsedIngredient, RecipeInstruction } from '@/types/recipe';
import { formatIngredientForStep } from '@/lib/parsers/ingredient-parser';
import TimerButton from './TimerButton';
import TimerPanel from './TimerPanel';

interface RecipeViewProps {
  recipe: Recipe;
  onBack: () => void;
}

interface IngredientCheckState {
  [key: number]: boolean;
}

interface StepCheckState {
  [key: number]: boolean;
}

export default function RecipeView({ recipe, onBack }: RecipeViewProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<IngredientCheckState>({});
  const [checkedSteps, setCheckedSteps] = useState<StepCheckState>({});
  const [servings, setServings] = useState(1);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleStep = (index: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatTime = (time?: string) => {
    if (!time) return null;
    return time;
  };

  const renderIngredientInline = (ingredient: ParsedIngredient) => {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 
                     text-blue-800 dark:text-blue-200 rounded text-sm font-medium mx-1">
        {formatIngredientForStep(ingredient)}
      </span>
    );
  };

  const renderStepWithIngredients = (instruction: RecipeInstruction) => {
    if (!instruction.ingredients || instruction.ingredients.length === 0) {
      return instruction.text;
    }

    let text = instruction.text;
    const ingredientMatches: { ingredient: ParsedIngredient; name: string }[] = [];

    // Find matching ingredients for this step
    instruction.ingredients.forEach(ingredientName => {
      const ingredient = recipe.ingredients.find(ing => 
        ing.ingredient.toLowerCase().includes(ingredientName.toLowerCase()) ||
        ingredientName.toLowerCase().includes(ing.ingredient.toLowerCase())
      );
      if (ingredient) {
        ingredientMatches.push({ ingredient, name: ingredientName });
      }
    });

    // Replace ingredient mentions with inline components
    ingredientMatches.forEach(({ ingredient, name }) => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      text = text.replace(regex, `__INGREDIENT_${ingredient.ingredient}__`);
    });

    // Split text and render with inline ingredients
    const parts = text.split(/__INGREDIENT_([^_]+)__/);
    
    return (
      <span>
        {parts.map((part, index) => {
          if (index % 2 === 0) {
            return part; // Regular text
          } else {
            // Find the ingredient for this part
            const ingredient = recipe.ingredients.find(ing => 
              ing.ingredient === part
            );
            return ingredient ? renderIngredientInline(ingredient) : part;
          }
        })}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center text-blue-600 dark:text-blue-400 
                   hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </button>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>From {recipe.domain}</span>
          <span>•</span>
          <span>Parsed via {recipe.source}</span>
          <span>•</span>
          <span>{recipe.parseTime}ms</span>
        </div>
      </div>

      {/* Recipe Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {recipe.title}
        </h1>
        
        {recipe.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {recipe.description}
          </p>
        )}

        {/* Recipe Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {recipe.totalTime && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl mb-1">⏱️</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
              <div className="font-medium">{formatTime(recipe.totalTime)}</div>
            </div>
          )}
          {recipe.prepTime && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl mb-1">🥄</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Prep Time</div>
              <div className="font-medium">{formatTime(recipe.prepTime)}</div>
            </div>
          )}
          {recipe.cookTime && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cook Time</div>
              <div className="font-medium">{formatTime(recipe.cookTime)}</div>
            </div>
          )}
          {recipe.servings && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Servings</div>
              <div className="font-medium">{recipe.servings}</div>
            </div>
          )}
        </div>

        {/* Hero Image */}
        {recipe.images.length > 0 && (
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6">
            <Image
              src={recipe.images[0]}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-1 md:col-span-1">
          <div className="sticky top-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ingredients
              </h2>
              
              {/* Servings Adjuster - We'll implement this in Step 8 */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Servings adjustment coming in Step 8!
                </div>
              </div>

              <div className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${checkedIngredients[index] 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkedIngredients[index] || false}
                      onChange={() => toggleIngredient(index)}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className={`${checkedIngredients[index] ? 'line-through' : ''}`}>
                        {ingredient.quantity && (
                          <span className="font-medium">
                            {ingredient.quantity} {ingredient.unit && `${ingredient.unit} `}
                          </span>
                        )}
                        <span>{ingredient.ingredient}</span>
                        {ingredient.preparation && (
                          <span className="text-gray-600 dark:text-gray-400">
                            , {ingredient.preparation}
                          </span>
                        )}
                        {ingredient.optional && (
                          <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                            (optional)
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Timer Panel */}
            <TimerPanel />
          </div>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-3 md:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Instructions
          </h2>
          
          <div className="space-y-6">
            {recipe.instructions.map((instruction, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-colors
                  ${checkedSteps[index] 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleStep(index)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                        ${checkedSteps[index]
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-500'
                        }`}
                    >
                      {checkedSteps[index] ? '✓' : instruction.step}
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <div className={`text-gray-900 dark:text-gray-100 leading-relaxed
                      ${checkedSteps[index] ? 'line-through opacity-75' : ''}`}>
                      {renderStepWithIngredients(instruction)}
                    </div>
                    
                    {/* Timer Button */}
                    {instruction.duration && (
                      <div className="mt-3">
                        <TimerButton 
                          duration={instruction.duration} 
                          stepNumber={instruction.step}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      {recipe.author && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Recipe by <span className="font-medium">{recipe.author}</span>
          </p>
        </div>
      )}
    </div>
  );
}
