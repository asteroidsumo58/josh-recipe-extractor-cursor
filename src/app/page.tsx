'use client';

import { useState, useEffect } from 'react';
import RecipeForm from '@/components/RecipeForm';
import RecipeView from '@/components/RecipeView';
import ErrorDisplay from '@/components/ErrorDisplay';
import { RecipeLoadingState } from '@/components/LoadingSpinner';
import { Recipe } from '@/types/recipe';
import { ParseError } from '@/types/api';
import { TimerProvider } from '@/contexts/TimerContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ThemeToggle from '@/components/ThemeToggle';
import ThemeDebugPanel from '@/components/ThemeDebugPanel';

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

  // Debug logging for CSS troubleshooting
  useEffect(() => {
    console.log('🎨 CSS Debug - Page loaded');
    console.log('📱 Window dimensions:', window.innerWidth, 'x', window.innerHeight);
    console.log('🌙 Current theme class:', document.documentElement.className);
    console.log('🎯 Body computed styles:', getComputedStyle(document.body));

    // Check if our CSS is being applied
    const bodyStyles = getComputedStyle(document.body);
    console.log('🎨 Body background-image:', bodyStyles.backgroundImage);
    console.log('🎨 Body background-size:', bodyStyles.backgroundSize);
    console.log('🎨 Body background-color:', bodyStyles.backgroundColor);

    // Check specific button styles
    const testButton = document.querySelector('button');
    if (testButton) {
      const buttonStyles = getComputedStyle(testButton);
      console.log('🔵 Button background-color:', buttonStyles.backgroundColor);
      console.log('🔵 Button color:', buttonStyles.color);
    }

    // Test CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    console.log('🎨 CSS Variables:');
    console.log('--background:', rootStyles.getPropertyValue('--background'));
    console.log('--primary:', rootStyles.getPropertyValue('--primary'));
    console.log('--foreground:', rootStyles.getPropertyValue('--foreground'));

    // Add a mutation observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          console.log('🎨 Theme changed to:', document.documentElement.className);
          console.log('🎨 New body background:', getComputedStyle(document.body).backgroundImage);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <TimerProvider>
        <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 relative">
          {/* Theme Toggle */}
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 to-red-500 bg-clip-text text-transparent">
            Recipe Extractor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Extract and display recipes from any URL with smart parsing and kitchen-friendly features
          </p>
        </header>

        {/* Debug Panel */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
              🎨 CSS Debug Panel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="font-medium text-gray-700 dark:text-gray-300">Theme Status</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: <span className="font-mono">Check console logs</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="font-medium text-gray-700 dark:text-gray-300">Button Test</div>
                <button className="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors">
                  Test Button
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="font-medium text-gray-700 dark:text-gray-300">Background Test</div>
                <div className="mt-2 w-full h-16 bg-gradient-to-r from-yellow-400 to-orange-500 to-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  Gradient Test
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
              <div className="font-semibold mb-2">Debug Actions:</div>
              <button
                onClick={() => {
                  console.log('🔍 Manual CSS Debug:');
                  console.log('Body styles:', getComputedStyle(document.body));
                  console.log('Theme classes:', document.documentElement.className);
                  alert('Check console for debug info!');
                }}
                className="mr-2 mb-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Debug CSS
              </button>
              <button
                onClick={() => {
                  // Force CSS injection
                  const style = document.createElement('style');
                  style.textContent = `
                    body {
                      background: #ffffff !important;
                      background-image: radial-gradient(circle at 4px 4px, rgba(0, 0, 0, 0.8) 4px, transparent 0) !important;
                      background-size: 20px 20px !important;
                    }
                    .dark body {
                      background: #0a0a0a !important;
                      background-image: radial-gradient(circle at 4px 4px, rgba(255, 255, 255, 0.9) 4px, transparent 0) !important;
                      background-size: 20px 20px !important;
                    }
                    button.bg-blue-700 {
                      background-color: #1d4ed8 !important;
                      color: white !important;
                    }
                  `;
                  document.head.appendChild(style);
                  console.log('💉 CSS injected manually');
                  alert('CSS injected! Refresh the page to see if it persists.');
                }}
                className="mr-2 mb-2 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Inject CSS
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="mr-2 mb-2 px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
              >
                Hard Refresh
              </button>
              <div className="mt-2 text-gray-600 dark:text-gray-400">
                Open DevTools Console to see: 🎨 CSS Debug messages
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main role="main">
          {state === 'form' && (
            <section aria-label="Recipe URL input form">
              <RecipeForm 
                onSubmit={handleSubmit} 
                loading={false}
              />
            </section>
          )}

          {state === 'loading' && (
            <section aria-label="Loading recipe" aria-live="polite">
              <RecipeLoadingState />
            </section>
          )}

          {state === 'recipe' && recipe && (
            <section aria-label="Recipe display">
              <RecipeView 
                recipe={recipe} 
                onBack={handleBack}
              />
            </section>
          )}

          {state === 'error' && error && (
            <section aria-label="Error message" role="alert">
              <ErrorDisplay 
                error={error} 
                onRetry={handleRetry}
                onReset={handleReset}
              />
            </section>
          )}
        </main>

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
        
        {/* Debug Panel - only show in development */}
        {process.env.NODE_ENV === 'development' && <ThemeDebugPanel />}
      </ErrorBoundary>
    );
  }