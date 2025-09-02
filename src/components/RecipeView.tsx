'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { Recipe, ParsedIngredient, RecipeInstruction } from '@/types/recipe';
import { formatIngredientForStep } from '@/lib/parsers/ingredient-parser';
import { useRecipeScaling } from '@/hooks/useRecipeScaling';
import TimerButton from './TimerButton';
import TimerPanel from './TimerPanel';
import ServingsControl from './ServingsControl';
 

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

function RecipeView({ recipe, onBack }: RecipeViewProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<IngredientCheckState>({});
  const [checkedSteps, setCheckedSteps] = useState<StepCheckState>({});
  
  // Use recipe scaling hook
  const {
    scaledRecipe,
    currentServings,
    originalServings,
    scalingMultiplier,
    setServings,
    resetToOriginal,
    canScaleDown,
    canScaleUp,
  } = useRecipeScaling(recipe);

  const toggleIngredient = useCallback((index: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  const toggleStep = useCallback((index: number) => {
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

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

    // Find matching ingredients for this step (use scaled ingredients)
    instruction.ingredients.forEach(ingredientName => {
      const ingredient = scaledRecipe.ingredients.find(ing => 
        ing.ingredient.toLowerCase().includes(ingredientName.toLowerCase()) ||
        ingredientName.toLowerCase().includes(ing.ingredient.toLowerCase())
      );
      if (ingredient) {
        ingredientMatches.push({ ingredient, name: ingredientName });
      }
    });

    // Replace ingredient mentions with inline components
    ingredientMatches.forEach(({ ingredient, name }) => {
      // Escape special regex characters to prevent invalid regex errors
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');
      text = text.replace(regex, `__INGREDIENT_${ingredient.ingredient}__`);
    });

    // Split text and render with inline ingredients
    const parts = text.split(/__INGREDIENT_([^_]+)__/);
    
    return (
      <span>
        {parts.map((part, index) => {
          if (index % 2 === 0) {
            return <span key={index}>{part}</span>; // Regular text with key
          } else {
            // Find the scaled ingredient for this part
            const ingredient = scaledRecipe.ingredients.find(ing => 
              ing.ingredient === part
            );
            return ingredient ? (
              <span key={index}>{renderIngredientInline(ingredient)}</span>
            ) : (
              <span key={index}>{part}</span>
            );
          }
        })}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 relative">
        <div className="flex justify-between items-start">
          <button
            onClick={onBack}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 
                     hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>From {scaledRecipe.domain}</span>
          <span>•</span>
          <span>Parsed via {scaledRecipe.source}</span>
          <span>•</span>
          <span>{scaledRecipe.parseTime}ms</span>
          {scalingMultiplier !== 1 && (
            <>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Scaled {scalingMultiplier}×
              </span>
            </>
          )}
        </div>
      </div>

      {/* Recipe Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {scaledRecipe.title}
        </h1>
        
        {scaledRecipe.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {scaledRecipe.description}
          </p>
        )}

        {/* Recipe Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {scaledRecipe.totalTime && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl mb-1">⏱️</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
              <div className="font-medium">{formatTime(scaledRecipe.totalTime)}</div>
            </div>
          )}
          {scaledRecipe.prepTime && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl mb-1">🥄</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Prep Time</div>
              <div className="font-medium">{formatTime(scaledRecipe.prepTime)}</div>
            </div>
          )}
          {scaledRecipe.cookTime && (
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cook Time</div>
              <div className="font-medium">{formatTime(scaledRecipe.cookTime)}</div>
            </div>
          )}
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Servings</div>
            <div className="font-medium text-blue-600 dark:text-blue-400">{currentServings}</div>
            {scalingMultiplier !== 1 && (
              <div className="text-xs text-blue-500 dark:text-blue-300">
                (was {originalServings})
              </div>
            )}
          </div>
        </div>

        {/* Hero Image */}
        {scaledRecipe.images.length > 0 && (
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6">
            <Image
              src={scaledRecipe.images[0]}
              alt={scaledRecipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-5 md:grid-cols-4 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-2 md:col-span-2">
          <div className="sticky top-6 space-y-6 min-w-0">
            <div>
              <h2 id="ingredients-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ingredients
              </h2>
              
              {/* Servings Control */}
              <ServingsControl
                originalServings={originalServings}
                currentServings={currentServings}
                scalingMultiplier={scalingMultiplier}
                onServingsChange={setServings}
                onReset={resetToOriginal}
                canScaleDown={canScaleDown}
                canScaleUp={canScaleUp}
                className="mb-4"
              />

              <div className="space-y-3" role="list" aria-labelledby="ingredients-heading">
                {scaledRecipe.ingredients.map((ingredient, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${checkedIngredients[index] 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    role="listitem"
                  >
                    <input
                      type="checkbox"
                      checked={checkedIngredients[index] || false}
                      onChange={() => toggleIngredient(index)}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      aria-label={`Mark ${ingredient.ingredient} as completed`}
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
          <h2 id="instructions-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Instructions
          </h2>
          
          <ol className="space-y-6" role="list" aria-labelledby="instructions-heading">
            {scaledRecipe.instructions.map((instruction, index) => (
              <li
                key={index}
                className={`p-4 rounded-lg border-2 transition-colors
                  ${checkedSteps[index] 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                role="listitem"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleStep(index)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                        ${checkedSteps[index]
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-500'
                        }`}
                      aria-label={`Mark step ${instruction.step} as ${checkedSteps[index] ? 'incomplete' : 'complete'}`}
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
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Footer */}
      {scaledRecipe.author && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Recipe by <span className="font-medium">{scaledRecipe.author}</span>
            {scalingMultiplier !== 1 && (
              <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                (scaled {scalingMultiplier}× from original)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(RecipeView);
