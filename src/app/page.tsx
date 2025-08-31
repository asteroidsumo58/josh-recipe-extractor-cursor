'use client';

import { useState } from 'react';
import RecipeForm from '@/components/RecipeForm';
import RecipeView from '@/components/RecipeView';
import ErrorDisplay from '@/components/ErrorDisplay';
import { RecipeLoadingState } from '@/components/LoadingSpinner';
import { Recipe } from '@/types/recipe';
import { ParseError } from '@/app/api/parse/route';
import { TimerProvider } from '@/contexts/TimerContext';

type AppState = 'form' | 'loading' | 'recipe' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('form');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<ParseError | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const handleSubmit = async (url: string) => {
    setState('loading');
    setCurrentUrl(url);
    setError(null);
    setRecipe(null);

    try {
      const response = await fetch(`/api/parse?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data);
        setState('error');
        return;
      }

      setRecipe(data);
      setState('recipe');
    } catch (err) {
      setError({
        error: 'fetch_failed',
        message: 'Failed to connect to the server. Please check your internet connection and try again.',
        suggestion: 'Make sure you have a stable internet connection and the URL is accessible.'
      });
      setState('error');
    }
  };

  const handleRetry = () => {
    if (currentUrl) {
      handleSubmit(currentUrl);
    }
  };

  const handleReset = () => {
    setState('form');
    setRecipe(null);
    setError(null);
    setCurrentUrl('');
  };

  const handleBack = () => {
    setState('form');
    setRecipe(null);
  };

  return (
    <TimerProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Recipe Extractor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Extract and display recipes from any URL with smart parsing and kitchen-friendly features
          </p>
        </div>

        {/* Main Content */}
        {state === 'form' && (
          <RecipeForm 
            onSubmit={handleSubmit} 
            loading={false}
          />
        )}

        {state === 'loading' && <RecipeLoadingState />}

        {state === 'recipe' && recipe && (
          <RecipeView 
            recipe={recipe} 
            onBack={handleBack}
          />
        )}

        {state === 'error' && error && (
          <ErrorDisplay 
            error={error} 
            onRetry={handleRetry}
            onReset={handleReset}
          />
        )}

        {/* Features Preview (only show on form state) */}
        {state === 'form' && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="font-semibold mb-2">Smart Parsing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically extracts ingredients, quantities, and instructions from any recipe website
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="text-3xl mb-3">⏱️</div>
                <h3 className="font-semibold mb-2">Auto Timers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detects cooking times in instructions and provides built-in timers
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="text-3xl mb-3">📏</div>
                <h3 className="font-semibold mb-2">Recipe Scaling</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Easily adjust serving sizes with automatic quantity recalculation
                </p>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="font-semibold mb-2">Kitchen Ready</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mobile-friendly design with checkboxes and large tap targets
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </TimerProvider>
  );
}