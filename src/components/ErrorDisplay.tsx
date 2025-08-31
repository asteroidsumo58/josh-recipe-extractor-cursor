'use client';

import { ParseError } from '@/app/api/parse/route';

interface ErrorDisplayProps {
  error: ParseError;
  onRetry: () => void;
  onReset: () => void;
}

export default function ErrorDisplay({ error, onRetry, onReset }: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.error) {
      case 'fetch_failed':
        return '🌐';
      case 'no_recipe_found':
        return '🔍';
      case 'forbidden_url':
        return '🚫';
      case 'invalid_url':
        return '⚠️';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (error.error) {
      case 'fetch_failed':
        return 'Connection Failed';
      case 'no_recipe_found':
        return 'No Recipe Found';
      case 'forbidden_url':
        return 'URL Not Allowed';
      case 'invalid_url':
        return 'Invalid URL';
      default:
        return 'Something Went Wrong';
    }
  };

  const canRetry = error.error === 'fetch_failed';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start">
          <div className="text-4xl mr-4" role="img" aria-label="Error icon">
            {getErrorIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              {getErrorTitle()}
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error.message}
            </p>
            {error.suggestion && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                💡 {error.suggestion}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              {canRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                           transition-colors duration-200"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                         transition-colors duration-200"
              >
                Try Different URL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual recipe input fallback */}
      {error.error === 'no_recipe_found' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Manual Recipe Entry
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Can't find structured recipe data? You can paste the recipe text manually:
          </p>
          <textarea
            placeholder="Paste recipe ingredients and instructions here..."
            className="w-full h-32 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     transition-colors duration-200"
          >
            Parse Manual Recipe
          </button>
        </div>
      )}

      {/* Common issues help */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Common Issues
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Some sites block automated requests (try copying the URL from a different browser)</li>
          <li>• Recipe must be publicly accessible (not behind a paywall or login)</li>
          <li>• URL should point directly to a recipe page, not a recipe list or homepage</li>
          <li>• Some sites require JavaScript - try the manual entry option above</li>
        </ul>
      </div>
    </div>
  );
}
