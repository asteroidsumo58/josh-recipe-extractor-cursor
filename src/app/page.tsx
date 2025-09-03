'use client';

import { useState } from 'react';
import RecipeForm from '@/components/RecipeForm';
import RecipeView from '@/components/RecipeView';
import ErrorDisplay from '@/components/ErrorDisplay';
import { RecipeLoadingState } from '@/components/LoadingSpinner';
import { Recipe } from '@/types/recipe';
import { ParseError } from '@/types/api';
import { TimerProvider } from '@/contexts/TimerContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ThemeToggle from '@/components/ThemeToggle';
import {
  SparklesIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

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
        message:
          'Failed to connect to the server. Please check your internet connection and try again.',
        suggestion:
          'Make sure you have a stable internet connection and the URL is accessible.',
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

  const features = [
    {
      icon: SparklesIcon,
      title: 'Smart Parsing',
      description:
        'Automatically extracts ingredients, quantities, and instructions from any recipe website',
    },
    {
      icon: ClockIcon,
      title: 'Auto Timers',
      description:
        'Detects cooking times in instructions and provides built-in timers',
    },
    {
      icon: AdjustmentsHorizontalIcon,
      title: 'Recipe Scaling',
      description:
        'Easily adjust serving sizes with automatic quantity recalculation',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Kitchen Ready',
      description:
        'Mobile-friendly design with checkboxes and large tap targets',
    },
  ];

  return (
    <ErrorBoundary>
      <TimerProvider>
        <div className="min-h-screen py-10 px-4 fade-in">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <header className="text-center mb-12 relative">
              <div className="absolute top-0 right-0">
                <ThemeToggle />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Recipe Extractor
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Extract and display recipes from any URL with smart parsing and kitchen-friendly features
              </p>
            </header>

            {/* Main Content */}
            <main role="main" className="space-y-8">
              {state === 'form' && (
                <section aria-label="Recipe URL input form">
                  <RecipeForm onSubmit={handleSubmit} loading={false} />
                </section>
              )}

              {state === 'loading' && (
                <section aria-label="Loading recipe" aria-live="polite">
                  <RecipeLoadingState />
                </section>
              )}

              {state === 'recipe' && recipe && (
                <section aria-label="Recipe display">
                  <RecipeView recipe={recipe} onBack={handleBack} />
                </section>
              )}

              {state === 'error' && error && (
                <section aria-label="Error message" role="alert">
                  <ErrorDisplay error={error} onRetry={handleRetry} onReset={handleReset} />
                </section>
              )}
            </main>

            {/* Features Preview */}
            {state === 'form' && (
              <div className="mt-16 max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {features.map((feature, idx) => (
                    <div
                      key={feature.title}
                      className="group text-center p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg fade-in"
                      style={{ animationDelay: `${idx * 0.1 + 0.2}s` }}
                    >
                      <feature.icon className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110" />
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </TimerProvider>
    </ErrorBoundary>
  );
}
