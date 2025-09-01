'use client';

import { useState } from 'react';

interface RecipeFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export default function RecipeForm({ onSubmit, loading }: RecipeFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
    if (!url.trim()) {
      setError('Please enter a recipe URL');
      return;
    }
    
    try {
      new URL(url);
      setError('');
      onSubmit(url.trim());
    } catch {
      setError('Please enter a valid URL');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  const exampleUrls = [
    'https://www.allrecipes.com/recipe/20680/easy-mexican-casserole/',
    'https://downshiftology.com/recipes/mediterranean-ground-beef-stir-fry/',
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="recipe-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipe URL
          </label>
          <div className="relative">
            <input
              id="recipe-url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/recipe"
              disabled={loading}
              className={`
                w-full px-4 py-3 text-lg border rounded-lg shadow-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                dark:bg-gray-800 dark:border-gray-600 dark:text-white
                dark:placeholder-gray-400 dark:disabled:bg-gray-700
                ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
              `}
              aria-describedby={error ? 'url-error' : undefined}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          {error && (
            <p id="url-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={`
            w-full px-6 py-3 text-lg font-medium rounded-lg
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${loading || !url.trim()
              ? 'bg-blue-700 text-white opacity-60 cursor-not-allowed'
              : 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-500'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Extracting Recipe...
            </span>
          ) : (
            'Extract Recipe'
          )}
        </button>
      </form>

      {/* Example URLs */}
      <div className="mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Try these example recipes:</p>
        <div className="space-y-2">
          {exampleUrls.map((exampleUrl, index) => (
            <button
              key={index}
              onClick={() => !loading && setUrl(exampleUrl)}
              disabled={loading}
              className="block w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 
                         hover:bg-blue-50 dark:hover:bg-gray-800 rounded border border-blue-200 
                         dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200"
            >
              {new URL(exampleUrl).hostname}
            </button>
          ))}
        </div>
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Supported Sites
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Works with most recipe websites including AllRecipes, Food Network, Serious Eats, 
          and thousands of food blogs. The app automatically detects structured recipe data 
          or falls back to intelligent HTML parsing.
        </p>
      </div>
    </div>
  );
}
